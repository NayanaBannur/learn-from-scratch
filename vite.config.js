import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// The app lives at the repo root so it can glob the `content/` topic
// hierarchy with root-relative `import.meta.glob('/content/**')` paths.

// Full-reload suppression for content files the app writes itself. The dev
// endpoints below persist tags/archived into manifest.json; without this, each
// such save would trigger a page reload (contentLiveReload watches manifest.json
// so the *agent's* edits show up live). Keyed by absolute path with a short TTL,
// so only the app's own write is muffled — a real edit moments later still reloads.
const reloadSuppress = new Map()
function suppressReload(file) {
  reloadSuppress.set(file, Date.now() + 2500)
}
function isSuppressed(file) {
  const exp = reloadSuppress.get(file)
  if (exp && Date.now() < exp) return true
  if (exp) reloadSuppress.delete(file)
  return false
}

// Force a full page reload whenever a content file changes, is added, or is
// removed — so the app re-reads the topic tree as the learn-from-scratch agent
// writes it (you watch slides fill in live). A full reload (not Fast Refresh) is
// required because the app caches loadTopics() in a useMemo([]), which Fast
// Refresh preserves — so only a fresh page picks up new content.
function contentLiveReload() {
  const shouldReload = (file) => {
    if (!file.includes('/content/')) return false
    // annotations.json is pure in-app UI state (drawing comments); never reload.
    if (file.endsWith('/annotations.json')) return false
    // manifest.json written by our own tags/archived endpoints — already applied
    // optimistically in the UI, so skip the reload that would otherwise follow.
    if (file.endsWith('/manifest.json') && isSuppressed(file)) return false
    return true
  }
  return {
    name: 'content-live-reload',
    // Edited content file (markdown, svg, manifest, component). Returning [] also
    // suppresses Vite's default HMR for these files, so the explicit full-reload
    // is the only update the browser applies.
    handleHotUpdate(ctx) {
      if (!ctx.file.includes('/content/')) return
      if (shouldReload(ctx.file)) ctx.server.ws.send({ type: 'full-reload' })
      return []
    },
    // New/deleted content files (e.g. the agent writing a new topic's sections)
    // aren't in the module graph yet, so they never reach handleHotUpdate.
    configureServer(server) {
      const onFs = (file) => {
        if (shouldReload(file)) server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', onFs)
      server.watcher.on('unlink', onFs)
    },
  }
}

// Dev-only middleware that persists annotations to `annotations.json` inside the
// topic's content folder. The browser can't write files itself, so the app
// POSTs here while developing. (In a production build this endpoint is absent
// and the app falls back to localStorage.)
function annotationsApi() {
  return {
    name: 'annotations-api',
    configureServer(server) {
      const root = server.config.root

      // Resolve a topic dir (e.g. "/content/internet/dns") to its annotations
      // file, guarding against path traversal outside content/.
      function fileFor(topic) {
        if (!topic || !topic.startsWith('/content/')) return null
        const rel = topic.replace(/^\//, '')
        const resolved = path.resolve(root, rel, 'annotations.json')
        const contentRoot = path.resolve(root, 'content')
        if (!resolved.startsWith(contentRoot + path.sep)) return null
        return resolved
      }

      server.middlewares.use('/__annotations', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const file = fileFor(url.searchParams.get('topic'))
        res.setHeader('Content-Type', 'application/json')
        if (!file) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'bad topic' }))
          return
        }

        if (req.method === 'POST' || req.method === 'PUT') {
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '[]')
              if (Array.isArray(data) && data.length === 0) {
                // Empty list — remove the file to keep the content folder tidy.
                await fs.rm(file, { force: true })
              } else {
                await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n')
              }
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(e) }))
            }
          })
          return
        }

        // GET: return the saved annotations (or an empty list).
        try {
          const raw = await fs.readFile(file, 'utf8')
          res.statusCode = 200
          res.end(raw)
        } catch {
          res.statusCode = 200
          res.end('[]')
        }
      })
    },
  }
}

