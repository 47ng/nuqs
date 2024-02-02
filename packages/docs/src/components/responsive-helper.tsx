export function ResponsiveHelper() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  return (
    <aside
      className="
      pointer-events-none fixed bottom-4 right-4 flex select-none gap-2
      rounded border bg-background px-2 py-1 font-mono text-xs shadow-xl
      "
    >
      <span className="opacity-25 sm:opacity-100">sm</span>
      <span className="opacity-25 md:opacity-100">md</span>
      <span className="opacity-25 lg:opacity-100">lg</span>
      <span className="opacity-25 xl:opacity-100">xl</span>
    </aside>
  )
}
