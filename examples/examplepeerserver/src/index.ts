import { SecurePeerKey } from 'securepeerkey'
import { createSecurePeerServer } from 'securepeerserver'
void SecurePeerKey.create('aStrongServerkey123').then((key) => {
  console.info('SecurePeerKey', key.peerId)
  // 7d169e89fbf1c82addbbe3d3f01c94239ee636fdd691fba5a915893d0bb93b3f
  createSecurePeerServer(key, {
    port: 9000,
    path: '/'
  })
}).catch(console.error)
