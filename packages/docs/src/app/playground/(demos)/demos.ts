import type { PageTree } from 'next-docs-zeta/server'

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
  }
} as const satisfies Record<string, DemoMetadata>

export function getMetadata(path: keyof typeof demos): DemoMetadata {
  return demos[path]
}

// --

export function getPlaygroundTree(): PageTree {
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
