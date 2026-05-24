import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export default function NotesView() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    loadNotes()
  }, [])

  async function loadNotes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, folder, body, created_at')
      .order('created_at', { ascending: false })
    if (!error) setNotes(data || [])
    setLoading(false)
  }

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase()
    return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
  })

  if (loading) return <p style={styles.loading}>Loading notes...</p>

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <input
          style={styles.search}
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filtered.length === 0 && (
          <p style={styles.empty}>
            {notes.length === 0 ? 'No notes yet. Use Import to load them.' : 'No results.'}
          </p>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            style={{ ...styles.noteItem, background: selected?.id === n.id ? '#f0f0f0' : '#fff' }}
            onClick={() => setSelected(n)}
          >
            <p style={styles.noteTitle}>{n.title || 'Untitled'}</p>
            <span style={styles.folderChip}>{n.folder}</span>
          </div>
        ))}
      </div>

      <div style={styles.detail}>
        {selected ? (
          <>
            <h2 style={styles.detailTitle}>{selected.title || 'Untitled'}</h2>
            <span style={styles.folderChip}>{selected.folder}</span>
            <pre style={styles.body}>{selected.body}</pre>
          </>
        ) : (
          <p style={styles.placeholder}>Select a note to read it.</p>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', gap: 0, height: 'calc(100vh - 80px)' },
  sidebar: {
    width: 280,
    minWidth: 200,
    borderRight: '1px solid #e5e5e5',
    overflowY: 'auto',
    padding: '0.75rem',
    flexShrink: 0,
  },
  search: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: '0.9rem',
    marginBottom: '0.75rem',
    boxSizing: 'border-box',
  },
  noteItem: {
    padding: '0.6rem 0.75rem',
    borderRadius: 6,
    cursor: 'pointer',
    marginBottom: 2,
  },
  noteTitle: { margin: 0, fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  folderChip: {
    display: 'inline-block',
    fontSize: '0.72rem',
    background: '#e8e8e8',
    borderRadius: 4,
    padding: '1px 6px',
    color: '#555',
    marginTop: 2,
  },
  detail: { flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' },
  detailTitle: { fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' },
  body: { marginTop: '1rem', fontSize: '0.95rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 },
  placeholder: { color: '#aaa', marginTop: '3rem', textAlign: 'center' },
  loading: { padding: '2rem', color: '#888' },
  empty: { color: '#aaa', fontSize: '0.9rem', padding: '0.5rem 0' },
}
