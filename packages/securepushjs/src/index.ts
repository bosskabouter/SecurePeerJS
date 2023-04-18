import { SecureCommunicationKey, type SymmetricallyEncryptedMessage } from 'secure-communication-kit'

export * from 'secure-communication-kit'

export const SECUREPUSH_RELAY_SERVER_PUBLIC_KEY = '334'
export interface WebPushRequest {
  encryptedPushSubscription: SymmetricallyEncryptedMessage
  encryptedPayload: string
}

export interface SecurePushMessage {
  destination: SymmetricallyEncryptedMessage
  title: string
  body: string
  image: string
}

export async function pushMessage (securePushMessage: SecurePushMessage): Promise<boolean> {
  return false
}

// private symmetricallyEncryptedMessage:SymmetricallyEncryptedMessage
export function sharedSubscription (subscription: PushSubscription): SymmetricallyEncryptedMessage {
  return SecureCommunicationKey.encryptWithRelay(SECUREPUSH_RELAY_SERVER_PUBLIC_KEY, JSON.stringify(subscription))
}
