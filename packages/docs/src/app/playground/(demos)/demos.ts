import type * as PageTree from 'fumadocs-core/page-tree'

type DemoMetadata = {
  title: string
  description: string
}

export const demos = {
  'basic-counter': {
    title: 'Basic counter',
    description: 'State is stored in the URL query string'
  },
  batching: {
    title: 'Batching',
    description:
      'State updates are collected and batched into one update on the next tick.'
  },
  'hex-colors': {
    title: 'Hex colors',
    description: 'Parsing RGB values from a hex color'
  },
  pagination: {
    title: 'Pagination',
    description: 'Integer page index with server-side rendering'
  },
  'tic-tac-toe': {
    title: 'Tic Tac Toe',
    description:
      'A game of tic tac toe stored in the URL. Use the Back/Forward buttons to undo/redo moves.'
  }
} as const satisfies Record<string, DemoMetadata>

export function getMetadata(path: keyof typeof demos): DemoMetadata {
  return demos[path]
}

// --

export function getPlaygroundTree(): PageTree.Root {
  return {
    name: 'Playground',
    children: Object.entries(demos).map(([path, { title, description }]) => ({
      type: 'page',
      name: title,
      description,
      url: `/playground/${path}`
    }))
  }
}
