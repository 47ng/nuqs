export function Author() {
  return (
    <a
      href="https://bsky.app/profile/francoisbest.com"
      className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-foreground/5"
      aria-description="Author"
    >
      <img
        src="/avatar-128.jpeg"
        role="presentation"
        className="size-9 rounded-full"
      />
      <div>
        <p className="font-semibold">François Best</p>
        <p className="text-xs text-fd-muted-foreground">@francoisbest.com</p>
      </div>
    </a>
  )
}
