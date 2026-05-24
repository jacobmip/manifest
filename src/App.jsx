import { useState } from 'react'
import NotesView from './components/NotesView.jsx'
import TasksView from './components/TasksView.jsx'
import ImportView from './components/ImportView.jsx'

const TABS = ['Notes', 'Tasks', 'Import']

export default function App() {
  const [tab, setTab] = useState('Notes')
  const [importKey, setImportKey] = useState(0)

  function handleImportComplete() {
    setTab('Notes')
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <span style={styles.logo}>Manifest</span>
        <nav style={styles.nav}>
          {TABS.map((t) => (
            <button
              key={t}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main style={styles.main}>
        {tab === 'Notes' && <NotesView />}
        {tab === 'Tasks' && <TasksView />}
        {tab === 'Import' && <ImportView key={importKey} onImportComplete={handleImportComplete} />}
      </main>
    </div>
  )
}

const styles = {
  app: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', minHeight: '100vh', background: '#fff' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    padding: '0 1.5rem',
    height: 52,
    borderBottom: '1px solid #e5e5e5',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 10,
  },
  logo: { fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' },
  nav: { display: 'flex', gap: 4 },
  tab: {
    padding: '0.3rem 0.9rem',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.9rem',
    background: 'transparent',
    color: '#555',
  },
  tabActive: { background: '#f0f0f0', color: '#1a1a1a', fontWeight: 600 },
  main: { flex: 1 },
}
