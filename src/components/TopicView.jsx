import React, { useEffect, useMemo, useRef, useState } from 'react'
import LevelSlider from './LevelSlider.jsx'
import Section from './Section.jsx'
import AnnotationLayer from './AnnotationLayer.jsx'
import TagEditor from './TagEditor.jsx'
import { useAnnotations } from '../lib/useAnnotations.js'

// The main pane: title, then [vertical slider | content]. Only the current
// step's section is on screen at a time; moving the slider swaps it in.
export default function TopicView({ topic, tags, allTags, onTagsChange, archived, onArchivedChange }) {
  const [level, setLevel] = useState(1)
  const [annotating, setAnnotating] = useState(false) // annotation mode on/off
  const { manifest, sections, levels, sources } = topic

  // Annotation state (persisted to annotations.json beside the content; see
  // useAnnotations) and a ref to the .content box used as the positioning frame.
  const contentRef = useRef(null)
  const annotations = useAnnotations(topic)

  const numberFor = useMemo(() => {
    const map = Object.fromEntries(sources.map((s, i) => [s.id, i + 1]))
    return (id) => map[id]
  }, [sources])

  // The section shown at a given level — the one whose intro `level` matches.
  const ownerOf = useMemo(() => (lvl) => sections.find((s) => s.level === lvl), [sections])

  // References get their own final step on the slider, so the reader can land on
  // them directly instead of scrolling past the content to the footer.
  const hasRefs = sources.length > 0
  const refLevel = levels.length + 1
  const onReferences = hasRefs && level === refLevel
  // Carry each section's "additional reading" flag onto its slider step so the
  // step can mark optional/deeper sections. (References is never additional reading.)
  const sliderLevels = (hasRefs ? [...levels, { caption: 'References' }] : levels).map((lv, i) => {
    const owner = ownerOf(i + 1)
    return owner?.additionalReading ? { ...lv, additionalReading: true } : lv
  })

  // One thing on screen at a time: a single section, or — on the references
  // step — just the references (no content sections).
  const visible = onReferences ? [] : sections.filter((s) => s === ownerOf(level))
  const showRefs = hasRefs && onReferences

  // Citation superscripts link to `#src-<id>`, but that anchor only exists on the
  // References step. Intercept the click, jump to that step, and scroll/flash the
  // cited source there. `pendingSrc` is a fresh object per click so the effect
  // re-runs even when re-clicking the same citation.
  const [pendingSrc, setPendingSrc] = useState(null)

  const handleContentClick = (e) => {
    const a = e.target.closest?.('a')
    if (!a) return
    const m = (a.getAttribute('href') || '').match(/^#src-(.+)$/)
    if (!m || !hasRefs) return
    e.preventDefault()
    setLevel(refLevel)
    setPendingSrc({ id: m[1] })
  }

  useEffect(() => {
    if (!pendingSrc) return
    setPendingSrc(null)
    const el = document.getElementById(`src-${pendingSrc.id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('src-flash')
    window.setTimeout(() => el.classList.remove('src-flash'), 1600)
  }, [pendingSrc])

  return (
    <main className="topic">
      <header className="topic-head">
        <div className="topic-head-row">
          <div className="topic-head-text">
            <h1>{manifest.title}</h1>
          </div>
          <div className="topic-head-controls">
            <TopicInfo
              subtitle={manifest.subtitle}
              created={manifest.dateCreated}
              tags={tags}
              allTags={allTags}
              onTagsChange={onTagsChange}
              archived={archived}
              onArchivedChange={onArchivedChange}
            />
            <AnnotateToggle active={annotating} setActive={setAnnotating} />
          </div>
        </div>
      </header>

      <div className="topic-body">
        <LevelSlider levels={sliderLevels} level={level} setLevel={setLevel} />

        <div
          className={annotating ? 'content is-annotating' : 'content'}
          ref={contentRef}
          onClick={handleContentClick}
        >
          {visible.map((s) => (
            <Section key={s.id} section={s} topic={topic} numberFor={numberFor} />
          ))}

          {showRefs && (
            <footer className="sources" id="references">
              <h2>References</h2>
              <ol>
                {sources.map((s) => (
                  <li key={s.id} id={`src-${s.id}`}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                    {s.publisher && <span className="src-pub"> — {s.publisher}</span>}
                  </li>
                ))}
              </ol>
            </footer>
          )}

          {/* Overlay of annotation bubbles/popovers, positioned within .content.
              Mounted whenever the mode is on or there are saved annotations. */}
          {(annotating || annotations.annotations.length > 0) && (
            <AnnotationLayer
              contentRef={contentRef}
              active={annotating}
              level={level}
              firstSectionId={sections[0] ? `sec-${sections[0].id}` : undefined}
              {...annotations}
            />
          )}
        </div>
      </div>
    </main>
  )
}

// Header "About" popover: the summary line, created date, and tag editor live
// here instead of stacked above the slide, so each step opens fully in view.
// Self-contained — owns its open state and closes on outside-click / Escape.
function TopicInfo({ subtitle, created, tags, allTags, onTagsChange, archived, onArchivedChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="topic-info" ref={wrapRef}>
      <div className="mode-toggle" role="group" aria-label="About this topic">
        <button
          type="button"
          className={open ? 'mode-btn active' : 'mode-btn'}
          aria-pressed={open}
          aria-expanded={open}
          title="About — summary, date, and tags"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" />
            <line x1="8" y1="7" x2="8" y2="11.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="8" cy="4.7" r="0.95" fill="currentColor" />
          </svg>
          <span>About</span>
        </button>
      </div>
      {open && (
        <div className="topic-info-panel">
          {subtitle && <p className="subtitle">{subtitle}</p>}
          <TopicDates created={created} />
          <TagEditor tags={tags} allTags={allTags} onChange={onTagsChange} />
          {onArchivedChange && (
            <div className="archive-toggle" role="group" aria-label="Archive">
              <button
                type="button"
                className="archive-btn"
                aria-pressed={!!archived}
                title={
                  archived
                    ? 'Restore this slide to its normal place in the sidebar'
                    : 'Move this slide under the Archive branch (its folder stays put)'
                }
                onClick={() => onArchivedChange(!archived)}
              >
                {archived ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Created date from the manifest, shown under the subtitle.
// The date is an ISO "YYYY-MM-DD" string; rendered as e.g. "Jun 2, 2026".
function TopicDates({ created }) {
  const [y, m, d] = (created || '').split('-').map(Number)
  if (!y || !m || !d) return null
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return <p className="topic-dates">Created {label}</p>
}

// Standalone toggle (same visual language as the About button) for annotation mode.
function AnnotateToggle({ active, setActive }) {
  return (
    <div className="mode-toggle" role="group" aria-label="Annotations">
      <button
        type="button"
        className={active ? 'mode-btn active' : 'mode-btn'}
        aria-pressed={active}
        title={active ? 'Annotation mode on — click content to comment' : 'Annotate — add comments'}
        onClick={() => setActive((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {/* speech bubble + pencil tip */}
          <path
            d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <span>Annotate</span>
      </button>
    </div>
  )
}
