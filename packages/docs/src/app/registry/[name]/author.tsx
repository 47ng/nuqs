import { authorRegex } from '@/src/registry/schemas'

export function Author({ author }: { author: string }) {
  const [, name, githubUser] = author.match(authorRegex)!
  return (
    <a
      href={`https://github.com/${githubUser}`}
      className="hover:bg-foreground/5 rounded-lg"
      aria-label={`Author: @${githubUser} on GitHub`}
    >
      <div className="flex items-center gap-3 rounded-lg py-1 pr-3 pl-2">
        <img
          src={`https://github.com/${githubUser}.png`}
          role="presentation"
          alt=""
          className="size-9 rounded-full"
        />
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-fd-muted-foreground text-xs">@{githubUser}</p>
        </div>
      </div>
    </a>
  )
}
