export function compose(
  fns: React.TransitionStartFunction[],
  final: () => void
) {
  const recursiveCompose = (index: number) => {
    if (index === fns.length) {
      return final()
    }
    const fn = fns[index]
    if (!fn) {
      throw new Error('Invalid transition function')
    }
    fn(() => recursiveCompose(index + 1))
  }
  recursiveCompose(0)
}
