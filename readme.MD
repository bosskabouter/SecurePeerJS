# SecurePeer - Encrypted P2P

SecurePeer adds a layer of hybrid encryption and signature verification to [Peers](https://github.com/peers), a popular Javascript library for peer-to-peer communication.

## Contents

To see the whole bundling running (client + server);

```bash
git clone https://github.com/bosskabouter/SecurePeerJS.git 
cd SecurePeerJS
npm i && npm start
```

### 1. [SecurePeerKey](./packages/securepeerkey)

Asymmetric Encryption and Signing keys for a `SecureChannel` communication.

### 2. [SecurePeerJS](./packages/securepeerjs)

 Extension of [peerjs client library](https://github.com/peers/peerjs) adding `SecureLayer` between peers.

### 3. [SecurePeerServer](./packages/securepeerserver) (optional)

Extension of [PeerJS Server](https://github.com/peers/peerjs-server) adds identity verification for connecting clients.

### 4. [SecurePeerKey-BIP](./packages/securepeerkey-bip) (optional)

Extension of [SecurePeerKey](#1-securepeerkey) adds BIP32 (HD wallets) and BIP39 (mnemonic seed word list) functionality to the key.

There are is also an [example server](./exampleserver/), [example client Vite + Typescript](./exampleclient1/) and [example client Vite + React](./exampleclient1/) available.
