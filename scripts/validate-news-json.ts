import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IncomingNewsSchema } from "@/lib/validations/news";

function main(): void {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: tsx scripts/validate-news-json.ts <path>");
    process.exit(2);
  }
  const path = resolve(arg);
  const raw = readFileSync(path, "utf8");
  const json: unknown = JSON.parse(raw);
  const result = IncomingNewsSchema.safeParse(json);
  if (!result.success) {
    console.error(`✗ ${path} failed schema validation:`);
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    process.exit(1);
  }
  console.log(
    `✓ ${path} matches IncomingNewsSchema (items=${result.data.items.length})`,
  );
}

main();
