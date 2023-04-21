
export declare class CommunicationKeyContract {
  get id (): string
  initiateHandshake: (id: string) => SecureChannel
  acceptHandshake: (id: string) => SecureChannel
  static encryptWithPublicKey: (publicKey: string, message: string) => AsymmetricallyEncryptedMessage
  decryptWithPublicKey: (originPublicKey: string, encryptedMessage: AsymmetricallyEncryptedMessage) => string
  encryptWithRelay: (publicKey: string, message: string) => SymmetricallyEncryptedMessage
  decryptFromRelay: (relayedMessage: SymmetricallyEncryptedMessage) => string
}
export interface AsymmetricallyEncryptedMessage {
  nonceB64: string
  cipherB64: string
}
export type SymmetricallyEncryptedMessage = AsymmetricallyEncryptedMessage & {
  encryptedKeyB64: string
}
export declare class SecureChannel {
  private readonly secretHash
  constructor (x1: Uint8Array, x2: Uint8Array)
  encryptMessage (message: string): AsymmetricallyEncryptedMessage
  decryptMessage (encryptedMessage: AsymmetricallyEncryptedMessage): string
}
