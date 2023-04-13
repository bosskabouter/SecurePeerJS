
# SecurePeerServer

SecurePeerServer is an extension to [PeerServer](https://github.com/peers/peerjs-server) that adds hybrid encryption and signature verification to connecting peers. This allows peers to guarantee their identity and establish a secure connection.

> This library is part of [SecurePeerJS](https://github.com/bosskabouter/SecurePeerJS)

## Installation

``` bash
npm i securepeerserver
```

## Usage

To start the server, a [SecurePeerKey](../securepeerkey/) is needed (included in the server dependencies).

``` typescript
import { SecurePeerKey, createSecurePeerServer } from 'securepeerserver'

SecurePeerKey.create('theserverkey').then((key: SecurePeerKey) => {
  createSecurePeerServer(key, {
    port: 9000,
    path: '/'
  })
}).catch(console.error)
```

> - The createSecurePeerServer accepts the same [options](https://github.com/peers/peerjs-server#config--cli-options) as a normal peerserver, with the exception of generateClientId
> - Also available createSecureExpressPeerServer for the equivalent [ExpressPeerServer](https://github.com/peers/peerjs-server#combining-with-existing-express-app)

## See [exampleserver](../../exampleserver) for a running node

``` bash
> exampeserver@1.0.0 start
> node out/server.js

SecurePeerServer config { port: 9000, path: '/', generateClientId: undefined }
SecurePeerServer Public Key: 7d169e89fbf1c82addbbe3d3f01c94239ee636fdd691fba5a915893d0bb93b3f
```
