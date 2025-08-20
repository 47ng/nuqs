export function compose(
  fns: React.TransitionStartFunction[],
  final: () => void
): void {
  // Build a nested callback chain iteratively (avoids recursion helper)
  let next = final
  for (let i = fns.length - 1; i >= 0; i--) {
    const fn = fns[i]
    if (!fn) continue
    const prev = next
    next = () => fn(prev)
  }
  next()
}
