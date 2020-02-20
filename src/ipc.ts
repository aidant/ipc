import { createSocket, SocketType, Socket, RemoteInfo } from 'dgram'
import { getIP, Family } from './ip.js'
import { RequestIncommingConnection, ApproveIncommingConnection, Packet } from './packet.js'
import { EventEmitter } from './event-emitter.js'

export interface IPCOptions {
  family?: Family
  address?: string
  port?: number
}

export abstract class IPC extends EventEmitter<{
  'request-incomming-connection': RemoteInfo
  'approve-incomming-connection': null
  // [channel: string]: Packet<string, unknown>
}> {
  protected family: Family
  protected address: string
  protected port: number
  protected socket: Socket

  static convertFamilyToSocketType (family: Family): SocketType {
    if (family === 'IPv4') return 'udp4'
    if (family === 'IPv6') return 'udp6'
    throw new Error()
  }

  constructor (options: IPCOptions = {}) {
    super()

    this.family = options.family || 'IPv4'
    this.address = options.address || getIP(this.family)
    this.port = options.port ?? 9001
    this.socket = createSocket({
      type: IPC.convertFamilyToSocketType(this.family)
    })

    this.socket.on('message', (buffer: Buffer, rinfo: RemoteInfo) => {
      const packet = Packet.deserialize<string, unknown>(buffer)

      switch (packet.type) {
        case 'request-incomming-connection':
          this.emit(packet.type, rinfo)
          break
        case 'approve-incomming-connection':
          this.emit(packet.type, null)
          break
        default:
          //@ts-ignore
          this.emit(packet.type, packet)
      }
    })
  }
}

export class Server extends IPC {
  async start () {
    await new Promise((resolve, reject) => {
      const onError = (error: Error) => {
        this.socket.off('error', onError)
        this.socket.off('listening', onListening)
        reject(error)
      }

      const onListening = () => {
        this.socket.off('error', onError)
        this.socket.off('listening', onListening)
        resolve()
      }

      this.socket.on('error', onError)
      this.socket.on('listening', onListening)

      this.socket.bind({
        address: this.address,
        port: this.port
      })
    })

    this.on('request-incomming-connection', (rinfo: RemoteInfo) => {
      this.socket.send(
        new ApproveIncommingConnection().serialize(),
        rinfo.port,
        rinfo.address
      )
    })
  }
}

export class Client extends IPC {
  async connect (options: { address?: string, port?: number } = {}) {
    const port = options.port ?? this.port
    const address = options.address || this.address

    await new Promise((resolve, reject) => {
      const onError = (error: Error) => {
        this.socket.off('error', onError)
        this.socket.off('connect', onConnected)
        reject(error)
      }

      const onConnected = () => {
        this.socket.off('error', onError)
        this.socket.off('connect', onConnected)
        resolve()
      }

      this.socket.on('error', onError)
      this.socket.on('connect', onConnected)

      this.socket.connect(port, address)
    })

    await new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout

      const onTimeout = () => {
        this.off('approve-incomming-connection', onConnectionApproved)
        reject(new Error('Connection Timeout'))
      }

      const onConnectionApproved = () => {
        clearTimeout(timeout)
        this.off('approve-incomming-connection', onConnectionApproved)
        resolve()
      }

      this.on('approve-incomming-connection', onConnectionApproved)

      this.socket.send(new RequestIncommingConnection().serialize(), (error) => {
        if (error) {
          this.off('approve-incomming-connection', onConnectionApproved)
          resolve(error)
        } else {
          timeout = setTimeout(onTimeout, 30000)
        }
      })
    })
  }
}
