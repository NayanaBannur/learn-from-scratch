With the keys built, sending a secret is a single step. Turn the message into a number $M$ smaller than $n$, then raise it to the public exponent, mod $n$:

$$C = M^e \bmod n.$$

The result $C$ is the **ciphertext**. Anyone can compute it, because $e$ and $n$ are public.

For our key and a message $M = 65$, this gives $C = 65^{17} \bmod 3233 = 2790$. That number is what travels across the wire; on its own it reveals nothing about $65$.
