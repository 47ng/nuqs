export function compose(
  fns: React.TransitionStartFunction[],
  // A Promise return turns the innermost transition into an async action
  // (React 19), keeping its isPending true until the promise settles.
  final: () => void | Promise<void>
): void {
  // Build a nested callback chain iteratively (avoids recursion helper)
  let next: () => void | Promise<void> = final
  for (let i = fns.length - 1; i >= 0; i--) {
    const fn = fns[i]
    if (!fn) continue
    const prev = next
    next = () => fn(prev)
  }
  next()
}
