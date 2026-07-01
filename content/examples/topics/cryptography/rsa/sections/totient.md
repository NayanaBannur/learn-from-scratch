Next comes a quantity derived from the two primes, the **totient** $\varphi(n)$:

$$\varphi(n) = (p-1)(q-1).$$

It counts how many numbers below $n$ share no factor with $n$. For our key, $\varphi(3233) = 60 \times 52 = 3120$.

The totient stays **secret**, because computing it needs $p$ and $q$. It never appears in either key — it is scaffolding used to build them, and the fact that only the key's creator can compute it is exactly what makes the private key private.
