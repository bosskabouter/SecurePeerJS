import React, { useEffect, useState } from 'react'

if ('serviceWorker' in navigator) {
  // && !/localhost/.test(window.location)) {
  // registerSW()

  console.info('registered')
}
export default function WebPush (): JSX.Element {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [subscription, setSubscription] = useState<PushSubscription | null>()
  useEffect(() => {
    void (async () => {
      const r = await navigator.serviceWorker.getRegistration()
      setRegistration(r)
      const s = await r?.pushManager.getSubscription()
      setSubscription(s)
    })()
  }, [])

  return (
    <div>
      <div>registration {registration?.toString()}</div>
      <div>subscription {subscription?.toString()}</div>
    </div>
  )
}
