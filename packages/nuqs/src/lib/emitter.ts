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
}

export function createEmitter<
  Events extends Record<string, unknown>
>(): Emitter<Events> {
  type H = (event: Events[keyof Events]) => any
  const all = new Map<keyof Events, H[]>()
  return {
    on<Key extends keyof Events>(type: Key, handler: (event: Events[Key]) => any) {
      all.set(type, [...(all.get(type) ?? []), handler as H])
      return () => this.off(type, handler)
    },
    off<Key extends keyof Events>(type: Key, handler: (event: Events[Key]) => any) {
      const h = all.get(type)
      if (h) all.set(type, h.filter(x => x !== handler))
    },
    emit<Key extends keyof Events>(
      type: Key,
      event?: Events[Key] extends undefined ? never : Events[Key]
    ) {
      all.get(type)?.forEach(h => h(event as Events[keyof Events]))
    }
  }
}
