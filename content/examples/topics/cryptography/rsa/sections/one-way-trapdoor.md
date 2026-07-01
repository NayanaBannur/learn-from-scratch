Public-key cryptography needs a **one-way operation**: easy to compute forward, but practically impossible to reverse without a secret shortcut. An operation with such a shortcut is called a **trapdoor**.

Multiplying primes is one. Multiply $61 \times 53$ and you reach $3233$ in a moment. Handed $3233$ alone, recovering the two primes takes real effort — and for primes hundreds of digits long, no known method finishes in any feasible time. [[cite:rsa78]]

That gap — trivial to multiply, infeasible to factor — is the entire foundation. The private key will sit behind a factoring problem no one can solve in time.
