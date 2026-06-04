import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IncomingNewsSchema } from "@/lib/validations/news";

function loadEnvLocal(): void {
  const path = resolve(".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `${name} is not set (provide via .env.local or routine environment)`,
    );
  }
  return v;
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: tsx scripts/upload-news-json.ts <path>");
    process.exit(2);
  }
  const path = resolve(arg);
  if (!existsSync(path)) {
    console.error(`✗ file not found: ${path}`);
    process.exit(1);
  }

  loadEnvLocal();
  const uploadUrl = requireEnv("UPLOAD_URL");
  const uploadToken = requireEnv("UPLOAD_TOKEN");

  const raw = readFileSync(path, "utf8");
  const json: unknown = JSON.parse(raw);
  const local = IncomingNewsSchema.safeParse(json);
  if (!local.success) {
    console.error(`✗ ${path} failed local schema check (will not POST):`);
    for (const issue of local.error.issues) {
      console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(`→ POST ${uploadUrl}`);
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${uploadToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: raw,
  });

  const responseText = await res.text();
  if (!res.ok) {
    console.error(`✗ upload failed: ${res.status} ${res.statusText}`);
    console.error(responseText);
    process.exit(1);
  }
  console.log(`✓ ${responseText}`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`✗ upload failed: ${message}`);
  process.exit(1);
});
