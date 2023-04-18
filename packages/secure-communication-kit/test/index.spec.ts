import { type AsymmetricallyEncryptedMessage, SecureChannel, SecureCommunicationKey, type EncryptedHandshake } from '../src'

describe('API', () => {
  test('SecurePeerKeys should shake hands, encrypt and decrypt', async () => {
    const key1 = await SecureCommunicationKey.create()
    const key2 = await SecureCommunicationKey.create()

    const handshake12 = key1.initiateHandshake(key2.peerId)
    // send the handshake over to another key owner
    const sentHandshake = handshake12.handshake
    const sharedSecret21 = key2.receiveHandshake(key1.peerId, sentHandshake)

    const secureChannel12 = new SecureChannel(handshake12.sharedSecret)
    const secureChannel21 = new SecureChannel(sharedSecret21)

    const encryptedMessage = secureChannel12.encryptMessage('Hello world!')
    const decrypted = secureChannel21.decryptMessage(encryptedMessage)

    expect(decrypted).toBe('Hello world!')
  })
})

describe('SecureCommunicationKey', () => {
  describe('SecureCommunicationKey from seed string', () => {
    describe('create', () => {
      test('creates an instance of SecurePeerKey from a string seed value containing less entropy', async () => {
        const seed = 'weak seed value'
        const key = await SecureCommunicationKey.create(seed)
        expect(key.peerId).toBeDefined()
      })
    })

    describe('initiateHandshake', () => {
      let peer1: SecureCommunicationKey
      let peer2: SecureCommunicationKey
      beforeEach(async () => {
        peer1 = await SecureCommunicationKey.create()
        peer2 = await SecureCommunicationKey.create()
      })
      test('initiates and receives a handshake for a same peer id', () => {
        const { sharedSecret, handshake } = peer1.initiateHandshake(peer2.peerId)
        const sharedKeyBytes = peer2.receiveHandshake(peer1.peerId, handshake)
        expect(sharedSecret).toEqual(sharedKeyBytes)
      })
    })

    describe('receiveHandshake', () => {
      let peer1: SecureCommunicationKey
      let peer2: SecureCommunicationKey
      beforeEach(async () => {
        peer1 = await SecureCommunicationKey.create()
        peer2 = await SecureCommunicationKey.create()
      })
      test('throws an error for an invalid signature', () => {
        const { handshake } = peer1.initiateHandshake(peer2.peerId)
        const modifiedSignature = handshake.signature.slice(2)
        handshake.signature = modifiedSignature
        expect(() => {
          peer2.receiveHandshake(peer1.peerId, handshake)
        }).toThrowError(/^[iI]nvalid signature/)
      })
      test('throws an error for an invalid nonce value', () => {
        const { handshake } = peer1.initiateHandshake(peer2.peerId)
        const modifiedNonce = handshake.message.slice(2)
        handshake.message = modifiedNonce
        expect(() => {
          peer2.receiveHandshake(peer1.peerId, handshake)
        }).toThrowError('invalid input')
      })
      test('throws an error for an invalid peer id', async () => {
        const { handshake } = peer1.initiateHandshake(peer2.peerId)
        const modifiedId = (await SecureCommunicationKey.create()).peerId
        expect(() => {
          peer2.receiveHandshake(modifiedId, handshake)
        }).toThrowError('incorrect key pair for the given ciphertext')
      })
    })

    test('should create equal keys from same seed string', async () => {
      const aSeed = 'JuStAsEeD&!*^#^'
      const key = await SecureCommunicationKey.create(aSeed)
      expect(key).toBeDefined()
      const key2 = await SecureCommunicationKey.create(aSeed)
      expect(key2).toBeDefined()
      expect(key).toEqual(key2)
    })

    test('should create different keys from different seed string', async () => {
      const aSeed = 'JuStAsEeD&!*^#^'
      const key = await SecureCommunicationKey.create(aSeed)
      expect(key).toBeDefined()
      const key2 = await SecureCommunicationKey.create(aSeed + aSeed)
      expect(key2).toBeDefined()
      expect(key).not.toEqual(key2)
    })
  })
})

