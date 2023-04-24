import express from 'express'
import type { IConfig } from '../../../config'

import * as webpush from 'web-push'
import { type SecureCommunicationKey, type SymmetricallyEncryptedMessage } from 'secure-communication-kit'
import { type WebPushRequest } from 'securepushjs'
const HTTP_ERROR_PUSH_TOO_BIG = 507

export default ({
  vapid,
  key,
  config
}: {
  vapid: {
    keys: webpush.VapidKeys
    subject: string }
  key: SecureCommunicationKey
  config: IConfig
}): express.Router => {
  const app = express.Router()

  const PUSH_MAX_BYTES = 4 * 1024

  // WEB-PUSH VAPID KEYS; `npm run vapid`
  webpush.setVapidDetails(vapid.subject, vapid.keys.publicKey, vapid.keys.privateKey)

  app.get('/test', (_request, response) => {
    response.send('<FORM method=\'POST\' action=`/send` ><INPUT TYPE=\'SUBMIT\' value=\'Post Test Push!\'/></FORM>')
  })

  /**
   * Post handler for push requests with body containing
   * `Array<{ destination: SymmetricallyEncryptedMessage, payload: SymmetricallyEncryptedMessage }>`
   */
  app.post(config.path, (request, response) => {
    try {
      response.send(sendAll(request.body as WebPushRequest).catch(e => { throw (e) }))
    } catch (error) {
      response.emit('error', error)
    }
  })

  async function sendAll (wpr: WebPushRequest): Promise<number[]> {
    const results = new Array<Promise<number>>()
    const pushes = key.receiveHandshake(wpr.senderId, wpr.handshake).decrypt(wpr.encryptedPushMessages)
    pushes.forEach((spm) => {
      console.info(spm)
      results.push(sendOne(spm.encryptedEndpoint, spm.encryptedPayload))
    })
    return await Promise.all(results)
  }

  async function sendOne (destination: SymmetricallyEncryptedMessage<PushSubscription>, payload: SymmetricallyEncryptedMessage<any>): Promise<number> {
    const subscription: PushSubscription = key.decryptSym(destination)

    const payloadBytes = Buffer.from(JSON.stringify(payload))

    if (payloadBytes.length >= PUSH_MAX_BYTES) {
      console.warn(`Message too big. Refusing push. ${payloadBytes.length}kb`
      )
      return (HTTP_ERROR_PUSH_TOO_BIG)
    }
    console.info('subscription', subscription)
    return (await webpush.sendNotification(subscription as unknown as webpush.PushSubscription, payloadBytes, { TTL: 1000 * 60 })).statusCode
  }

  return app
}
