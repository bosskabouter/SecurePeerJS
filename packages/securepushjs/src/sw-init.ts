import { type SecureCommunicationKey, type SecurePushMessage, type SymmetricallyEncryptedMessage } from '.'

export function initSecurePush (sw: ServiceWorkerGlobalScope, comKey: SecureCommunicationKey): void {
  sw.addEventListener('message', handleMessage)
  sw.addEventListener('notificationclick', handleNotificationclick, false)
  sw.addEventListener('push', handlePush)

  async function handleMessage (event: ExtendableMessageEvent): Promise<void> {
    console.debug('SW received message event!', event)
    if (event.data.type === 'SKIP_WAITING') {
      // This allows the web app to trigger skipWaiting
      sw.skipWaiting()
    } else if (event.data.type === 'UPDATE_KEY') {
      const iv = event.data.iv
      const algorithm = { name: 'AES-GCM', iv }
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('my-secret-key'),
        algorithm,
        false,
        ['decrypt']
      )
      const dataToDecrypt = event.data.encryptedData
      const decryptedDataBuffer = await crypto.subtle.decrypt(algorithm, key, dataToDecrypt)

      // Convert the decrypted data to a string and parse it as JSON
      const decryptedDataString = new TextDecoder().decode(decryptedDataBuffer)
      comKey = JSON.parse(decryptedDataString)

      // Use the sensitive data to open the database
      // const db = await openDatabase(sensitiveData)
      console.info('ServiceWorker received key', comKey)
    }
  }

  function handleNotificationclick (event: NotificationEvent): void {
    console.debug('Clicked pushed notification', event)
    event.notification.close()

    console.log('self.location.origin', self.location.origin)
    event.waitUntil(
      sw.clients.matchAll({ type: 'window' }).then((clientsArr) => {
        // console.debug('Open windows: ' + clientsArr)
        // If a Window tab matching the targeted URL already exists, focus that;
        const hadWindowToFocus = clientsArr.some((windowClient) =>
          (windowClient.url.includes(self.location.origin) === true) ? (windowClient.focus(), true) : false
        )
        // Otherwise, open a new tab to the applicable URL and focus it.
        if (hadWindowToFocus === false) {
          sw.clients
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            .openWindow(`${self.location.origin}/messages/${event.notification.data}`)
            .then(async (windowClient) => ((windowClient != null) ? windowClient.focus() : null))
        }
      })
    )
  }

  function handlePush (pushEvent: PushEvent): void {
    console.info('Push Event received!', pushEvent)

    const payload: string = pushEvent.data?.text() ?? ''
    if (payload.length === 0) {
      console.warn('No push data available')
      return
    }
    let relayedMessage: SymmetricallyEncryptedMessage
    try {
      relayedMessage = JSON.parse(payload)
    } catch {
      console.warn(`Unrecognized payload: ${payload}`)
      return
    }

    console.debug('Encrypted push data.text', payload)

    let message: SecurePushMessage
    try {
      message = JSON.parse(comKey.decryptFromRelay(relayedMessage))
    } catch (e) {
      console.error(e)
      return
    }

    // const contact = contacts?.get(message.sender)

    // if (!contact) {
    //   console.warn('Received Push from unknown contact', payload)
    //   return
    // } else console.log('Found contacts for pushmessage ', contact)

    const actionOpen = {
      title: 'Open',
      action: 'open'
    }
    const actionClose = {
      title: 'Close',
      action: 'close'
    }

    message = {
      ...message,
      vibrate: [1000, 2000, 3000, 4000, 5000],
      actions: [actionOpen, actionClose]
    }
    sw.registration.showNotification('Pushed', message)
  }
}

export async function updateKey (comKey: SecureCommunicationKey): Promise<void> {
  const key = crypto.getRandomValues(new Uint8Array(32))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Convert the sensitive data object to a JSON string
  const sensitiveData = comKey
  const sensitiveDataString = JSON.stringify(sensitiveData)

  // Convert the encryption key to an ArrayBuffer
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength)

  // Import the encryption key as a CryptoKey object
  const algorithm = { name: 'AES-GCM', iv }
  const keyObject = await crypto.subtle.importKey(
    'raw', keyBuffer, algorithm, false, ['encrypt', 'decrypt']
  )

  // Encrypt the sensitive data using AES-GCM
  const encryptedData = await crypto.subtle.encrypt(algorithm, keyObject, new TextEncoder().encode(sensitiveDataString))

  // Send the encrypted data and IV to the service worker
  navigator.serviceWorker.controller?.postMessage({ type: 'SET_SENSITIVE_DATA', encryptedData, iv })
}
interface PeriodicSyncManager {
  register: (tag: string, options?: { minInterval: number }) => Promise<void>
}

declare global {
  interface ServiceWorkerRegistration {
    readonly periodicSync: PeriodicSyncManager
  }
}

export function initSW (key: SecureCommunicationKey): void {
  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
      console.info('initSW', key)
      //   void navigator.serviceWorker.register('../sw.js')

      if (navigator.serviceWorker.controller != null) {
        console.info('navigator.serviceWorker.controller', navigator.serviceWorker.controller)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      }

      void navigator.serviceWorker.ready.then(async (registration) => {
        updateKey(key).catch(console.error)
        if ('periodicSync' in registration) {
          const status = await navigator.permissions.query({
            // @ts-expect-error periodicsync is not included in the default SW interface.
            name: 'periodic-background-sync'
          })

          if (status.state === 'granted') {
            await registration.periodicSync.register('UPDATE_CHECK', {
              minInterval: 24 * 60 * 60 * 1000
            })
          }
        }

        if (window.matchMedia('(display-mode: standalone)').matches) {
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'hidden') {
              navigator.serviceWorker.controller?.postMessage('UPDATE_CHECK')
              void registration.update()
            }
          })
        }
      })
    }
  })
}