describe('AsymmetricallyEncryptedMessage over secure Channel', () => {
  const message = 'A message Bla blah'
  let secureChannel: SecureChannel
  let sharedSecret: Uint8Array
  beforeEach(async () => {
    const key1 = await SecureCommunicationKey.create()
    const key2 = await SecureCommunicationKey.create()

    const handshake = key1.initiateHandshake(
      key2.peerId
    )
    sharedSecret = handshake.sharedSecret
    secureChannel = new SecureChannel(sharedSecret)
    expect(secureChannel).toBeDefined()
  })

  test('should AsymmetricallyEncryptedMessage from message', async () => {
    const encryptedMessage: AsymmetricallyEncryptedMessage =
       secureChannel.encryptMessage(message)
    expect(encryptedMessage).toBeDefined()
    expect(encryptedMessage).toBeDefined()
    expect(encryptedMessage).not.toEqual(message)
  })
  describe('Decrypt EncryptedMessage', () => {
    let encryptedMessage: AsymmetricallyEncryptedMessage
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

describe('SecureChannel Handshake', () => {
  let sender: SecureCommunicationKey
  let receiver: SecureCommunicationKey

  let initiated: { sharedSecret: Uint8Array, handshake: EncryptedHandshake }
  beforeEach(async () => {
    sender = await SecureCommunicationKey.create()
    receiver = await SecureCommunicationKey.create()
    expect(sender).toBeDefined()
    expect(receiver).toBeDefined()
    initiated = sender.initiateHandshake(receiver.peerId)
    expect(initiated).toBeDefined()
    expect(sender).toBeDefined()

    const sharedSecret = receiver.receiveHandshake(sender.peerId, initiated.handshake)
    expect(sharedSecret).toBeDefined()
    const scSender = new SecureChannel(sharedSecret)
    expect(scSender).toBeDefined()
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
    let fakeKey: SecureCommunicationKey
    let fakeHandshake: { sharedSecret: Uint8Array, handshake: EncryptedHandshake }

    beforeEach(async () => {
      fakeKey = await SecureCommunicationKey.create()
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

describe('Encrypt for - from', () => {
  let aKey: SecureCommunicationKey
  let bKey: SecureCommunicationKey
  beforeAll(async () => {
    aKey = await SecureCommunicationKey.create()
    bKey = await SecureCommunicationKey.create()
  })
  test('should securely relay simple text', async () => {
    const ciphered = aKey.encryptWithPublicKey(bKey.peerId, 'Hello world!')
    expect(ciphered).toBeDefined()
    const decrypted = bKey.decryptWithPublicKey(aKey.peerId, ciphered)
    expect(decrypted).toEqual('Hello world!')
  })

  test('should securely relay object', async () => {
    const obj = {
      endpoint: 'https://example.com/endpoint',
      keys: {
        auth: 'auth',
        p256dh: 'p256dh'
      }
    }
    const ciphered = SecureCommunicationKey.encryptWithRelay(bKey.peerId, JSON.stringify(obj))
    expect(ciphered).toBeDefined()
    const decrypted = JSON.parse(bKey.decryptFromRelay(ciphered))
    expect(decrypted).toEqual(obj)
  })

  test('should encrypt for and from relay', async () => {
    const aMessage = 'Hello world!'
    const relayMessage = SecureCommunicationKey.encryptWithRelay(bKey.peerId, aMessage)
    expect(relayMessage).toBeDefined()
    const received = bKey.decryptFromRelay(relayMessage)
    expect(received).toEqual(aMessage)
  })
  test('should encrypt for and from relay long message', async () => {
    const aMessage = 'Hello world!'.repeat(2522)
    const relayMessage = SecureCommunicationKey.encryptWithRelay(bKey.peerId, aMessage)
    expect(relayMessage).toBeDefined()
    const received = bKey.decryptFromRelay(relayMessage)
    expect(received).toEqual(aMessage)
  })
  test('should fail to decrypt with wrong public key', async () => {
    const ciphered = aKey.encryptWithPublicKey(bKey.peerId, 'Hello world!')
    expect(ciphered).toBeDefined()
    const wrongPublicKey = await SecureCommunicationKey.create()
    expect(() => bKey.decryptWithPublicKey(wrongPublicKey.peerId, ciphered)).toThrow('')
  })

  test('should fail to decrypt from invalid relay message', async () => {
    expect(() => bKey.decryptFromRelay({ cipherB64: '1313123', encryptedKeyB64: '23232344', nonceB64: '232323232' })).toThrow('')
  })

  test('should fail to decrypt from tampered relay message', async () => {
    const aMessage = 'Hello world!'
    const relayMessage = SecureCommunicationKey.encryptWithRelay(bKey.peerId, aMessage)
    expect(relayMessage).toBeDefined()
    relayMessage.cipherB64 = relayMessage.cipherB64.substring(2) // Tamper the cipher
    expect(() => bKey.decryptFromRelay(relayMessage)).toThrow('')
  })
})
