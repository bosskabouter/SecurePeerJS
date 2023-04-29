import axios from 'axios'
import { SecureCommunicationKey, type SecurePushMessage, SecurePusher, type PushServerConfig } from '../src'

jest.mock('axios')

describe('SecurePusher', () => {
  const mockPush: PushSubscription = JSON.parse(JSON.stringify({
    endpoint: 'https://example.com/push/1234',
    expirationTime: null,
    keys: {
      p256dh: 'P256DH_PUBLIC_KEY',
      auth: 'AUTH_SECRET_KEY'
    }
  }))
  let serverKey: SecureCommunicationKey
  let pusherKey: SecureCommunicationKey
  let pushedKey: SecureCommunicationKey
  let message: SecurePushMessage

  const notificationOptions: NotificationOptions = {}

  let serverConfig: PushServerConfig

  beforeAll(async () => {
    serverKey = await SecureCommunicationKey.create()
    serverConfig = { publicKey: serverKey.peerId, host: 'testHost', path: 'testPath', vapidKey: 'testVapidKey' }
    pusherKey = await SecureCommunicationKey.create()
    pushedKey = await SecureCommunicationKey.create()
    message = {
      encryptedEndpoint: SecureCommunicationKey.encrypt(serverConfig.publicKey, mockPush),
      encryptedPayload: SecureCommunicationKey.encrypt(pushedKey.peerId, notificationOptions)
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('pushMessage', () => {
    test('should return true when axios post succeeds', async () => {
      (axios.post as jest.Mock).mockImplementationOnce(async () => await Promise.resolve({ status: 200 }))

      const securePusher = new SecurePusher(mockPush, pusherKey, serverConfig)
      const result = await securePusher.pushMessages([message])
      expect(result).toBe(true)
    })

    test('should throw an error when axios post fails', async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('testError'))
      const securePusher = new SecurePusher(mockPush, pusherKey, serverConfig)
      await expect(securePusher.pushMessages([])).rejects.toThrow('testError')
      expect(axios.post).toHaveBeenCalled()
      expect(axios.post).toHaveReturned()
    })
  })

  describe('getSharedSubscription', () => {
    test('should return the encrypted pushSubscription', () => {
      const securePusher = new SecurePusher(mockPush, pusherKey, serverConfig)
      expect(securePusher.sharedSubscription).toBeDefined()
    })
  })
})
