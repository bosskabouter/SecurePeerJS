import { type AsymmetricallyEncryptedMessage, SecureChannel, SecureCommunicationKey, type EncryptedHandshake, SymmetricallyEncryptedMessage } from '../src'

describe('SecureCommunicationKit', () => {
  let peer1: SecureCommunicationKey
  let peer2: SecureCommunicationKey
  beforeEach(async () => {
    peer1 = await SecureCommunicationKey.create()
    peer2 = await SecureCommunicationKey.create()
    expect(peer1).toBeDefined()
    expect(peer2).toBeDefined()
    expect(peer1.peerId).toBeDefined()
    expect(peer2.peerId).toBeDefined()
  })

  describe('keys encrypts for himself', () => {
    test('Symmetrically', async () => {
      const key = await SecureCommunicationKey.create()
      const encrypted = key.encryptAnonym(key.peerId, 'Hello World')
      const msg = key.decryptSym(encrypted)
      expect(msg).toBe('Hello World')
    })
    test('Asymmetrically', async () => {
      const key = await SecureCommunicationKey.create()
      const encrypted = key.encrypt(key.peerId, 'Hello World')
      const msg = key.decrypt(key.peerId, encrypted)
      expect(msg).toBe('Hello World')
    })
  })

  describe('SecureCommunicationKey creation', () => {
    test('should create from a simple string seed value', async () => {
      const seed = 'weak seed value'
      const key = await SecureCommunicationKey.create(seed)
      expect(key.peerId).toBeDefined()
    })
    test('should create equal keys from same seed string', async () => {
      const aSeed = 'JuStAsEeD&!*^#^'
      const key = await SecureCommunicationKey.create(aSeed)
      expect(key).toBeDefined()
      const peer2 = await SecureCommunicationKey.create(aSeed)
      expect(peer2).toBeDefined()
      expect(key).toEqual(peer2)
    })

    test('should create different keys from different seed string', async () => {
      const aSeed = 'JuStAsEeD&!*^#^'
      const key = await SecureCommunicationKey.create(aSeed)
      expect(key).toBeDefined()
      const peer2 = await SecureCommunicationKey.create(aSeed + aSeed)
      expect(peer2).toBeDefined()
      expect(key).not.toEqual(peer2)
    })
  })

  describe('Handshake', () => {
    test('should shake hands, encrypt and decrypt', async () => {
      const { secureChannel: secureChannel12, handshake } = peer1.initiateHandshake(peer2.peerId)
      const secureChannel21 = peer2.receiveHandshake(peer1.peerId, handshake)

      const encryptedMessage = secureChannel12.encrypt('Hello world!')
      const decrypted = secureChannel21.decrypt(encryptedMessage)

      expect(decrypted).toBe('Hello world!')
    })

    test('initiates and receives a handshake for a same peer id', () => {
      const { secureChannel, handshake } = peer1.initiateHandshake(peer2.peerId)
      const secureChannel21 = peer2.receiveHandshake(peer1.peerId, handshake)
      expect(secureChannel.sharedSecret).toEqual(secureChannel21.sharedSecret)
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

  test('should encrypt/decrypt AsymmetricallyEncryptedMessage simple text', async () => {
    const ciphered = peer1.encrypt(peer2.peerId, 'Hello world!')
    expect(ciphered).toBeDefined()
    const decrypted = ciphered.decrypt(peer2, peer1.peerId)
    expect(decrypted).toEqual('Hello world!')
  })

  test('should encrypt/decrypt SymmetricallyEncryptedMessage object', async () => {
    const obj = {
      endpoint: 'https://example.com/endpoint',
      keys: {
        auth: 'auth',
        p256dh: 'p256dh'
      }
    }
    const ciphered = SecureCommunicationKey.encrypt(peer2.peerId, obj)
    expect(ciphered).toBeDefined()
    const decrypted = ciphered.decrypt(peer2)
    expect(decrypted).toEqual(obj)
  })

  test('should encrypt for and from relay', async () => {
    const aMessage = 'Hello world!'
    const relayMessage = SecureCommunicationKey.encrypt(peer1.peerId, aMessage)
    expect(relayMessage).toBeDefined()
    const received = relayMessage.decrypt(peer1)
    expect(received).toEqual(aMessage)
  })
  test('should encrypt for and from relay long message', async () => {
    const aMessage = 'Hello world!'.repeat(2522)
    const relayMessage = SecureCommunicationKey.encrypt(peer2.peerId, aMessage)
    expect(relayMessage).toBeDefined()
    const received = peer2.decryptSym(relayMessage)
    expect(received).toEqual(aMessage)
  })
  test('should fail to decrypt with wrong public key', async () => {
    const ciphered = peer1.encrypt(peer2.peerId, 'Hello world!')
    expect(ciphered).toBeDefined()
    const wrongPublicKey = await SecureCommunicationKey.create()
    expect(() => peer2.decrypt(wrongPublicKey.peerId, ciphered)).toThrow('')
  })

  test('should fail to decrypt from invalid relay message', async () => {
    expect(() => peer2.decryptSym<any>(new SymmetricallyEncryptedMessage('1313123', '23232344', '232323232'))).toThrow('')
  })

  test('should fail to decrypt from tampered relay message', async () => {
    const aMessage = 'Hello world!'
    let relayMessage = SecureCommunicationKey.encrypt(peer2.peerId, aMessage)
    expect(relayMessage).toBeDefined()
    // Tamper the cipher

    relayMessage = new SymmetricallyEncryptedMessage(relayMessage.nonceB64, relayMessage.cipherB64, relayMessage.cipherB64.substring(2))

    expect(() => peer2.decryptSym(relayMessage)).toThrow('')
  })

  describe('AsymmetricallyEncryptedMessage over secure Channel', () => {
    const message = 'A message, Bla blah'.repeat(100)
    let initiated: { secureChannel: SecureChannel, handshake: EncryptedHandshake }
    beforeEach(async () => {
      initiated = peer1.initiateHandshake(
        peer2.peerId
      )
      expect(initiated).toBeDefined()
      expect(initiated.handshake).toBeDefined()
      expect(initiated.secureChannel).toBeDefined()
      expect(initiated.secureChannel.sharedSecret).toBeDefined()
    })

    test('should AsymmetricallyEncryptedMessage from message', async () => {
      const encryptedMessage: AsymmetricallyEncryptedMessage<string> =
      initiated.secureChannel.encrypt(message)
      expect(encryptedMessage).toBeDefined()
      expect(encryptedMessage).toBeDefined()
      expect(encryptedMessage).not.toEqual(message)
    })
    describe('Decrypt EncryptedMessage', () => {
      let encryptedMessage: AsymmetricallyEncryptedMessage<string>
      beforeEach(async () => {
        encryptedMessage = initiated.secureChannel.encrypt(message)
      })
      test('should decryptMessage', async () => {
        const decryptedMessage = initiated.secureChannel.decrypt(
          encryptedMessage
        )
        expect(decryptedMessage).toBeDefined()
        expect(decryptedMessage).toEqual(message)
      })

      test('should reject: tampered shared secret', async () => {
        // aSecureChannel.
        // const secureChannel2 = new SecureChannel(
        //   new Uint8Array(Array.from(
        //     aSecureChannel.sharedSecret).reverse())
        // )
        // expect(secureChannel2.decryptMessage(encryptedMessage)).toThrow(/wrong secret key for the given ciphertext/)
      })
    })
    describe('SecureChannel Handshake', () => {
      let sender: SecureCommunicationKey
      let receiver: SecureCommunicationKey

      let initiated: { secureChannel: SecureChannel, handshake: EncryptedHandshake }
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
      })
      test('should share Secret', () => {
        const sharedSecret = receiver.receiveHandshake(
          sender.peerId,
          initiated.handshake
        ).sharedSecret

        expect(sharedSecret).toEqual(initiated.secureChannel.sharedSecret)
        const decrypted = new SecureChannel(initiated.secureChannel.sharedSecret).decrypt(
          initiated.secureChannel.encrypt('Hello'))
        expect(decrypted).toEqual('Hello')
      })

      describe('Should Reject:', () => {
        let fakeKey: SecureCommunicationKey
        let fakeHandshake: { secureChannel: SecureChannel, handshake: EncryptedHandshake }

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
  })
})