// Dev-only middleware that persists a topic's tags into its manifest.json. Like
// annotations, the browser POSTs here while developing; in a production build the
// endpoint is absent and the app keeps tags in localStorage instead.
function tagsApi() {
  return {
    name: 'tags-api',
    configureServer(server) {
      const root = server.config.root

      function manifestFor(topic) {
        if (!topic || !topic.startsWith('/content/')) return null
        const rel = topic.replace(/^\//, '')
        const resolved = path.resolve(root, rel, 'manifest.json')
        const contentRoot = path.resolve(root, 'content')
        if (!resolved.startsWith(contentRoot + path.sep)) return null
        return resolved
      }

      server.middlewares.use('/__tags', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const file = manifestFor(url.searchParams.get('topic'))
        res.setHeader('Content-Type', 'application/json')
        if (!file) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'bad topic' }))
          return
        }

        if (req.method === 'POST' || req.method === 'PUT') {
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', async () => {
            try {
              const { tags } = JSON.parse(body || '{}')
              const manifest = JSON.parse(await fs.readFile(file, 'utf8'))
              if (Array.isArray(tags) && tags.length > 0) {
                manifest.tags = tags
              } else {
                // Empty — drop the key entirely to keep the manifest tidy.
                delete manifest.tags
              }
              // Our own write — don't let contentLiveReload reload the page for it.
              suppressReload(file)
              await fs.writeFile(file, JSON.stringify(manifest, null, 2) + '\n')
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(e) }))
            }
          })
          return
        }

        // GET: return the manifest's tags (or an empty list).
        try {
          const manifest = JSON.parse(await fs.readFile(file, 'utf8'))
          res.statusCode = 200
          res.end(JSON.stringify({ tags: manifest.tags || [] }))
        } catch {
          res.statusCode = 200
          res.end(JSON.stringify({ tags: [] }))
        }
      })
    },
  }
}

// Dev-only middleware that persists a slide's `archived` flag into its
// manifest.json. Mirrors tagsApi: the browser POSTs here while developing, and
// in a production build the endpoint is absent so the app keeps the flag in
// localStorage instead. The slide's content folder is never moved — archiving
// only changes where it appears in the sidebar (see buildTree).
function archivedApi() {
  return {
    name: 'archived-api',
    configureServer(server) {
      const root = server.config.root

      function manifestFor(topic) {
        if (!topic || !topic.startsWith('/content/')) return null
        const rel = topic.replace(/^\//, '')
        const resolved = path.resolve(root, rel, 'manifest.json')
        const contentRoot = path.resolve(root, 'content')
        if (!resolved.startsWith(contentRoot + path.sep)) return null
        return resolved
      }

      server.middlewares.use('/__archived', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const file = manifestFor(url.searchParams.get('topic'))
        res.setHeader('Content-Type', 'application/json')
        if (!file) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'bad topic' }))
          return
        }

        if (req.method === 'POST' || req.method === 'PUT') {
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', async () => {
            try {
              const { archived } = JSON.parse(body || '{}')
              const manifest = JSON.parse(await fs.readFile(file, 'utf8'))
              if (archived) {
                manifest.archived = true
              } else {
                // Default state — drop the key entirely to keep the manifest tidy.
                delete manifest.archived
              }
              // Our own write — don't let contentLiveReload reload the page for it.
              suppressReload(file)
              await fs.writeFile(file, JSON.stringify(manifest, null, 2) + '\n')
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(e) }))
            }
          })
          return
        }

        // GET: return the manifest's archived flag (defaults to false).
        try {
          const manifest = JSON.parse(await fs.readFile(file, 'utf8'))
          res.statusCode = 200
          res.end(JSON.stringify({ archived: !!manifest.archived }))
        } catch {
          res.statusCode = 200
          res.end(JSON.stringify({ archived: false }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), annotationsApi(), tagsApi(), archivedApi(), contentLiveReload()],
})
