import * as webpush from 'web-push'
import request from 'supertest'
import { SecureCommunicationKey } from 'secure-communication-kit'
import { createPushServer } from '../src'
import publicContent from '../app.json'
import express from 'express'
import type { IncomingMessage, Server, ServerResponse } from 'http'

const TEST_PORT = 2000 + Math.floor(Math.random() * 5000)

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
describe('SecurePush', () => {
  let serverKey: SecureCommunicationKey
  let app: express.Express
  let server: Server<typeof IncomingMessage, typeof ServerResponse>

  beforeAll(async () => {
    app = express()
    serverKey = await SecureCommunicationKey.create()

    server = app.listen(TEST_PORT, () => {
      console.log(`App listening on port ${TEST_PORT}`)

      const sps = createPushServer(serverKey, { port: (TEST_PORT + 1) })
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
    const mockPayload = '@@@SOME_ENCRYPTED_CONTENT@@@'
    const subscription = {
      endpoint: 'https://example.com/endpoint',
      keys: {
        auth: 'auth',
        p256dh: 'p256dh'
      }
    }

    const encryptedMockEndpoint = SecureCommunicationKey.encryptWithRelay(serverKey.peerId, JSON.stringify(subscription))

    expect(encryptedMockEndpoint).toBeDefined()

    const wpr = {
      encryptedPayload: mockPayload,
      encryptedPushSubscription: encryptedMockEndpoint
    }

    const response = await request(app)
      .post('/send')
      .set('Content-Type', 'application/json')
      .type('application/json')
      .send(wpr)

    expect(response.error).toBeFalsy()
    expect(response.status).toBeTruthy()

    expect(webpush.sendNotification).toHaveBeenCalledTimes(1)
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      subscription,
      mockPayload,
      { TTL: 60000 }
    )
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
