import type { Parents, Root } from 'mdast'
import {
  mdxJsxToMarkdown,
  type MdxJsxFlowElement,
  type MdxJsxTextElement
} from 'mdast-util-mdx-jsx'
import type {
  Info,
  State,
  Options as ToMarkdownOptions
} from 'mdast-util-to-markdown'
import type { Processor, Transformer } from 'unified'

type JsxNode = MdxJsxFlowElement | MdxJsxTextElement

// Get the default MDX JSX handler from mdast-util-mdx-jsx
const mdxJsxExtension = mdxJsxToMarkdown()
const defaultMdxJsxHandler = mdxJsxExtension.handlers!.mdxJsxFlowElement!

/**
 * Creates a handler for HumanContent/LLMContent JSX elements.
 * - HumanContent: serializes to empty string (hidden from LLMs)
 * - LLMContent: serializes children only (unwrapped, visible to LLMs)
 * - Other elements: delegates to default mdast-util-mdx-jsx handler
 */
function createJsxHandler(isFlow: boolean) {
  return function handler(
    node: JsxNode,
    parent: Parents | undefined,
    state: State,
    info: Info
  ): string {
    // HumanContent: serialize to empty string (hide from LLMs)
    if (node.name === 'HumanContent') {
      return ''
    }

    // LLMContent: serialize children only (unwrap for LLMs)
    if (node.name === 'LLMContent') {
      return isFlow
        ? state.containerFlow(node as MdxJsxFlowElement, info)
        : state.containerPhrasing(node, info)
    }

    // Default: delegate to mdast-util-mdx-jsx handler
    return defaultMdxJsxHandler(node, parent, state, info)
  }
}

/**
 * Remark plugin that handles audience-specific content for LLM output.
 *
 * For processed markdown (used by llms-full.txt and .mdx endpoints):
 * - HumanContent serializes to empty string (hidden from LLMs)
 * - LLMContent serializes children only (unwrapped, visible to LLMs)
 *
 * The React components control visibility in HTML rendering separately.
 *
 * Note: Extra blank lines from empty HumanContent are collapsed in get-llm-text.ts
 */
export function remarkAudience(this: Processor): Transformer<Root, Root> {
  const data = this.data() as {
    toMarkdownExtensions?: ToMarkdownOptions['extensions']
  }
  data.toMarkdownExtensions ??= []

  data.toMarkdownExtensions.push({
    handlers: {
      mdxJsxFlowElement: createJsxHandler(true),
      mdxJsxTextElement: createJsxHandler(false)
    }
  })

  // No tree transformation - we only customize serialization handlers
  // This ensures the React compilation still sees all nodes
  return (tree: Root) => tree
}
