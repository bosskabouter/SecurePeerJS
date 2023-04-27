import { SecureCommunicationKey, type SymmetricallyEncryptedMessage } from '.'

let key: SecureCommunicationKey

export async function postCommunicationKey (key: SecureCommunicationKey): Promise<void> {
  navigator.serviceWorker.controller?.postMessage({ type: 'UPDATE_KEY', key: key.toJSON() })
}

export function initSecurePush (sw: ServiceWorkerGlobalScope, customHandleSecurePush?: (notification: NotificationOptions) => void): void {
  sw.addEventListener('message', handleMessage)
  sw.addEventListener('notificationclick', handleNotificationclick, false)
  sw.addEventListener('push', handlePush)

  function handleMessage (event: ExtendableMessageEvent): void {
    if (event.data.type === 'SKIP_WAITING') {
      // This allows the web app to trigger skipWaiting
      sw.skipWaiting().catch(console.error)
    } else if (event.data.type === 'UPDATE_KEY') {
      key = SecureCommunicationKey.fromJson(event.data.key)
    }
  }

  function handleNotificationclick (event: NotificationEvent): void {
    event.notification.close()

    event.waitUntil(

      sw.clients.matchAll({ type: 'window' }).then((clientsArr) => {
        // console.debug('Open windows: ' + clientsArr)
        // If a Window tab matching the targeted URL already exists, focus that;
        const hadWindowToFocus = clientsArr.some((windowClient) =>
          (windowClient.url.includes(self.location.origin)) ? (windowClient.focus(), true) : false
        )
        // Otherwise, open a new tab to the applicable URL and focus it.
        if (!hadWindowToFocus) {
          const dataString: string = event.notification.data.toString()
          sw.clients
            .openWindow(`${self.location.origin}/messages/${dataString}`)
            .then(async (windowClient) => ((windowClient != null) ? await windowClient.focus() : null)).catch(console.error)
        }
      })
    )
  }

  function handlePush (pushEvent: PushEvent): void {
    if (key?.peerId === undefined) {
      console.warn('No key yet to handle Secure Push Event')
      return
    }
    const payload: string = pushEvent.data?.text() ?? ''
    if (payload.length === 0) {
      console.warn('No push data available')
      return
    }
    let relayedMessage: SymmetricallyEncryptedMessage<NotificationOptions>
    try {
      relayedMessage = JSON.parse(payload)
    } catch (error) {
      console.warn('Invalid PushRequest', error)
      return
    }

    let options = key.decryptSym(relayedMessage)

    const actionOpen = {
      title: 'Open',
      action: 'open'
    }
    const actionClose = {
      title: 'Close',
      action: 'close'
    }

    options = {
      ...options,
      vibrate: [1000, 2000, 3000, 4000, 5000],
      actions: [actionOpen, actionClose]
    }

    customHandleSecurePush?.(options)
    sw.registration.showNotification('Pushed', options).catch(console.error)
  }
}

interface PeriodicSyncManager {
  register: (tag: string, options?: { minInterval: number }) => Promise<void>
}

declare global {
  interface ServiceWorkerRegistration {
    readonly periodicSync: PeriodicSyncManager
  }
}

export function registerSW (): void {
  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
      if (navigator.serviceWorker.controller != null) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // window.location.reload()
        })
      }

      void navigator.serviceWorker.ready.then(async (registration) => {
        if ('periodicSync' in registration) {
          const status = await navigator.permissions.query({
            // @ts-expect-error periodic-sync is not included in the default SW interface.
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
              registration.update().catch(console.error)
            }
          })
        }
      })
    }
  })
}
