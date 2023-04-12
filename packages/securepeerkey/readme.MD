# SecurePeerKey - Hybrid Encryption/Verification

## Introduction

SecurePeerKey is a JavaScript library that enables secure communication between two peers by using an encryption and a signing key pair, both based on the same seed. It establishes a shared secret between two keys, which then can be used for encrypting further communication between the peers after this initial handshake. This secret is established through hybrid encryption/verification in a handshake process.

## Installation

> This module is already included in SecurePeerServer and SecurePeerJS, but can be installed.

``` bash
npm i securepeerkey
```

## Usage

``` javascript
import { SecurePeerKey, SecureChannel } from 'securepeerkey'

const key1 = await SecurePeerKey.create()
const key2 = await SecurePeerKey.create()

const handshake12 = key1.initiateHandshake(key2.peerId)
// send the handshake over to another key owner
const sentHandshake = handshake12.handshake
const sharedSecret21 = key2.receiveHandshake(key1.peerId, sentHandshake)

const secureChannel12 = new SecureChannel(handshake12.sharedSecret)
const secureChannel21 = new SecureChannel(sharedSecret21)

const encryptedMessage = secureChannel12.encryptMessage('Hello world!')
const decrypted = secureChannel21.decryptMessage(encryptedMessage)

expect(decrypted).toBe('Hello world!')

```
