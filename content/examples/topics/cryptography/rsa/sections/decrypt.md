To recover the message, the holder of the private key raises the ciphertext to the private exponent, mod $n$:

$$M = C^d \bmod n.$$

Raising to $d$ exactly undoes raising to $e$. For our ciphertext, $2790^{2753} \bmod 3233 = 65$ — the original message is back.

```diagram
{
  "type": "svg",
  "src": "assets/encrypt-decrypt-flow.svg"
}
```
