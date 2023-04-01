import { SecureChannel, type EncryptedMessage, SecurePeerKey, type Handshake } from '../src'

import { faker } from '@faker-js/faker'

describe('Secure Channel', () => {
  const message = faker.lorem.paragraphs(9)
  let secureChannel: SecureChannel
  let sharedSecret: Uint8Array
  beforeEach(async () => {
    const key1 = await SecurePeerKey.create()
    const key2 = await SecurePeerKey.create()

    const handshake = await key1.initiateHandshake(
      key2.getPeerId()
    )
    sharedSecret = handshake.sharedSecret
    secureChannel = new SecureChannel(sharedSecret)
    expect(secureChannel).toBeDefined()
  })
  it('should encrypt', async () => {
    const encryptedMessage: EncryptedMessage =
      await secureChannel.encryptMessage(message)
    expect(encryptedMessage).toBeDefined()
    expect(encryptedMessage).not.toEqual(message)
  })
  describe('Decrypt', () => {
    let encryptedMessage: EncryptedMessage
    beforeEach(async () => {
      encryptedMessage = await secureChannel.encryptMessage(message)
    })
    it('should decrypt', async () => {
      const decryptedMessage = await secureChannel.decryptMessage(
        encryptedMessage
      )
      expect(decryptedMessage).toBeDefined()
      expect(decryptedMessage).toEqual(message)
    })

    it('should reject: tempered shared secret', async () => {
      const secureChannel2 = new SecureChannel(
        new Uint8Array(faker.helpers.shuffle(Array.from(sharedSecret)))
      )
      await expect(
        async () => await secureChannel2.decryptMessage(encryptedMessage)
      ).rejects.toThrow(/wrong secret key for the given ciphertext/)
    })
  })
})

describe('Handshake', () => {
  let sender: SecurePeerKey
  let receiver: SecurePeerKey
  let sc: SecureChannel

  let initiated: { sharedSecret: Uint8Array, handshake: Handshake }
  beforeEach(async () => {
    sender = await SecurePeerKey.create()
    receiver = await SecurePeerKey.create()
    expect(sender).toBeDefined()
    expect(receiver).toBeDefined()
    initiated = await sender.initiateHandshake(receiver.getPeerId())
    expect(initiated).toBeDefined()
    sc = new SecureChannel(initiated.sharedSecret)
    expect(sc).toBeDefined()
  })
  test('should share Secret', async () => {
    const sharedSecret = await receiver.receiveHandshake(
      sender.getPeerId(),
      initiated.handshake
    )
    expect(sharedSecret).toEqual(initiated.sharedSecret)
  })

  describe('Should Reject:', () => {
    let fakeKey: SecurePeerKey
    let fakeHandshake: { sharedSecret: Uint8Array, handshake: Handshake }

    beforeEach(async () => {
      fakeKey = await SecurePeerKey.create()
      fakeHandshake = await fakeKey.initiateHandshake(receiver.getPeerId())
    })

    it('tempered Signature', () => {
      initiated.handshake.signature = fakeHandshake.handshake.signature
      void expect(
        async () =>
          await receiver.receiveHandshake(
            sender.getPeerId(),
            initiated.handshake
          )
      ).rejects.toThrow(/Invalid signature/)
    })
    it('tempered public SignKey', async () => {
      initiated.handshake.publicSignKey = fakeHandshake.handshake.publicSignKey
      await expect(
        async () =>
          await receiver.receiveHandshake(
            sender.getPeerId(),
            initiated.handshake
          )
      ).rejects.toThrow(/Invalid signature/)
    })
    it('tempered messageBytes', async () => {
      initiated.handshake.message = fakeHandshake.handshake.message
      await expect(
        async () =>
          await receiver.receiveHandshake(
            sender.getPeerId(),
            initiated.handshake
          )
      ).rejects.toThrow(/Invalid signature/)
    })

    it('tempered public peerId', async () => {
      const fakePubId = fakeKey.getPeerId()
      await expect(
        async () =>
          await receiver.receiveHandshake(fakePubId, initiated.handshake)
      ).rejects.toThrow(/incorrect key pair for the given ciphertext/)
    })

    it('tempered everything', async () => {
      await expect(
        async () =>
          await receiver.receiveHandshake(
            sender.getPeerId(),
            fakeHandshake.handshake
          )
      ).rejects.toThrow(/incorrect key pair for the given ciphertext/)
    })
  })
})
