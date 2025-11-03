import type { source } from "@/src/app/source";
import type { InferPageType } from "fumadocs-core/source";;

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}