import React, { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TopicView from './components/TopicView.jsx'
import { loadTopics, buildTree } from './lib/content.js'
import { useTags } from './lib/useTags.js'
import { useArchived } from './lib/useArchived.js'

export default function App() {
  const topics = useMemo(() => loadTopics(), [])
  const hasTopics = Object.keys(topics).length > 0
  // Start with nothing selected so the page opens on a welcome landing
  // rather than auto-loading the first topic's slides.
  const [selected, setSelected] = useState(null)
  const { tagsByTopic, setTopicTags } = useTags(topics)
  const { archivedByTopic, setTopicArchived } = useArchived(topics)
  // Rebuild the tree when archived state changes so toggling moves a slide in or
  // out of the Archive branch immediately.
  const tree = useMemo(() => buildTree(topics, archivedByTopic), [topics, archivedByTopic])

  const topic = selected ? topics[selected] : null

  return (
    <div className="app">
      <Sidebar
        tree={tree}
        topics={topics}
        selected={selected}
        onSelect={setSelected}
        tagsByTopic={tagsByTopic}
      />
      {topic ? (
        // key resets the slider level when switching topics
        <TopicView
          key={topic.dir}
          topic={topic}
          tags={tagsByTopic[topic.dir] || []}
          allTags={tagsByTopic}
          onTagsChange={(next) => setTopicTags(topic.dir, next)}
          archived={archivedByTopic[topic.dir] ?? topic.archived}
          onArchivedChange={(next) => setTopicArchived(topic.dir, next)}
        />
      ) : (
        <main className="topic empty">
          {hasTopics ? (
            <>
              <h1>Learn from scratch</h1>
              <p className="muted">Pick a topic from the sidebar to start.</p>
            </>
          ) : (
            <>
              <h1>No topics yet</h1>
              <p className="muted">
                Run the <code>learn-from-scratch</code> skill to generate a topic into the{' '}
                <code>content/</code> folder.
              </p>
            </>
          )}
        </main>
      )}
    </div>
  )
}
