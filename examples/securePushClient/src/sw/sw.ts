// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.

import {
  initSecurePush
} from 'securepushjs'
import { clientsClaim } from 'workbox-core'
import {
  precacheAndRoute, cleanupOutdatedCaches
} from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

self.skipWaiting().catch(e => { console.error(e) })
clientsClaim()

// precache all of the assets generated by your build process.
// Their URLs are injected into the manifest variable below.
// This variable must be present somewhere in your service worker file,
// even if you decide not to use precaching. See https://cra.link/PWA
cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()
try {
  initSecurePush(self)
} catch (error) {
  console.error('Problem registering securePush worker: ', error)
}
self.clients.matchAll().then((clients) => {
  clients.forEach((client) => {
    client.postMessage({ message: 'Hello from the service worker!' })
  })
}).catch(e => { console.error(e) })

self.addEventListener('push', (p) => { console.info(p) })
self.addEventListener('message', (event) => {
  console.info(event)
  if (event.data !== undefined && event.data.type === 'SKIP_WAITING') { self.skipWaiting().catch(e => { console.error(e) }) }
})
