
# SecurePeerServer

SecurePeerServer adds the handshake method used between peers to the connect handler when peer try to register. The server's public key (his peerId) must be known to clients before connecting, so clients can establish a shared secret for the handshake. This allows peers to guarantee their own identity on the network when connecting, avoiding others to use their address, as is possible in the normal peerserver.

> this library is part of [SecurePeer](https://github.com/bosskabouter/SecurePeerJS)

## Install

``` bash
npm i securepeerserver
```

``` typescript
    import { SecurePeerKey, createSecurePeerServer } from 'securepeer'
    SecurePeerKey.create('theserverkey').then((key: SecurePeerKey) => {
      createSecurePeerServer(key, {
        port: 9000,
        path: '/'
      })
    }).catch(console.error)
```
>
> - The createSecurePeerServer accepts, besides the required key, the same options as a normal peerserver.
> - Also available createSecureExpressPeerServer for the equivalent ExpressPeerServer

``` bash
> exampeserver@1.0.0 start
> node out/server.js

SecurePeerServer config { port: 9000, path: '/', generateClientId: undefined }
SecurePeerServer Public Key: 7d169e89fbf1c82addbbe3d3f01c94239ee636fdd691fba5a915893d0bb93b3f
```
