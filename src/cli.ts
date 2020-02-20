import { Server, Client } from './ipc.js'

const server = new Server()

const client = new Client()

server.start()
  .then(() => client.connect())
  .then(() => console.log('Connected!!'))
  .catch(console.error)
