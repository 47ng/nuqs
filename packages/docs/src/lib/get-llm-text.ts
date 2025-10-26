import type { source } from "@/src/app/source";
import type { InferPageType } from "fumadocs-core/source";;

const PAGE_EXCLUSIONS = [
  "/docs/about",
];

export async function getLLMText(page: InferPageType<typeof source>) {
  if (PAGE_EXCLUSIONS.includes(page.url)) {
    return null;
  }

  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}