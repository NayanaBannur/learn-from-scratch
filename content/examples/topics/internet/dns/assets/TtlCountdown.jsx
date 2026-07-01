import React, { useEffect, useRef, useState } from 'react'

// Interactive TTL demo: look up a record to cache it with a chosen TTL, then
// watch it count down and expire. While it's cached, a repeat lookup is a cache
// hit (instant, no walk); once it expires the resolver must walk the tree again
// and re-cache. Shows the speed-vs-freshness trade-off a TTL controls.

const BLUE = '#2563eb'
const GREEN = '#2f6f4f'
const AMBER = '#b45309'
const MUTED = '#6b7280'
const LINE = '#e2e5ea'
const INK = '#1f2328'

const PRESETS = [
  { label: '30s', ttl: 30 },
  { label: '5 min', ttl: 300 },
  { label: '1 hour', ttl: 3600 },
]

function fmt(s) {
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${s}s`
}

export default function TtlCountdown() {
  const [ttl, setTtl] = useState(30)
  const [remaining, setRemaining] = useState(null) // null = nothing cached yet
  const [lastLookup, setLastLookup] = useState(null) // 'walk' | 'hit'
  const timer = useRef(null)

  useEffect(() => () => clearInterval(timer.current), [])

  const tick = () => {
    setRemaining((r) => {
      if (r === null) return r
      if (r <= 1) {
        clearInterval(timer.current)
        timer.current = null
        return 0
      }
      return r - 1
    })
  }

  const lookUp = () => {
    const cached = remaining !== null && remaining > 0
    setLastLookup(cached ? 'hit' : 'walk')
    if (cached) return // cache hit — nothing to do, still counting down
    // cache miss/expired: walk the tree, then cache with the current TTL
    setRemaining(ttl)
    clearInterval(timer.current)
    timer.current = setInterval(tick, 1000)
  }

  const reset = () => {
    clearInterval(timer.current)
    timer.current = null
    setRemaining(null)
    setLastLookup(null)
  }

  const fresh = remaining !== null && remaining > 0
  const expired = remaining === 0
  const pct = fresh ? Math.max(2, (remaining / ttl) * 100) : expired ? 0 : 0

  const chip = (active) => ({
    padding: '5px 12px',
    borderRadius: 7,
    border: `1px solid ${active ? BLUE : LINE}`,
    background: active ? BLUE : '#fff',
    color: active ? '#fff' : INK,
    fontSize: 13,
    cursor: 'pointer',
  })

  return (
    <div style={{ fontSize: 14, color: INK }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: MUTED }}>TTL the zone owner sets</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {PRESETS.map((p) => (
              <button key={p.ttl} style={chip(ttl === p.ttl)} onClick={() => { setTtl(p.ttl); reset() }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={lookUp}
          style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: GREEN, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Look up example.com
        </button>
        <button
          onClick={reset}
          style={{ padding: '7px 12px', borderRadius: 7, border: `1px solid ${LINE}`, background: '#fff', color: MUTED, fontSize: 13, cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>

      {/* cache state */}
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 16px' }}>
        {remaining === null ? (
          <div style={{ color: MUTED }}>Cache empty. Look up the name to fetch and cache its record.</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                <strong style={{ color: fresh ? GREEN : AMBER }}>example.com → 93.184.216.34</strong>
              </span>
              <span style={{ fontSize: 13, color: fresh ? GREEN : AMBER, fontVariantNumeric: 'tabular-nums' }}>
                {fresh ? `expires in ${fmt(remaining)}` : 'expired'}
              </span>
            </div>
            <div style={{ height: 12, background: '#eef0f3', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: fresh ? GREEN : AMBER, transition: 'width 1s linear' }} />
            </div>
          </>
        )}
      </div>

      {/* what the last lookup did */}
      {lastLookup && (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: lastLookup === 'hit' ? GREEN : BLUE }}>
          {lastLookup === 'hit'
            ? '✓ Cache hit — served instantly from cache, no walk needed.'
            : fresh
              ? '↪ Cache miss — walked root → .com → example.com, then cached the answer.'
              : '↪ Cache miss — walked the tree again (the old copy had expired).'}
        </p>
      )}
    </div>
  )
}
