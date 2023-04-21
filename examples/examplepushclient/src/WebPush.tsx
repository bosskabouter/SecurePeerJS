import React, { useEffect, useState } from 'react'
import { type SymmetricallyEncryptedMessage, sharedSubscription, pushMessage } from 'securepushjs'

export default function WebPush (): JSX.Element {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [subscription, setSubscription] = useState<SymmetricallyEncryptedMessage | null>()
  useEffect(() => {
    navigator.serviceWorker.getRegistration().then(setRegistration).catch(console.error)
    if (registration != null) {
      registration.pushManager.getSubscription().then(s => {
        (s != null) &&
          setSubscription(sharedSubscription(s))
          pushMessage()
      }).catch(console.error)
    }
  }, [registration, subscription])

  return (
    <div>
      <div>registration {registration?.toString()}</div>
      <div>subscription {subscription?.toString()}</div>
      <button onClick={pushMessage({})}>Push yourself</button>
    </div>
  )
}
