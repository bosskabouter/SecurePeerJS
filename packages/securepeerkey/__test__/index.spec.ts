import { SecurePeerKey, SecureChannel } from '../src'

describe('API', () => {
  it('SecurePeerKeys should shake hands, encrypt and decrypt', async () => {
    const key1 = await SecurePeerKey.create()
    const key2 = await SecurePeerKey.create()

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
