# SecurePeer - Encrypted P2P

SecurePeer adds a layer of hybrid encryption and signature verification to [Peers](https://github.com/peers), a popular library for peer-to-peer communication.

## Contents

### 1. [SecurePeerKey](./packages/securepeerkey)

Asymmetric Encryption and Signing keys for a `SecureLayer` over a `SecureChannel` communication. _No installation needed, already included in server and client libraries._

### 2. [SecurePeerJS](./packages/securepeerjs)

 Extension of peerjs client library adding hybrid security between peers and server (optional)

### 3. [SecurePeerServer](./packages/securepeerserver) (optional)

Peer server library adding identity guarantee for connecting clients

### 4. [SecurePeerKey-BIP](./packages/securepeerkey-bip) (optional)

Extension of SecurePeerKey that adds BIP32 (HD wallets) and BIP39 (mnemonic seed word list) functionality

![Dall-e picture](./pub/DALL%C2%B7E_SecurePeerJS.png)


There is also an [example server](./exampleserver/) and [example client](./exampleserver/)  application available.
