import sodium from 'libsodium-wrappers'
import { type EncryptedMessage } from '.'

/**
 * Once a shared secret has been established in between two participants during handshake, a secure channel is able to encrypt and decrypt messages using this shared common secret
 */
export class SecureChannel {
  /**
     *
     * @param sharedSecret
     */
  constructor (public readonly sharedSecret: Uint8Array) {}

  encryptMessage (message: string): EncryptedMessage {
    // Generate a new random nonce for each message
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    // Encrypt the message with the shared secret and nonce
    const cipherB64 = sodium.to_base64(sodium.crypto_secretbox_easy(
      sodium.from_string(message),
      nonce,
      this.sharedSecret
    ))
    return { nonceB64: sodium.to_base64(nonce), cipherB64 }
  }

  decryptMessage (encryptedMessage: EncryptedMessage): string {
    // Decrypt the message with the shared secret and nonce
    const decryptedBytes = sodium.crypto_secretbox_open_easy(
      sodium.from_base64(encryptedMessage.cipherB64),
      sodium.from_base64(encryptedMessage.nonceB64),
      this.sharedSecret
    )
    return sodium.to_string(decryptedBytes)
  }
}
