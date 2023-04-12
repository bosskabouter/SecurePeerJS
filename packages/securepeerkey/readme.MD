# SecurePeerKey - Peer with encryption

SecurePeer is a library that adds a layer of hybrid security to [Peers](https://github.com/peers), a popular library for peer-to-peer communication. SecurePeer uses [libsodium](https://github.com/jedisct1/libsodium.js) for encryption and signature verification to ensure secure communication between peers. It also offers an optional server implementation for identity verification.

## Install SecurePeerJS

``` bash

    npm i securepeerjs
```

## Usage

``` typescript
    // Participants need a SecurePeerKey
    const key = await SecurePeerKey.create('some seed'); 
    const securePeer = new SecurePeer(key);

    securePeer.on('open', () => {
      securePeer.on('connection', (con) => {
        const secureLayer = con.metadata.secureLayer;
        secureLayer.on('decrypted', console.info);
        secureLayer.send('Thanks for your secure message!');
      });
    });

    const somePeerId = (await SecurePeerKey.create()).peerId
    const secureLayer = securePeer.connectSecurely(somePeerId)
    secureLayer.send('Send this securely!')
```

## SecurePeerServer (optional)

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

## SecurePeerKeyBIP

Just for fun, there is a [Bip32](https://github.com/bitcoinjs/bip39)  Hierarchical Deterministic (HD) + [Bip39](https://github.com/bitcoinjs/bip32) Mnemonic seed word list version of the key. Don't forget to exclude unused word lists to lower bundle size :)

``` bash
npm i securepeerkey-bip
```

``` javascript
const key = await SecurePeerKeyBip.createBipKey('plastic seed stadium payment arrange inherit risk spend suspect alone debris very')
```

![Dali](./pub/DALL%C2%B7E_SecurePeerJS.png)
