import React, { useEffect, useState } from 'react'
import { SecureCommunicationKey, type SecurePushMessage, SecurePusher, type PushServerConfig, postCommunicationKey } from 'securepushjs'

import TEST_VALUES from '../../example-config.json'

const serverConfig: PushServerConfig = {
  host: 'http://localhost:'.concat(TEST_VALUES.testConfig.server.port.toString()),
  path: TEST_VALUES.testConfig.server.SEC_PUSH_CTX,
  publicKey: TEST_VALUES.testConfig.server.publicKey,
  vapidKey: TEST_VALUES.testConfig.vapid.publicKey
}

export default function WebPush (): JSX.Element {
  const [key, setKey] = useState<SecureCommunicationKey>()
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [subscription, setSubscription] = useState<PushSubscription | null>()
  const [securePusher, setSecurePusher] = useState<SecurePusher | null>()
  const [pushResult, setPushResult] = useState<boolean>()

  useEffect(() => {
    if (key == null) {
      void (async () => {
        setKey(await SecureCommunicationKey.create('My fixed key'))
      })()
    } else if (registration == null) {
      navigator.serviceWorker.getRegistration().then(setRegistration).catch(console.error)
    } else if (subscription === undefined) {
      postCommunicationKey(key).catch(console.error)

      registration.pushManager.subscribe({ applicationServerKey: TEST_VALUES.testConfig.vapid.publicKey, userVisibleOnly: true }).then(console.info).catch(console.error)
      registration.pushManager.getSubscription().then(setSubscription).catch(console.error)
    } else if (subscription !== null) {
      setSecurePusher(new SecurePusher(subscription, key, serverConfig))
    }
  }, [registration, subscription, key])

  return (
    <div>
      <div>Key: {key?.peerId}</div>
      <div>Registration: {registration?.toString()}</div>
      <div>Subscription: {subscription?.endpoint}</div>
      <div>Push result: {pushResult?.toString()}</div>
      <button onClick={postMessage}>Push yourself</button>
    </div>
  )

  function postMessage (): void {
    const msg = makeSecureMessage()
    msg != null && securePusher?.pushMessage([msg]).then(setPushResult).catch(console.error)
  }
  function makeSecureMessage (): SecurePushMessage | null {
    if (subscription != null && key != null) {
      const msg: NotificationOptions = { body: 'Hello World', vibrate: [2000, 100, 200, 1000] }
      const spm: SecurePushMessage = {
        encryptedEndpoint: SecureCommunicationKey.encrypt(serverConfig.publicKey, subscription),
        encryptedPayload: SecureCommunicationKey.encrypt(key.peerId, msg)
      }
      return spm
    }
    return null
  }
}
