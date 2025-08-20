export type Emitter<Events extends Record<string, unknown>> = {
  on<Key extends keyof Events>(
    type: Key,
    handler: (event: Events[Key]) => any
  ): () => void
  off<Key extends keyof Events>(
    type: Key,
    handler?: (event: Events[Key]) => any
  ): void
  emit<Key extends keyof Events>(
    type: Key,
    event?: Events[Key] extends undefined ? never : Events[Key]
  ): void
  all: Map<keyof Events, Array<(event: Events[keyof Events]) => any>>
}

export function createEmitter<
  Events extends Record<string, unknown>
>(): Emitter<Events> {
  const all: Map<
    keyof Events,
    Array<(event: Events[keyof Events]) => any>
  > = new Map()
  return {
    all,
    on<Key extends keyof Events>(
      type: Key,
      handler: (event: Events[Key]) => any
    ): () => void {
      const handlers = all.get(type) || []
      handlers.push(handler as (event: Events[keyof Events]) => any)
      all.set(type, handlers)
      return () => this.off(type, handler)
    },
    off<Key extends keyof Events>(
      type: Key,
      handler: (event: Events[Key]) => any
    ): void {
      const handlers = all.get(type)
      if (handlers) {
        all.set(
          type,
          handlers.filter(h => h !== handler)
        )
      }
    },
    emit<Key extends keyof Events>(
      type: Key,
      event?: Events[Key] extends undefined ? never : Events[Key]
    ): void {
      const handlers = all.get(type)
      handlers?.forEach(handler => handler(event as Events[keyof Events]))
    }
  }
}
