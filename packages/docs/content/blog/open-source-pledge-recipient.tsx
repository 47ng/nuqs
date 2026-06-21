type OpenSourcePledgeRecipientProps = {
  handle: string
  name: string
}

export function OpenSourcePledgeRecipient({
  handle,
  name
}: OpenSourcePledgeRecipientProps) {
  return (
    <span>
      <img
        src={`https://github.com/${handle}.png`}
        alt={`${name}'s avatar`}
        role="presentation"
        width="16px"
        height="16px"
        className="not-prose my-1.5 mr-2 inline size-6 rounded-full align-middle"
      />
      <a href={`https://github.com/sponsors/${handle}`}>{name}</a>
    </span>
  )
}
