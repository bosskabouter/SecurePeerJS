import * as webpush from 'web-push'
import request from 'supertest'
import express from 'express'
import { SecurePush } from '../src'
import { SecureCommunicationKey } from 'secure-communication-kit'

jest.mock('web-push', () => ({
  sendNotification: jest.fn().mockImplementation(async () => await Promise.resolve(true)),
  setVapidDetails: jest.fn()
}))
// const webpush =
// jest.genMockFromModule('web-push')

describe('SecurePush', () => {
  const app = express()

  let securePush: SecurePush
  let serverKey: SecureCommunicationKey

  beforeAll(async () => {
    serverKey = await SecureCommunicationKey.create()
    // sender = new SecurePeerRelay(await SecureCommunicationKey.create())

    securePush = new SecurePush(app, serverKey)
  })
  afterEach(() => {
    // jest.resetAllMocks()
  })
  afterAll(() => {
    app.removeAllListeners()
    expect(securePush).toBeDefined()
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

    // { (webpush.sendNotification as jest.MockedFunction<typeof webpush.sendNotification>).mockResolvedValueOnce({}) }

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
    expect(response.text).toBeTruthy()

    expect(webpush.sendNotification).toHaveBeenCalledTimes(1)
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      subscription,
      mockPayload
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
