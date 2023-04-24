import React, { useEffect, useState } from 'react'
import { SecureCommunicationKey, type SecurePushMessage, SecurePusher, type PushServerConfig } from 'securepushjs'

const serverConfig: PushServerConfig = { host: 'localhost', path: '', publicKey: '23', vapidKey: 'ABC' }

export default function WebPush (): JSX.Element {
  const [key, setKey] = useState<SecureCommunicationKey>()
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [subscription, setSubscription] = useState<PushSubscription | null>()

  const [securePusher, setSecurePusher] = useState<SecurePusher | null>()

  const [pushResult, setPushResult] = useState<boolean>()
  useEffect(() => {
    if (key === undefined) {
      void (async () => {
        setKey(await SecureCommunicationKey.create())
      })()
    } else {
      navigator.serviceWorker.getRegistration().then(setRegistration).catch(console.error)
    } if (registration != null && key != null) {
      console.info('registration', registration)

      registration.pushManager.subscribe({ applicationServerKey: 'BEUo6k6HBBBHusLq6BOGYlpnr9lcq-9yuiKee0XpbkNPMQm20m7KPbz_eJz2nggEmnk9QkL2KxubYpHP-CY_pAg', userVisibleOnly: true }).then(s => { console.info('Subscribing', s) }).catch(console.error)
      registration.pushManager.getSubscription().then(async s => {
        console.info('subscription', s)
        if
        (s != null) {
          setSubscription(s)

          const sp = new SecurePusher(s, key, serverConfig)
          setSecurePusher(sp)
        }
      }).catch(console.error)
    }
  }, [registration, subscription, key])

  return (
    <div>
      <div>registration {registration?.toString()}</div>
      <div>subscription {subscription?.toString()}</div>
      <div>push result {pushResult?.toString()}</div>
      <button onClick={postMessage}>Push yourself</button>
    </div>
  )

  function postMessage (): void {
    const msg = makeSecureMessage()
    msg != null && securePusher?.pushMessage([msg]).then(setPushResult).catch(console.error)
  }
  function makeSecureMessage (): SecurePushMessage | null {
    if (subscription != null && key != null) {
      const msg: NotificationOptions = { body: 'Hello World' }
      const spm: SecurePushMessage = {
        encryptedEndpoint: SecureCommunicationKey.encrypt(serverConfig.publicKey, subscription),
        encryptedPayload: SecureCommunicationKey.encrypt(key.peerId, msg)
      }
      return spm
    }
    return null
  }
}
