import { createSecureExpressPeerServer, SecureCommunicationKey } from 'securepeerserver'
import { createExpressPushServer } from 'securepushserver'

import express from 'express'

import http from 'http'

const app = express()

app.get('/', (_req: Request, res: any) => res.send('Hello world!'))

const server = http.createServer(app)

SecureCommunicationKey.create('a very Strong *a-hum* Server Key 1234').then((key) => {
  const vapidKeys = {
    publicKey:
'BEUo6k6HBBBHusLq6BOGYlpnr9lcq-9yuiKee0XpbkNPMQm20m7KPbz_eJz2nggEmnk9QkL2KxubYpHP-CY_pAg',
    privateKey:
    'YavzDUJGygLRqp8IpI1MMmZBL2wDSJG195O97GAzDg8'
  }
  console.info('SecurePeerKey', key.peerId)

  createExpressPushServer(key, { keys: vapidKeys, subject: 'mailto:test@test.com' }, server, { path: '/securepush' })
  // 7d169e89fbf1c82addbbe3d3f01c94239ee636fdd691fba5a915893d0bb93b3f
  createSecureExpressPeerServer(key, server, {
    port: 9000,
    path: '/securepeer'
  })
  app.listen(9000)
}).catch(console.error)
