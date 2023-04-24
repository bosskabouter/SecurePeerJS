import { generateVAPIDKeys } from 'web-push'
import * as webpush from 'web-push'
import request from 'supertest'
import { type AsymmetricallyEncryptedMessage, SecureCommunicationKey, type SymmetricallyEncryptedMessage } from 'secure-communication-kit'
import { createPushServer } from '../src'
import publicContent from '../app.json'
import express from 'express'
import type { IncomingMessage, Server, ServerResponse } from 'http'
import { type SecurePushMessage, type WebPushRequest } from 'securepushjs'

const TEST_PORT = 2000 + Math.floor(Math.random() * 5000)
console.info('generateVAPIDKeys', webpush)
const vapid = {
  keys: generateVAPIDKeys(),
  subject: 'mailto:test@test.com'
}

describe('SecurePush', () => {
  jest.mock('web-push', () => ({
    sendNotification: jest.fn().mockResolvedValue(
      {
        statusCode: 200,
        headers: {},
        body: 'OK'
      }
    ),
    setVapidDetails: jest.fn()
  }))
  let serverKey: SecureCommunicationKey
  let pusherKey: SecureCommunicationKey
  let app: express.Express
  let server: Server<typeof IncomingMessage, typeof ServerResponse>

  const mockPush: PushSubscription = JSON.parse(JSON.stringify({
    endpoint: 'https://fcm.googleapis.com/fcm/send/cTOqXY04n_A:APA91bEyV4fv9lCsJloUaSVhdnU-5ACpJjYMhCS2jMAUhl87ckECt3mItOMRxpqCJlS8AV8NMPVQ_70CTN38yOJ_KzgUWp-4y1kWRy8WxghiXxgiPHFsw0nm2lUCqenBjTlLdpRBNMoI',
    expirationTime: null,
    keys: {
      p256dh: 'BEacd1Ea7oAnP2XvYLHI6FbLEFN5Dw4VaFMP_aBuG1VOmGa04Dd9TAO41cf9ywOhar1y4Txn7rfepSLtwVk3XV4',
      auth: 'C4P8IRF_Cnnt1jVg8hkAcQ'
    }
  }))
  beforeAll(async () => {
    app = express()
    serverKey = await SecureCommunicationKey.create()
    pusherKey = await SecureCommunicationKey.create()
    server = app.listen(TEST_PORT, () => {
      console.log(`App listening on port ${TEST_PORT}`)

      const sps = createPushServer(serverKey, vapid, { port: (TEST_PORT + 1) })
      expect(sps).toBeDefined()

      app.use('/', sps)
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  afterAll((done) => {
    server.unref()
    jest.resetModules()
    server.close(done)
  }, 10000)
  test('should get public content', async () => {
    const resp = await request(app).get('')
    expect(resp).toBeDefined()
    expect(resp.error).toBeFalsy()
    expect(resp.body).toMatchObject(publicContent)
  })

  test('should get test', async () => {
    const resp = await request(app).get('/test')
    expect(resp).toBeDefined()
    expect(resp.error).toBeFalsy()
  })

  test('POST /send should send a notification', async () => {
    const recipient = (await SecureCommunicationKey.create())

    const encryptedEndpoint = SecureCommunicationKey.encrypt(serverKey.peerId, mockPush)

    const encryptedPayload: SymmetricallyEncryptedMessage<NotificationOptions> = SecureCommunicationKey.encrypt(recipient.peerId, { data: 'Hello from Pusher' })

    const secureMessage: SecurePushMessage = {
      encryptedEndpoint,
      encryptedPayload
    }

    const { secureChannel, handshake } = pusherKey.initiateHandshake(serverKey.peerId)

    const encryptedPushMessages: AsymmetricallyEncryptedMessage<SecurePushMessage[]> = secureChannel.encrypt([secureMessage])

    const wpr: WebPushRequest = {
      encryptedPushMessages,
      handshake,
      senderId: pusherKey.peerId
    }

    const response = await request(app)
      .post('/')
      // .set('Content-Type', 'application/json')
      // .type('application/json')
      .send(wpr)

    expect(response.error).toBeFalsy()
    expect(response.status).toBeTruthy()

    // expect(webpush.sendNotification).toHaveBeenCalledTimes(1)
    // expect(webpush.sendNotification).toHaveBeenCalledWith(
    //   mockPush,
    //   secureMessage,
    //   { TTL: 60000 }
    // )
  })

  // test('POST /send should return HTTP_ERROR_PUSH_TOO_BIG if the payload is too big', async () => {
  //   const mockSubscription = {
  //     endpoint: 'https://example.com/endpoint',
  //     keys: {
  //       auth: 'auth',
  //       p256dh: 'p256dh'
  //     }
  //   }

  //   const encryptedPayload = 'a'.repeat(4097)

  //   const encryptedPushSubscription = receiver.encryptForRelay(serverKey.peerId, JSON.stringify(mockSubscription))

  //   const webPushRequest: WebPushRequest = { encryptedPayload, encryptedPushSubscription }
  //   const response = await request(app)
  //     .post('/send')
  //     .send(webPushRequest)

  //   expect(response.status).toBe(507)
  //   expect(response.text).toBe('Insufficient Storage')

  //   expect(webpush.sendNotification).toHaveBeenCalledTimes(0)
  // })
})
