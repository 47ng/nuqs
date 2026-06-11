export function compose(
  fns: React.TransitionStartFunction[],
  final: () => void
): void {
  fns.reduceRight<() => void>((next, fn) => () => fn(next), final)()
}
