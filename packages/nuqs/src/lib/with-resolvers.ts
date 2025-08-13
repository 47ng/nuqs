export type Resolvers<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}

export function withResolvers<T>(): Resolvers<T> {
  const P = Promise<T>
  if ('withResolvers' in Promise) {
    return Promise.withResolvers<T>()
  }
  // todo: Remove this once Promise.withResolvers is Baseline GA (September 2026)
  let resolve: (value: T | PromiseLike<T>) => void = () => {}
  let reject: () => void = () => {}
  const promise = new P((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
