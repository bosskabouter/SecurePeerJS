# SecurePeerServer

``` bash
npm i securepeerserver
```

SecurePeerServer adds the handshake method used between peers to the connect handler when peer try to register. The server's public key (his peerId) should be known to clients before connecting, to be able to establish the shared secret. This allows peers to guarantee their own identity on the network while connecting.

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

