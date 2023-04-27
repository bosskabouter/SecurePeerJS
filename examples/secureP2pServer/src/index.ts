import { // createSecureExpressPeerServer,
  SecureCommunicationKey, SecurePeerServer
} from 'securepeerserver'
import { createExpressPushServer } from 'securepushserver'

import express from 'express'

import http from 'http'
import cors from 'cors'

import TEST_VALUES from '../../example-config.json'
import {
// ExpressPeerServer,
// PeerServer
} from 'peer'
const PORT = TEST_VALUES.testConfig.server.port

const app = express()

// app.get('/', (_req: Request, res: any) => res.send('Hello secure p2p world!'))

const server = http.createServer(app)

// we use both secure - push and peerserver with the same key, but they can use their own.
SecureCommunicationKey.create(TEST_VALUES.testConfig.server.seed).then((key) => {
  app.use(cors())

  const securePushServer = createExpressPushServer(key, { keys: TEST_VALUES.testConfig.vapid, subject: TEST_VALUES.testConfig.vapid.subject }, server, { path: TEST_VALUES.testConfig.server.SEC_PUSH_CTX })

  app.use(securePushServer)

  const securePeerServer = SecurePeerServer(
    key,
    // server,
    {
      key: 'securepeerjs',
      port: PORT + 1,
      path: '/', // TEST_VALUES.testConfig.server.SEC_PEER_CTX,
      // corsOptions: { origin: 'http://localhost:5173' },
      //  host: 'localhost',
      allow_discovery: true,
      proxied: false
    })

  // app.use(securePeerServer)

  securePeerServer.on('connection', (c) => { console.info(c) })
  securePeerServer.on('error', (e) => { console.error(e) })
  app.listen(PORT, () => {
    console.info('🛡️ Secure P2P Server started!', `Public key: ${key.peerId}`, `listening port: ${PORT.toString()}`)
  })

  app.addListener('error', (e) => { console.error(e.toString()) })
  server.addListener('error', (e) => { console.error(e.toString()) })
  // server.addListener('clientError', (e) => { console.error(e) })
  // server.addListener('connect', (e) => { console.info(e) })
  // server.addListener('connection', (e) => { console.info(e) })
  // server.addListener('upgrade', (e) => { console.info(e) })
}).catch(e => { console.error(e) })
