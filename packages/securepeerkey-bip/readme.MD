
# SecurePeerKeyBIP

Just for fun, there is a [Bip32](https://github.com/bitcoinjs/bip39)  Hierarchical Deterministic (HD) + [Bip39](https://github.com/bitcoinjs/bip32) Mnemonic seed word list version of the key. Don't forget to exclude unused word lists to lower bundle size :)

``` bash
npm i securepeerkey-bip
```

``` javascript
const key = await SecurePeerKeyBip.createBipKey('plastic seed stadium payment arrange inherit risk spend suspect alone debris very')
```
