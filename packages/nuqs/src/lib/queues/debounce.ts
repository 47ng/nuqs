import { timeout } from '../timeout'
import { withResolvers } from '../with-resolvers'

export class DebouncedPromiseQueue<ValueType, OutputType> {
  key: string
  callback: (key: string, value: ValueType) => OutputType
  resolvers = withResolvers<OutputType>()
  controller = new AbortController()

  constructor(
    key: string,
    callback: (key: string, value: ValueType) => OutputType
  ) {
    this.key = key
    this.callback = callback
  }

  public push(value: ValueType, timeMs: number) {
    this.controller.abort()
    this.controller = new AbortController()
    timeout(
      () => {
        try {
          const output = this.callback(this.key, value)
          this.resolvers.resolve(output)
        } catch (error) {
          this.resolvers.reject(error)
        } finally {
          this.resolvers = withResolvers<OutputType>()
        }
      },
      timeMs,
      this.controller.signal
    )
    return this.resolvers.promise
  }
}
