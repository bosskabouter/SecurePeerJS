module.exports = {
  // ...
  // Configure the wasm-pack-plugin
  plugins: [
    [
      '@wasm-tool/wasm-pack-plugin',
      {
        // Use the ESM target
        target: 'web'
        // ...
      }
    ]
  ]
}
