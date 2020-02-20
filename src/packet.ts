import v8 from 'v8'

export class Packet<T, D> {
  static deserialize<T, P> (buffer: Buffer) {
    const packet = v8.deserialize(buffer) as Packet<unknown, unknown>

    switch (packet.type) {
      case 'request-incomming-connection':
        return new RequestIncommingConnection()
      case 'approve-incomming-connection':
        return new ApproveIncommingConnection()
      default:
        return new this(packet) as Packet<T, P>
    }
  }

  version: 1 = 1
  type: T
  data: D

  constructor (packet: { version?: 1, type: T, data: D }) {
    switch (packet.version ?? 1) {
      case 1:
        this.type = packet.type
        this.data = packet.data
        break
      default:
        throw new Error(`Packet.version: "${packet.version}" can not be parsed.`)
    }
  }

  serialize (): Buffer {
    return v8.serialize(this)
  }
}

export class RequestIncommingConnection extends Packet<'request-incomming-connection', null> {
  constructor () {
    super({ type: 'request-incomming-connection', data: null })
  }
}
export class ApproveIncommingConnection extends Packet<'approve-incomming-connection', null> {
  constructor () {
    super({ type: 'approve-incomming-connection', data: null })
  }
}
