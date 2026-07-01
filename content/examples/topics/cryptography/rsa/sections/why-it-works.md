Why does raising to $d$ return the message? Because $e$ and $d$ were chosen so that $ed = k\varphi(n) + 1$ for some whole number $k$. Decryption therefore computes

$$C^d = M^{ed} = M^{k\varphi(n)+1} \pmod{n}.$$

**Euler's theorem** finishes the argument: for any $M$ sharing no factor with $n$,

$$M^{\varphi(n)} \equiv 1 \pmod{n}.$$

So $M^{k\varphi(n)+1} = (M^{\varphi(n)})^k \cdot M \equiv 1^k \cdot M \equiv M$. [[cite:rsa-intro]] The exponent $ed$ carries $M$ a whole number of laps around the modular circle and sets it down exactly where it started.
