import sodium from 'libsodium-wrappers'

/**
 * An unencrypted envelope that contains a signed and encrypted HandshakeMessage.
 */
export interface EncryptedHandshake {
  /**
   * The base64-encoded encrypted HandshakeMessage.
   */
  message: string
  /**
   * The base64-encoded signature of the encrypted HandshakeMessage.
   */
  signature: string
  /**
   * The public signing key of the sender.
   */
  publicSignKey: string
}

/**
 *  To Decrypt a SecureMessage, the public key of the sender is needed because it is used to encrypt the message for the intended recipient. This allows only the recipient, who possesses the private key corresponding to the public key used in the encryption, to decrypt and read the message.
 *
AsymmetricallyEncryptedMessage is encrypted using the public key of the intended recipient. While this provides confidentiality, it does not provide protection against potential attacks on the communication channel or on the recipient's private key.

 */
export interface AsymmetricallyEncryptedMessage {
  nonceB64: string
  cipherB64: string
}
/**
 * A SecureRelayMessage is encrypted using a symmetric key, which is then itself encrypted using the public key of the relay server. This means that the relay server does not need to know the sender's public key to decrypt and forward the message to the intended recipient. Instead, the recipient's private key is used to decrypt the symmetric key, which is then used to decrypt the message. This allows for secure communication without the need for the relay server to know the identities of the sender and recipient.
 *22
A SecureRelayMessage is designed to provide secure communication through a relay server, while also maintaining the confidentiality of the message contents. It achieves this by encrypting the message using a symmetric key, which is then itself encrypted using the public key of the relay server. The relay server can then forward the message to the intended recipient without being able to read its contents.
 * @see [encryptForRelay](#SecureRelay-encryptForRelay)
 * @see [decryptFromRelay](#SecureRelay-decryptFromRelay)
 */
export type SymmetricallyEncryptedMessage = AsymmetricallyEncryptedMessage & { encryptedKeyB64: string }

/**
 * Key pair used for secure communication between two peers.
 */
export class SecureCommunicationKey {
  /**
   *
   * @param seed value to derive the key from. Can be a) a Uint8Array with seed for crypto_sign_seed_keypair, b) any string password to  derive the seed value from using crypto_generichash. Caution: this can results in a weak keyset if string doesn't contain enough entropy.
   * @returns Instance of the SecureChannelKey class
   */
  public static async create (
    seed?: Uint8Array | string
  ): Promise<SecureCommunicationKey> {
    await sodium.ready
    // if seed is just a simple string password, convert it to full 32 byte seed value
    let signKeyPair, boxKeyPair, kxKeyPair

    if (typeof seed === 'string') {
      seed = sodium.crypto_generichash(32, seed)
    }
    if (seed != null) {
      signKeyPair = sodium.crypto_sign_seed_keypair(seed)
      boxKeyPair = sodium.crypto_box_seed_keypair(seed)
      kxKeyPair = sodium.crypto_kx_seed_keypair(seed)
    } else {
      signKeyPair = sodium.crypto_sign_keypair()
      boxKeyPair = sodium.crypto_box_keypair()
      kxKeyPair = sodium.crypto_kx_keypair()
    }

    return new this({ signKeyPair, boxKeyPair, kxKeyPair })
  }

  /**
   * @see create to initialize key
   */
  protected constructor (readonly keySet: KeySet) {}

  /**
   * @returns Public identifier of this peer, based on the hex value of public box key (asymmetric encryption key - x25519). Used to initiate a secure channel and establish a shared secret through hybrid encryption/verification.
   */
  get peerId (): string {
    return sodium.to_hex(this.keySet.kxKeyPair.publicKey)
  }

  /**
   *
   * @param peerId Destination Peer ID to initiate a new secure channel with. This public box key is used in the hybrid encryption/verification handshake to establish a shared secret.
   * @returns a shared secret (to be kept secret :), together with the handshake to send to the other peer in order for him to establish the same shared secret on his side.
   */
  initiateHandshake (peerId: string): SecureChannel {
    const kx = sodium.crypto_kx_client_session_keys(this.keySet.kxKeyPair.publicKey, this.keySet.kxKeyPair.privateKey, sodium.from_hex(peerId))
    return new SecureChannel(kx.sharedTx, kx.sharedRx)
  }

  /**
   * Established the same shared secret as the sending peerId, using given encrypted handshake message.
   * @param peerId
   * @param handshake
   * @returns the shared secret key
   * @throws Error if anything prevented from establishing shared secret from handshake
   */
  receiveHandshake (peerId: string): SecureChannel {
    const kx = sodium.crypto_kx_server_session_keys(
      this.keySet.kxKeyPair.publicKey,
      this.keySet.kxKeyPair.privateKey,
      sodium.from_hex(peerId))
    return new SecureChannel(kx.sharedRx, kx.sharedTx)
  }

