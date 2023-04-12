
/**
 * Every encrypted messages send contains a new nonce
 */
export interface EncryptedMessage {
  nonce: string
  cipher: string
}

/**
 * An unencrypted envelope that contains a signed and encrypted HandshakeMessage.
 */
export interface Handshake {
  /**
   * The base64-encoded encrypted HandshakeMessage.
   */
  message: string
  /**
   * The base64-encoded signature of the encrypted HandshakeMessage.
   */
  signature: string
  /**
   * The public signing key of the sender.
   */
  publicSignKey: string
}
