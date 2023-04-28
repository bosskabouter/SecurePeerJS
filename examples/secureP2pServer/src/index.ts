import {
  SecureCommunicationKey,
  ExpressSecurePeerServer
} from 'securepeerserver'
import { createExpressPushServer } from 'securepushserver'

import express from 'express'

import http from 'http'
import cors from 'cors'

import TEST_VALUES from '../../example-config.json'
const PORT = TEST_VALUES.testConfig.server.port

const app = express()

app.get('/', (_req: Request, res: any) => res.send('Hello secure p2p world!'))

const server = http.createServer(app)

// we use both secure - push and peerserver with the same key, but they can use their own.
SecureCommunicationKey.create(TEST_VALUES.testConfig.server.seed).then((key) => {
  app.use(cors())

  const securePushServer = createExpressPushServer(key, { keys: TEST_VALUES.testConfig.vapid, subject: TEST_VALUES.testConfig.vapid.subject }, server, { path: TEST_VALUES.testConfig.server.SEC_PUSH_CTX })

  app.use(securePushServer)

  const securePeerServer = ExpressSecurePeerServer(
    key,
    server,
    {
      key: 'securepeerjs',
      path: TEST_VALUES.testConfig.server.SEC_PEER_CTX,
      allow_discovery: true,
      proxied: false
    })

  app.use(securePeerServer)

  securePeerServer.on('error', (e) => { console.error(e) })
  server.listen(PORT, () => {
    console.info('🛡️ Secure P2P Server started with public key', key.peerId, `listening port: ${PORT.toString()}`)
  })
}).catch(console.error)
