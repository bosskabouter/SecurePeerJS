# SecurePush

SecurePush is a JavaScript library part of the [SecurePeerJS Suite](../../) that builds on the functionality of the popular [web-push](https://github.com/web-push-libs/web-push) library. The primary goal of SecurePush is to enable ***secure, encrypted offline messaging between browsers***, using push notifications.

To achieve this goal, SecurePush leverages a combination of asymmetric encryption and signing key pairs using [SecurePeerKey](../securepeerkey/). Every participant in the messaging system, including both the clients and the server, own both a signing and encryption key pair. These key pairs are used to verify and encrypt messages as they are exchanged between parties.

In a browser application using SecurePush, users can securely share their subscription endpoint with each other, encrypted using asymmetric encryption with the server's public key. This ensures that only the push server can decrypt the subscription endpoint. The server doesn't know the owner of the endpoint by using anonymous encrypted `SecureRelayMessage`.  

Once the subscription endpoint is shared, the content of the message is encrypted and remains so until it is delivered at the push event on the recipient's browser. The encrypted content is then sent to the web-push server along with the encrypted subscription endpoint. The server decrypts the endpoint, allowing it to deliver the encrypted message to the correct recipient. No server has access to the payload. SecurePush Relay Server 

Overall, SecureWebPush provides a powerful and flexible framework for enabling secure, encrypted offline messaging using push notifications. Its use of asymmetric encryption and key pairs helps to ensure that messages are kept private and secure, even when they are being exchanged across potentially insecure networks.
