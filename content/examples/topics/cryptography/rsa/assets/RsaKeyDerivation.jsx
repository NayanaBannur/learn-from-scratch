import React, { useMemo, useState } from 'react'

// Interactive RSA key derivation: type two primes p, q, a public exponent e, and
// a message number M, and watch the whole key derive and the message round-trip
// M -> C -> M. Everything is computed live with BigInt so the modular powers are
// exact. Bad input (non-prime p/q, an e that shares a factor with phi, or M >= n)
// is caught and explained rather than silently producing garbage.
// Defaults to the section's running example: p=61, q=53, e=17, M=65.

const DEFAULTS = { p: '61', q: '53', e: '17', m: '65' }

const BLUE = '#2563eb'
const BLUE_BG = '#e6effe'
const GREEN = '#2f6f4f'
const GREEN_BG = '#eaf4ee'
const RED = '#b42318'
const MUTED = '#6b7280'
const LINE = '#e7e7e4'
const INK = '#1f2328'

function isPrime(n) {
  if (n < 2n) return false
  if (n % 2n === 0n) return n === 2n
  for (let i = 3n; i * i <= n; i += 2n) {
    if (n % i === 0n) return false
  }
  return true
}

function gcd(a, b) {
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a < 0n ? -a : a
}

// Modular inverse via the extended Euclidean algorithm; null if none exists.
function modInverse(a, m) {
  let [oldR, r] = [a % m, m]
  let [oldS, s] = [1n, 0n]
  while (r !== 0n) {
    const quot = oldR / r
    ;[oldR, r] = [r, oldR - quot * r]
    ;[oldS, s] = [s, oldS - quot * s]
  }
  if (oldR !== 1n) return null
  return ((oldS % m) + m) % m
}

function modPow(base, exp, mod) {
  base %= mod
  let result = 1n
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod
    base = (base * base) % mod
    exp >>= 1n
  }
  return result
}

function parse(s) {
  if (!/^\d+$/.test(s.trim())) return null
  try {
    return BigInt(s.trim())
  } catch {
    return null
  }
}

const fieldStyle = (bad) => ({
  width: 90,
  padding: '6px 8px',
  borderRadius: 6,
  border: `1px solid ${bad ? RED : LINE}`,
  fontSize: 15,
  fontVariantNumeric: 'tabular-nums',
  color: INK,
})

function derive({ p, q, e, m }) {
  const P = parse(p)
  const Q = parse(q)
  const E = parse(e)
  const M = parse(m)
  if (P === null || Q === null || E === null || M === null) {
    return { error: 'Enter whole numbers in every box.' }
  }
  if (!isPrime(P)) return { error: `p = ${P} is not prime — pick a prime.`, badP: true }
  if (!isPrime(Q)) return { error: `q = ${Q} is not prime — pick a prime.`, badQ: true }
  if (P === Q) return { error: 'p and q must be two different primes.', badP: true, badQ: true }
  const n = P * Q
  const phi = (P - 1n) * (Q - 1n)
  if (E <= 1n || E >= phi) {
    return { error: `e must satisfy 1 < e < ${phi} (= φ).`, badE: true }
  }
  if (gcd(E, phi) !== 1n) {
    return { error: `e = ${E} shares a factor with φ = ${phi}; pick an e coprime to φ.`, badE: true }
  }
  const d = modInverse(E, phi)
  if (M >= n) {
    return { error: `message M must be smaller than n = ${n}.`, badM: true, n, phi, d }
  }
  const c = modPow(M, E, n)
  const back = modPow(c, d, n)
  return { n, phi, d, c, back, M, ok: back === M }
}

const Stat = ({ label, value, color, bg }) => (
  <div style={{ background: bg || '#f7f7f6', borderRadius: 8, padding: '8px 12px', minWidth: 92 }}>
    <div style={{ fontSize: 12, color: MUTED }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: color || INK, fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all' }}>
      {value}
    </div>
  </div>
)

export default function RsaKeyDerivation() {
  const [vals, setVals] = useState(DEFAULTS)
  const r = useMemo(() => derive(vals), [vals])
  const set = (k) => (ev) => setVals((v) => ({ ...v, [k]: ev.target.value }))
  const atDefault = vals.p === DEFAULTS.p && vals.q === DEFAULTS.q && vals.e === DEFAULTS.e && vals.m === DEFAULTS.m

  const Field = ({ k, label, hint, bad }) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
      <input inputMode="numeric" value={vals[k]} onChange={set(k)} style={fieldStyle(bad)} />
      <span style={{ fontSize: 11, color: MUTED }}>{hint}</span>
    </label>
  )

  return (
    <div style={{ fontSize: 14, color: INK }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
        <Field k="p" label="prime p" hint="a prime" bad={r.badP} />
        <Field k="q" label="prime q" hint="another prime" bad={r.badQ} />
        <Field k="e" label="public exponent e" hint="coprime to φ" bad={r.badE} />
        <Field k="m" label="message M" hint="number < n" bad={r.badM} />
        <button
          onClick={() => setVals(DEFAULTS)}
          disabled={atDefault}
          style={{
            alignSelf: 'flex-end',
            padding: '6px 12px',
            borderRadius: 6,
            border: `1px solid ${LINE}`,
            background: atDefault ? '#f3f4f6' : '#fff',
            color: atDefault ? MUTED : INK,
            cursor: atDefault ? 'default' : 'pointer',
            fontSize: 13,
          }}
        >
          Reset
        </button>
      </div>

      {r.error ? (
        <div style={{ background: '#fdecea', border: `1px solid ${RED}`, color: RED, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
          {r.error}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <Stat label="modulus n = p·q" value={String(r.n)} />
            <Stat label="totient φ = (p−1)(q−1)" value={String(r.phi)} />
            <Stat label="public key (e, n)" value={`(${vals.e}, ${r.n})`} color={BLUE} bg={BLUE_BG} />
            <Stat label="private key d" value={String(r.d)} color={GREEN} bg={GREEN_BG} />
          </div>

          <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>round trip</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontVariantNumeric: 'tabular-nums' }}>
            <Stat label="message M" value={String(r.M)} />
            <span style={{ color: BLUE, fontSize: 13 }}>
              —Mᵉ mod n→
            </span>
            <Stat label="ciphertext C" value={String(r.c)} color={BLUE} bg={BLUE_BG} />
            <span style={{ color: GREEN, fontSize: 13 }}>
              —Cᵈ mod n→
            </span>
            <Stat label="decrypted" value={String(r.back)} color={GREEN} bg={GREEN_BG} />
            <span style={{ fontSize: 18, color: r.ok ? GREEN : RED }}>{r.ok ? '✓ matches' : '✗'}</span>
          </div>
        </>
      )}
    </div>
  )
}
