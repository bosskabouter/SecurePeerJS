import React, { useEffect, useState } from 'react'
import { SecureCommunicationKey, SecurePusher, type PushServerConfig } from 'securepushjs'

import TEST_VAPID_KEYS from '../../secureP2pServer/vapidKeys.test.json'
import TEST_VALUES from '../../example-config.json'

const serverConfig: PushServerConfig = {
  host: 'http://localhost:'.concat(TEST_VALUES.testConfig.server.port.toString()),
  path: TEST_VALUES.testConfig.server.SEC_PUSH_CTX,
  publicKey: TEST_VALUES.testConfig.server.publicKey,
  vapidKey: TEST_VAPID_KEYS.publicKey
}
export default function WebPush (): JSX.Element {
  const [secureKey, setSecureKey] = useState<SecureCommunicationKey>()
  const [securePusher, setSecurePusher] = useState<SecurePusher | null>()
  const [pushResult, setPushResult] = useState<boolean>()

  useEffect(() => {
    (async () => {
      const secureKey = await SecureCommunicationKey.create()
      setSecureKey(secureKey)
      setSecurePusher(await SecurePusher.register(secureKey, serverConfig))
    })().catch(console.error)
  }, [])

  return (
    <div>
      <div>Key: {secureKey?.peerId}</div>
      <div>SecurePusher: {securePusher?.sharedSubscription?.toString()}</div>
      <div>Push result: {pushResult?.toString()}</div>
      <button onClick={ () => { postMessage().catch(console.error) }}>Push yourself</button>
    </div>
  )

  async function postMessage (): Promise<void> {
    secureKey !== undefined && setPushResult(
      await pushSecureMessage('Hi!', secureKey.peerId))
  }

  async function pushSecureMessage (payload: string, peerId: string): Promise<boolean | undefined> {
    return securePusher?.pushText({ body: payload, vibrate: [2000, 100, 200, 1000] } satisfies NotificationOptions, peerId, securePusher.sharedSubscription)
  }
}
