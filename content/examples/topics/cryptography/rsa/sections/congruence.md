Two numbers are **congruent** mod $n$ when they leave the same remainder. It is written

$$a \equiv b \pmod{n}.$$

On the 12-hour clock, $15 \equiv 3 \pmod{12}$: both land on 3. The numbers aren't equal, but they are indistinguishable *once you've wrapped around* $n$.

This is the language RSA is stated in. The whole method rests on one congruence — a public number and a private number that multiply to $1$ in this wrapped world — which the next few steps build up to.