  /**
In a normal SecureMessage, the public key of the sender is needed because it is used to encrypt the message for the intended recipient. This allows only the recipient, who possesses the private key corresponding to the public key used in the encryption, to decrypt and read the message.
   * @param publicKey - The recipient's public key.
   * @param message - The message to be encrypted.
   * @returns The encrypted message and nonce.
   */
  encryptWithPublicKey (publicKey: string, message: string): AsymmetricallyEncryptedMessage {
    const nonce = (sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES))
    const cipherB64 = sodium.to_base64(sodium.crypto_box_easy(message, nonce, sodium.from_hex(publicKey), this.keySet.boxKeyPair.privateKey))
    return { nonceB64: sodium.to_base64(nonce), cipherB64 }
  }

  /**
 * Decrypts a message originating from given sender's public key.
 * @param originPublicKey - The sender's public key.
 * @param encryptedMessage - The encrypted message and nonce.
 * @returns The decrypted message.
 */
  decryptWithPublicKey (originPublicKey: string, encryptedMessage: AsymmetricallyEncryptedMessage): string {
    return sodium.to_string(
      sodium.crypto_box_open_easy(
        sodium.from_base64(encryptedMessage.cipherB64),
        sodium.from_base64(encryptedMessage.nonceB64),
        sodium.from_hex(originPublicKey),
        this.keySet.boxKeyPair.privateKey
      )
    )
  }

  /**
 *
 * @param publicKey
 * @param message
 * @returns
 */
  static encryptWithRelay (publicKey: string, message: string): SymmetricallyEncryptedMessage {
  // Generate a random symmetric key for AES encryption
    const sharedSecret = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES)

    // Encrypt the message with AES
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const cipherB64 = sodium.to_base64(sodium.crypto_secretbox_easy(message, nonce, sharedSecret))

    // Encrypt the symmetric key with RSA public key of the relay server
    const encryptedKeyB64 = sodium.to_base64(sodium.crypto_box_seal(sharedSecret, sodium.from_hex(publicKey)))
    return { cipherB64, encryptedKeyB64, nonceB64: sodium.to_base64(nonce) }
  }

  /**
 *
 * @param relayedMessage
 * @returns
 */
  decryptFromRelay (relayedMessage: SymmetricallyEncryptedMessage): string {
    const decryptedKey = sodium.crypto_box_seal_open(sodium.from_base64(relayedMessage.encryptedKeyB64), this.keySet.boxKeyPair.publicKey, this.keySet.boxKeyPair.privateKey)

    // Decrypt the message with the recovered symmetric key
    return sodium.to_string(sodium.crypto_secretbox_open_easy(sodium.from_base64(relayedMessage.cipherB64), sodium.from_base64(relayedMessage.nonceB64), decryptedKey))
  }
}
/**
 * The key contains an encryption and a signing key, based on the same seed
 */
interface KeySet {
  signKeyPair: sodium.KeyPair
  boxKeyPair: sodium.KeyPair
  kxKeyPair: sodium.KeyPair
}

/**
 * Once a shared secret has been established in between two participants during handshake, a secure channel is able to encrypt and decrypt messages using this shared common secret
 */
export class SecureChannel {
  private readonly secretHash: Uint8Array
  /**
     *
     * @param sharedSecret
     */
  constructor (x1: Uint8Array, x2: Uint8Array) {
    const hashConcat = new Uint8Array(x1.length + x2.length)
    hashConcat.set(x1)
    hashConcat.set(x2, x1.length)

    this.secretHash = sodium.crypto_generichash(
      sodium.crypto_kx_SESSIONKEYBYTES,
      hashConcat
    )
  }

  encryptMessage (message: string): AsymmetricallyEncryptedMessage {
    // Generate a new random nonce for each message
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    // Encrypt the message with the shared secret and nonce
    const cipherB64 = sodium.to_base64(sodium.crypto_secretbox_easy(
      message,
      nonce,
      this.secretHash
    ))
    return { nonceB64: sodium.to_base64(nonce), cipherB64 }
  }

  decryptMessage (encryptedMessage: AsymmetricallyEncryptedMessage): string {
    // Decrypt the message with the shared secret and nonce
    const decryptedBytes = sodium.crypto_secretbox_open_easy(
      sodium.from_base64(encryptedMessage.cipherB64),
      sodium.from_base64(encryptedMessage.nonceB64),
      this.secretHash
    )
    return sodium.to_string(decryptedBytes)
  }
}
