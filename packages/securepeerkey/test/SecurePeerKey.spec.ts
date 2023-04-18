import { SecurePeerKey } from '../src'

describe('SecureKey from seed string', () => {
  describe('create', () => {
    test('creates an instance of SecurePeerKey from a string seed value containing less entropy', async () => {
      const seed = 'weakseedvalue'
      const securePeerKey = await SecurePeerKey.create(seed)
      expect(securePeerKey.peerId).toBeDefined()
    })
  })

  describe('initiateHandshake', () => {
    let peer1: SecurePeerKey
    let peer2: SecurePeerKey
    beforeEach(async () => {
      peer1 = await SecurePeerKey.create()
      peer2 = await SecurePeerKey.create()
    })
    test('initiates and receives a handshake for a same peer id', () => {
      const { sharedSecret, handshake } = peer1.initiateHandshake(peer2.peerId)
      const sharedKeyBytes = peer2.receiveHandshake(peer1.peerId, handshake)
      expect(sharedSecret).toEqual(sharedKeyBytes)
    })
  })

  describe('receiveHandshake', () => {
    let peer1: SecurePeerKey
    let peer2: SecurePeerKey
    beforeEach(async () => {
      peer1 = await SecurePeerKey.create()
      peer2 = await SecurePeerKey.create()
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
      const modifiedId = (await SecurePeerKey.create()).peerId
      expect(() => {
        peer2.receiveHandshake(modifiedId, handshake)
      }).toThrowError('incorrect key pair for the given ciphertext')
    })
  })

  test('should create equal keys from same seed string', async () => {
    const aSeed = 'JuStAsEeD&!*^#^'
    const key = await SecurePeerKey.create(aSeed)
    expect(key).toBeDefined()
    const key2 = await SecurePeerKey.create(aSeed)
    expect(key2).toBeDefined()
    expect(key).toEqual(key2)
  })

  test('should create different keys from different seed string', async () => {
    const aSeed = 'JuStAsEeD&!*^#^'
    const key = await SecurePeerKey.create(aSeed)
    expect(key).toBeDefined()
    const key2 = await SecurePeerKey.create(aSeed + aSeed)
    expect(key2).toBeDefined()
    expect(key).not.toEqual(key2)
  })
})

// describe('Message relay through RS', () => {
//   let aKey: KeyPair
//   let bKey: KeyPair

//   let rsKey: KeyPair

//   const bEndpoint = 'http://somegoogle.com'
//   beforeEach(async () => {
//     await sodium.ready
//     // Generate public and private keys for A and B
//     aKey = sodium.crypto_box_keypair()
//     bKey = sodium.crypto_box_keypair()
//     // Generate a public key for the relay server
//     rsKey = sodium.crypto_box_keypair()
//   })

//   test('A sends a message to B through RS', async () => {
//     // Generate a random nonce
//     const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)

//     // Encrypt B's address with RS's public key
//     const bEndpointEncrypted = sodium.crypto_box_easy(bEndpoint, nonce, rsKey.publicKey, bKey.privateKey)

//     // Prepare the payload for B
//     const payload = 'Hello, B!'

//     // Encrypt the payload with B's public key
//     const encryptedPayload = sodium.crypto_box_easy(payload, nonce, bKey.publicKey, aKey.privateKey)
//     expect(encryptedPayload).toBeDefined()
//     // Send the encrypted payload and B's endpoint to RS
//     const relayedMessage = {
//       payload: encryptedPayload,
//       endpoint: bEndpointEncrypted
//     }

//     // RS decrypts B's endpoint
//     const decryptedEndpoint = sodium.crypto_box_open_easy(relayedMessage.endpoint, nonce, bKey.publicKey, rsKey.privateKey)

//     expect(decryptedEndpoint).toEqual(bEndpoint)
//     // RS relays the encrypted payload to B's endpoint
//     const decryptedPayload = sodium.to_string(sodium.crypto_box_open_easy(relayedMessage.payload, nonce, aKey.publicKey, aKey.privateKey))

//     // Verify that B received the payload correctly
//     expect(decryptedPayload).toBe(payload)
//   })
// })
