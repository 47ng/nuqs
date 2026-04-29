export type Resolvers<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}

export function withResolvers<T>(): Resolvers<T> {
  if (Promise.hasOwnProperty('withResolvers')) return Promise.withResolvers<T>()
  // todo: Remove this once Promise.withResolvers is Baseline GA (September 2026)
  const P = Promise<T>
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: any) => void
  const promise = new P((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
