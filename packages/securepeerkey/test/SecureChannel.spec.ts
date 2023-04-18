import { type EncryptedMessage, type Handshake, SecurePeerKey, SecureChannel } from '../src'

describe('SecureChannel after valid handshake', () => {
  const message = 'A message Bla blah'
  let secureChannel: SecureChannel
  let sharedSecret: Uint8Array
  beforeEach(async () => {
    const key1 = await SecurePeerKey.create()
    const key2 = await SecurePeerKey.create()

    const handshake = key1.initiateHandshake(
      key2.peerId
    )
    sharedSecret = handshake.sharedSecret
    secureChannel = new SecureChannel(sharedSecret)
    expect(secureChannel).toBeDefined()
  })

  test('should EncryptedMessage from message', async () => {
    const encryptedMessage: EncryptedMessage =
       secureChannel.encryptMessage(message)
    expect(encryptedMessage).toBeDefined()
    expect(encryptedMessage).toBeDefined()
    expect(encryptedMessage).not.toEqual(message)
  })
  describe('Decrypt EncryptedMessage', () => {
    let encryptedMessage: EncryptedMessage
    beforeEach(async () => {
      encryptedMessage = secureChannel.encryptMessage(message)
    })
    test('should decryptMessage', async () => {
      const decryptedMessage = secureChannel.decryptMessage(
        encryptedMessage
      )
      expect(decryptedMessage).toBeDefined()
      expect(decryptedMessage).toEqual(message)
    })

    test('should reject: tampered shared secret', async () => {
      const secureChannel2 = new SecureChannel(
        new Uint8Array(Array.from(sharedSecret).reverse())
      )
      await expect(
        async () => secureChannel2.decryptMessage(encryptedMessage)
      ).rejects.toThrow(/wrong secret key for the given ciphertext/)
    })
  })
})

describe('Handshake', () => {
  let sender: SecurePeerKey
  let receiver: SecurePeerKey
  let scSender: SecureChannel
  let scReceiver: SecureChannel

  let initiated: { sharedSecret: Uint8Array, handshake: Handshake }
  beforeEach(async () => {
    sender = await SecurePeerKey.create()
    receiver = await SecurePeerKey.create()
    expect(sender).toBeDefined()
    expect(receiver).toBeDefined()
    initiated = sender.initiateHandshake(receiver.peerId)
    expect(initiated).toBeDefined()
    scSender = new SecureChannel(initiated.sharedSecret)
    expect(scSender).toBeDefined()

    const sharedSecret = receiver.receiveHandshake(sender.peerId, initiated.handshake)
    expect(sharedSecret).toBeDefined()
    scReceiver = new SecureChannel(sharedSecret)
    expect(scReceiver).toBeDefined()
  })
  test('should share Secret', () => {
    const sharedSecret = receiver.receiveHandshake(
      sender.peerId,
      initiated.handshake
    )
    expect(sharedSecret).toEqual(initiated.sharedSecret)
    const decrypted = new SecureChannel(initiated.sharedSecret).decryptMessage(
      new SecureChannel(sharedSecret).encryptMessage('Hello'))
    expect(decrypted).toEqual('Hello')
  })

  describe('Should Reject:', () => {
    let fakeKey: SecurePeerKey
    let fakeHandshake: { sharedSecret: Uint8Array, handshake: Handshake }

    beforeEach(async () => {
      fakeKey = await SecurePeerKey.create()
      fakeHandshake = fakeKey.initiateHandshake(receiver.peerId)
    })

    test('tampered Signature', () => {
      initiated.handshake.signature = fakeHandshake.handshake.signature
      void expect(
        async () =>
          receiver.receiveHandshake(
            sender.peerId,
            initiated.handshake
          )
      ).rejects.toThrow(/Invalid signature/)
    })
    test('tampered public SignKey', async () => {
      initiated.handshake.publicSignKey = fakeHandshake.handshake.publicSignKey
      await expect(
        async () =>
          receiver.receiveHandshake(
            sender.peerId,
            initiated.handshake
          )
      ).rejects.toThrow(/Invalid signature/)
    })
    test('tampered messageBytes', async () => {
      initiated.handshake.message = fakeHandshake.handshake.message
      await expect(
        async () =>
          receiver.receiveHandshake(
            sender.peerId,
            initiated.handshake
          )
      ).rejects.toThrow(/Invalid signature/)
    })

    test('tampered public peerId', async () => {
      const fakePubId = fakeKey.peerId
      await expect(
        async () =>
          receiver.receiveHandshake(fakePubId, initiated.handshake)
      ).rejects.toThrow(/incorrect key pair for the given ciphertext/)
    })

    test('tampered everything', async () => {
      await expect(
        async () =>
          receiver.receiveHandshake(
            sender.peerId,
            fakeHandshake.handshake
          )
      ).rejects.toThrow(/incorrect key pair for the given ciphertext/)
    })
  })
})
