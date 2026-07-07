import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// The app lives at the repo root so it can glob the `content/` topic
// hierarchy with root-relative `import.meta.glob('/content/**')` paths.

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
  plugins: [react(), annotationsApi(), tagsApi(), archivedApi()],
})
