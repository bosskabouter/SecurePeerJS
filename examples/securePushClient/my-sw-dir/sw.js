// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
import { initSecurePush } from 'securepushjs';
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
console.info('Registering Simple Example SW');
self.skipWaiting().catch(console.error);
clientsClaim();
// precache all of the assets generated by your build process.
// Their URLs are injected into the manifest variable below.
// This variable must be present somewhere in your service worker file,
// even if you decide not to use precaching. See https://cra.link/PWA
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
initSecurePush(self);
self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
        client.postMessage({ message: 'Hello from the service worker!' });
    });
}).catch(console.error);
self.addEventListener('message', (event) => {
    if (event.data !== undefined && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting().catch(console.error);
    }
});