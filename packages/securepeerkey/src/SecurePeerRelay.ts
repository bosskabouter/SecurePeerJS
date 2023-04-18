import sodium from 'libsodium-wrappers'
import type { SecurePeerKey } from './SecurePeerKey'
import { type EncryptedMessage } from '.'

export interface RelayMessage extends EncryptedMessage { encryptedKeyB64: string }

/**
 *
 */
export class SecurePeerRelay {
  constructor (private readonly key: SecurePeerKey) {
  }

  /**
   * Encrypt a message for a recipient's public key
   * @param publicKey
   * @param message
   * @returns {EncryptedMessage} the encrypted message and nonce
   */
  encrypt (publicKey: string, message: string): EncryptedMessage {
    const nonce = (sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES))
    const cipherB64 = sodium.to_base64(sodium.crypto_box_easy(message, nonce, sodium.from_hex(publicKey), this.key.securePeerKeySet.boxKeyPair.privateKey))
    return { nonceB64: sodium.to_base64(nonce), cipherB64 }
  }

  /**
   * Decrypt a message from a sender's public key
   * @param originPublicKey
   * @param encryptedMessage
   * @returns {string} the decrypted message
   */
  decrypt (originPublicKey: string, encryptedMessage: EncryptedMessage): string {
    return sodium.to_string(
      sodium.crypto_box_open_easy(
        sodium.from_base64(encryptedMessage.cipherB64),
        sodium.from_base64(encryptedMessage.nonceB64),
        sodium.from_hex(originPublicKey),
        this.key.securePeerKeySet.boxKeyPair.privateKey
      )
    )
  }

  /**
   *
   * @param publicKey
   * @param message
   * @returns
   */
  encryptForRelay (publicKey: string, message: string): RelayMessage {
    // Generate a random symmetric key for AES encryption
    const sharedSecret = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES)

    // Encrypt the message with AES
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const cipherB64 = sodium.to_base64(sodium.crypto_secretbox_easy(message, nonce, sharedSecret))

    // Encrypt the symmetric key with RSA public key of the relay server
    const encryptedKeyB64 = sodium.to_base64(sodium.crypto_box_seal(sharedSecret, sodium.from_hex(publicKey)))
    return { cipherB64, encryptedKeyB64, nonceB64: sodium.to_base64(nonce) }
  }

  /**
   *
   * @param relayedMessage
   * @returns
   */
  decryptFromRelay (relayedMessage: RelayMessage): string {
    const decryptedKey = sodium.crypto_box_seal_open(sodium.from_base64(relayedMessage.encryptedKeyB64), this.key.securePeerKeySet.boxKeyPair.publicKey, this.key.securePeerKeySet.boxKeyPair.privateKey)

    // Decrypt the message with the recovered symmetric key
    return sodium.to_string(sodium.crypto_secretbox_open_easy(sodium.from_base64(relayedMessage.cipherB64), sodium.from_base64(relayedMessage.nonceB64), decryptedKey))
  }
}
