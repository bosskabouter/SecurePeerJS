import { SecurePeerKey, SecurePeerRelay } from '../src'

describe('Encrypt for - from', () => {
  let aKey: SecurePeerKey
  let bKey: SecurePeerKey
  let secureRelayA: SecurePeerRelay
  let secureRelayB: SecurePeerRelay
  beforeAll(async () => {
    aKey = await SecurePeerKey.create()
    bKey = await SecurePeerKey.create()
    secureRelayA = new SecurePeerRelay(aKey)
    secureRelayB = new SecurePeerRelay(bKey)
  })
  test('should securely relay simple text', async () => {
    const ciphered = secureRelayA.encrypt(bKey.peerId, 'Hello world!')
    expect(ciphered).toBeDefined()
    const decrypted = secureRelayB.decrypt(aKey.peerId, ciphered)
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
    const ciphered = secureRelayA.encryptForRelay(bKey.peerId, JSON.stringify(obj))
    expect(ciphered).toBeDefined()
    const decrypted = JSON.parse(secureRelayB.decryptFromRelay(ciphered))
    expect(decrypted).toEqual(obj)
  })

  test('should encrypt for and from relay', async () => {
    const aMessage = 'Hello world!'
    const relayMessage = secureRelayA.encryptForRelay(bKey.peerId, aMessage)
    expect(relayMessage).toBeDefined()
    const received = secureRelayB.decryptFromRelay(relayMessage)
    expect(received).toEqual(aMessage)
  })
  test('should encrypt for and from relay long message', async () => {
    const aMessage = 'Hello world!'.repeat(2522)
    const relayMessage = secureRelayA.encryptForRelay(bKey.peerId, aMessage)
    expect(relayMessage).toBeDefined()
    const received = secureRelayB.decryptFromRelay(relayMessage)
    expect(received).toEqual(aMessage)
  })
  test('should fail to decrypt with wrong public key', async () => {
    const ciphered = secureRelayA.encrypt(bKey.peerId, 'Hello world!')
    expect(ciphered).toBeDefined()
    const wrongPublicKey = await SecurePeerKey.create()
    expect(() => secureRelayB.decrypt(wrongPublicKey.peerId, ciphered)).toThrow('')
  })

  test('should fail to decrypt from invalid relay message', async () => {
    expect(() => secureRelayB.decryptFromRelay({ cipherB64: '1313123', encryptedKeyB64: '23232344', nonceB64: '232323232' })).toThrow('')
  })

  test('should fail to decrypt from tampered relay message', async () => {
    const aMessage = 'Hello world!'
    const relayMessage = secureRelayA.encryptForRelay(bKey.peerId, aMessage)
    expect(relayMessage).toBeDefined()
    relayMessage.cipherB64 = relayMessage.cipherB64.substring(2) // Tamper the cipher
    expect(() => secureRelayB.decryptFromRelay(relayMessage)).toThrow('')
  })
})
