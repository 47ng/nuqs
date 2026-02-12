export function Author({ author }: { author: string }) {
  const match = author.match(/(.*) <(.*)>/)
  const name = match ? match[1] : author
  const githubUser = match ? match[2] : undefined

  return (
    <a
      href={githubUser ? `https://github.com/${githubUser}` : undefined}
      className="hover:bg-foreground/5 flex items-center gap-3 rounded-lg px-2 py-1"
      aria-description="Author"
    >
      {githubUser && (
        <img
          src={`https://github.com/${githubUser}.png`}
          role="presentation"
          className="size-9 rounded-full"
        />
      )}
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-fd-muted-foreground text-xs">{githubUser}</p>
      </div>
    </a>
  )
}
