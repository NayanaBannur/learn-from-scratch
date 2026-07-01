Build a key pair yourself. Pick two primes $p$ and $q$, choose a public exponent $e$, and type a message number $M$. The modulus, totient, and private exponent derive in front of you, and the message makes the full round trip $M \to C \to M$.

```diagram
{
  "type": "component",
  "module": "assets/RsaKeyDerivation.jsx"
}
```
