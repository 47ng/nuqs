import type { Page } from '@/src/app/source';
import { github } from './utils';

export async function getLLMText(page: Page) {

  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

URL: ${page.url}
Source: https://raw.githubusercontent.com/${github.owner}/${github.repo}/refs/heads/${github.branch}/packages/docs/content/docs/${page.path}

${page.data.description ?? ''}
        
${processed}`;
}
