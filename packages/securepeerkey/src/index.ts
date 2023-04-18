
export * from './SecureChannel'
export * from './SecurePeerKey'
export * from './SecurePeerRelay'

/**
 * Every encrypted messages send contains a new nonce
 */
export interface EncryptedMessage {
  nonceB64: string
  cipherB64: string
}
