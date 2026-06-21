import type { ComponentProps } from 'react'

type GitHubProfileProps = ComponentProps<'span'> & {
  handle: string
  name?: string
  url?: string
}

export function GitHubProfile({
  handle,
  name = handle,
  url = `https://github.com/${handle}`,
  ...props
}: GitHubProfileProps) {
  return (
    <span {...props}>
      <img
        src={`https://github.com/${handle}.png`}
        alt={`${name}'s avatar`}
        role="presentation"
        width="16px"
        height="16px"
        className="not-prose inset-0 mr-1.5 ml-0.5 inline size-5 rounded-full align-middle"
      />
      <a href={url}>{name}</a>
    </span>
  )
}
