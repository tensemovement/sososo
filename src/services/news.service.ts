import { cache } from "react";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { LoadedNewsSchema, type StoredNews } from "@/lib/validations/news";
import seedJson from "@/data/news.seed.json";

interface S3Config {
  region: string;
  bucket: string;
  key: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Returns the S3 config if every required env var is present, otherwise null.
 * When null, the service falls back to bundled seed data — so local dev and the
 * first deploy (before the routine has ever uploaded) still render content.
 */
function getS3Config(): S3Config | null {
  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET;
  const key = process.env.S3_KEY;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !bucket || !key || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return { region, bucket, key, accessKeyId, secretAccessKey };
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

function loadSeed(): StoredNews {
  return LoadedNewsSchema.parse(seedJson);
}

async function readFromS3(cfg: S3Config): Promise<StoredNews> {
  const client = new S3Client({
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  const { Body } = await client.send(
    new GetObjectCommand({ Bucket: cfg.bucket, Key: cfg.key }),
  );
  if (!Body) {
    throw new Error("news.service: empty body from S3");
  }
  const text = await Body.transformToString("utf-8");
  const json: unknown = JSON.parse(text);
  return LoadedNewsSchema.parse(json);
}

/**
 * Loads the accumulated warm-news feed. Reads from S3 when configured; falls
 * back to bundled seed data when S3 is unconfigured or the object does not yet
 * exist. Cached per request via React `cache()`.
 */
export const loadNews = cache(async (): Promise<StoredNews> => {
  const cfg = getS3Config();
  if (!cfg) {
    return loadSeed();
  }
  try {
    return await readFromS3(cfg);
  } catch (err: unknown) {
    if (isMissingKeyError(err)) {
      return loadSeed();
    }
    throw err;
  }
});
