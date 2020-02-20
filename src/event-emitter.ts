export class EventEmitter <T extends { [channel: string]: unknown }> {
  private events = new Map<keyof T, Function[]>()

  on <C extends keyof T> (channel: C, listener: (data: T[C]) => void) {
    let listeners = this.events.get(channel)
    if (!listeners) this.events.set(channel, listeners = [])
    if (!listeners.includes(listener)) listeners.push(listener)
  }

  off <C extends keyof T> (channel: C, listener: (data: T[C]) => void) {
    const listeners = this.events.get(channel)
    const index = listeners?.indexOf(listener) ?? -1
    if (index !== -1) listeners?.splice(index, 1)
  }

  emit <C extends keyof T> (channel: C, data: T[C]) {
    const listeners = this.events.get(channel)
    if (!listeners) return
    for (const listener of listeners) listener(data)
  }
}
