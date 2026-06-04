import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  IncomingNewsSchema,
  LoadedNewsSchema,
  StoredNewsSchema,
  type StoredNews,
} from "@/lib/validations/news";
import { mergeAccumulated } from "@/lib/news/merge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 128 * 1024;
const MAX_STORED_BYTES = 4 * 1024 * 1024; // 4 MiB — warm rewrites are longer than terse summaries.

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

const REVALIDATE_MAX_ATTEMPTS = 3;
const REVALIDATE_BACKOFF_MS = 50;

type RevalidateResult =
  | { path: string; ok: true; attempts: number }
  | { path: string; ok: false; attempts: number; error: string };

async function revalidateWithRetry(path: string): Promise<RevalidateResult> {
  let lastError = "unknown error";
  for (let attempt = 1; attempt <= REVALIDATE_MAX_ATTEMPTS; attempt++) {
    try {
      revalidatePath(path);
      return { path, ok: true, attempts: attempt };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : "unknown error";
      if (attempt < REVALIDATE_MAX_ATTEMPTS) {
        await new Promise((resolve) =>
          setTimeout(resolve, REVALIDATE_BACKOFF_MS * attempt),
        );
      }
    }
  }
  console.error(
    `[upload] revalidatePath("${path}") failed after ${REVALIDATE_MAX_ATTEMPTS} attempts: ${lastError}`,
  );
  return { path, ok: false, attempts: REVALIDATE_MAX_ATTEMPTS, error: lastError };
}

function isMissingKeyError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as {
    name?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };
  if (e.name === "NoSuchKey" || e.Code === "NoSuchKey") return true;
  if (e.$metadata?.httpStatusCode === 404) return true;
  return false;
}

async function readExisting(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<StoredNews | null> {
  try {
    const { Body } = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    if (!Body) return null;
    const text = await Body.transformToString("utf-8");
    const json: unknown = JSON.parse(text);
    return LoadedNewsSchema.parse(json);
  } catch (err: unknown) {
    if (isMissingKeyError(err)) return null;
    throw err;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const expectedToken = process.env.UPLOAD_TOKEN;
  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET;
  const key = process.env.S3_KEY;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (
    !expectedToken ||
    !region ||
    !bucket ||
    !key ||
    !accessKeyId ||
    !secretAccessKey
  ) {
    return NextResponse.json(
      { error: "server is not configured for uploads" },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ")
    ? auth.slice("Bearer ".length)
    : "";
  if (!presented || !constantTimeEquals(presented, expectedToken)) {
    return unauthorized();
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `payload too large (max ${MAX_BODY_BYTES} bytes)` },
      { status: 413 },
    );
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `payload too large (max ${MAX_BODY_BYTES} bytes)` },
      { status: 413 },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const incomingResult = IncomingNewsSchema.safeParse(parsed);
  if (!incomingResult.success) {
    return NextResponse.json(
      {
        error: "schema validation failed",
        issues: incomingResult.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  let prev: StoredNews | null;
  try {
    prev = await readExisting(client, bucket, key);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `failed to read existing feed: ${message}` },
      { status: 502 },
    );
  }

  const now = new Date().toISOString();
  const merged = mergeAccumulated(prev, incomingResult.data, now);

  const storedResult = StoredNewsSchema.safeParse(merged);
  if (!storedResult.success) {
    return NextResponse.json(
      {
        error: "merged payload failed stored schema validation",
        issues: storedResult.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 500 },
    );
  }

  const body = JSON.stringify(storedResult.data) + "\n";
  if (body.length > MAX_STORED_BYTES) {
    return NextResponse.json(
      { error: `merged payload exceeds stored cap (${MAX_STORED_BYTES} bytes)` },
      { status: 507 },
    );
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json; charset=utf-8",
      CacheControl: "no-cache, no-store",
    }),
  );

  // Revalidate the home + JSON proxy + every tag page touched by this batch.
  const touchedTags = new Set<string>();
  for (const item of storedResult.data.items) {
    for (const tag of item.tags) touchedTags.add(tag);
  }
  const pathsToRevalidate = [
    "/",
    "/today.json",
    ...Array.from(touchedTags).map((t) => `/tags/${encodeURIComponent(t)}`),
  ];
  const revalidateResults = await Promise.all(
    pathsToRevalidate.map((p) => revalidateWithRetry(p)),
  );
  const revalidateFailures = revalidateResults.filter(
    (r): r is Extract<RevalidateResult, { ok: false }> => !r.ok,
  );

  return NextResponse.json({
    ok: true,
    bucket,
    key,
    counts: { items: storedResult.data.items.length },
    incoming: { items: incomingResult.data.items.length },
    revalidate: {
      attempted: pathsToRevalidate.length,
      failed: revalidateFailures.length,
      failures: revalidateFailures.map((f) => ({
        path: f.path,
        attempts: f.attempts,
        error: f.error,
      })),
    },
  });
}
