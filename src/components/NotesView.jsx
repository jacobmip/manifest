import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

export default function NotesView() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: '', body: '', folder: 'Notes' })
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    loadNotes()
  }, [])

  useEffect(() => {
    if (editing && titleRef.current) titleRef.current.focus()
  }, [editing])

  async function loadNotes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, folder, body, created_at')
      .order('created_at', { ascending: false })
    if (!error) setNotes(data || [])
    setLoading(false)
  }

  function openNote(note) {
    setSelected(note)
    setDraft({ title: note.title, body: note.body, folder: note.folder })
    setEditing(false)
  }

  function newNote() {
    setSelected(null)
    setDraft({ title: '', body: '', folder: 'Notes' })
    setEditing(true)
  }

  async function saveNote() {
    if (!draft.title.trim() && !draft.body.trim()) return
    setSaving(true)
    if (selected) {
      const { data, error } = await supabase
        .from('notes')
        .update({ title: draft.title, body: draft.body, folder: draft.folder, updated_at: new Date().toISOString() })
        .eq('id', selected.id)
        .select()
        .single()
      if (!error) {
        setNotes((prev) => prev.map((n) => (n.id === selected.id ? data : n)))
        setSelected(data)
      }
    } else {
      const { data, error } = await supabase
        .from('notes')
        .insert({ title: draft.title, body: draft.body, folder: draft.folder, source: 'manifest' })
        .select()
        .single()
      if (!error) {
        setNotes((prev) => [data, ...prev])
        setSelected(data)
      }
    }
    setEditing(false)
    setSaving(false)
  }

  async function deleteNote(id) {
    if (!window.confirm('Delete this note?')) return
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (!error) {
      setNotes((prev) => prev.filter((n) => n.id !== id))
      if (selected?.id === id) { setSelected(null); setEditing(false) }
    }
  }

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase()
    return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
  })

  if (loading) return <p style={styles.loading}>Loading notes...</p>

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <input
            style={styles.search}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button style={styles.newBtn} onClick={newNote}>+</button>
        </div>
        {filtered.length === 0 && (
          <p style={styles.empty}>
            {notes.length === 0 ? 'No notes yet.' : 'No results.'}
          </p>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            style={{ ...styles.noteItem, background: selected?.id === n.id ? '#f0f0f0' : '#fff' }}
            onClick={() => openNote(n)}
          >
            <p style={styles.noteTitle}>{n.title || 'Untitled'}</p>
            <span style={styles.folderChip}>{n.folder}</span>
          </div>
        ))}
      </div>

      <div style={styles.detail}>
        {editing ? (
          <div style={styles.editor}>
            <div style={styles.editorToolbar}>
              <input
                style={styles.folderInput}
                placeholder="Folder"
                value={draft.folder}
                onChange={(e) => setDraft((d) => ({ ...d, folder: e.target.value }))}
              />
              <div style={styles.editorActions}>
                {selected && (
                  <button style={styles.deleteDetailBtn} onClick={() => deleteNote(selected.id)}>Delete</button>
                )}
                <button style={styles.cancelBtn} onClick={() => { setEditing(false); if (!selected) setDraft({ title: '', body: '', folder: 'Notes' }) }}>Cancel</button>
                <button style={styles.saveBtn} onClick={saveNote} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <input
              ref={titleRef}
              style={styles.titleInput}
              placeholder="Title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <textarea
              style={styles.bodyInput}
              placeholder="Write your note..."
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
            />
          </div>
        ) : selected ? (
          <>
            <div style={styles.detailToolbar}>
              <span style={styles.folderChip}>{selected.folder}</span>
              <div style={styles.editorActions}>
                <button style={styles.deleteDetailBtn} onClick={() => deleteNote(selected.id)}>Delete</button>
                <button style={styles.editBtn} onClick={() => setEditing(true)}>Edit</button>
              </div>
            </div>
            <h2 style={styles.detailTitle}>{selected.title || 'Untitled'}</h2>
            <pre style={styles.body}>{selected.body}</pre>
          </>
        ) : (
          <div style={styles.placeholder}>
            <p>Select a note or</p>
            <button style={styles.newBtnLarge} onClick={newNote}>+ New Note</button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', gap: 0, height: 'calc(100vh - 52px)' },
  sidebar: {
    width: 260,
    minWidth: 200,
    borderRight: '1px solid #e5e5e5',
    overflowY: 'auto',
    padding: '0.75rem',
    flexShrink: 0,
  },
  sidebarHeader: { display: 'flex', gap: 6, marginBottom: '0.75rem', alignItems: 'center' },
  search: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: '0.9rem',
    boxSizing: 'border-box',
  },
  newBtn: {
    padding: '0.4rem 0.7rem',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '1.1rem',
    lineHeight: 1,
    flexShrink: 0,
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
  detailToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  detailTitle: { fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' },
  body: { marginTop: '1rem', fontSize: '0.95rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 },
  placeholder: { color: '#aaa', marginTop: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  editor: { display: 'flex', flexDirection: 'column', height: '100%' },
  editorToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  editorActions: { display: 'flex', gap: 8 },
  folderInput: {
    padding: '0.3rem 0.6rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: '0.85rem',
    width: 120,
  },
  titleInput: {
    fontSize: '1.4rem',
    fontWeight: 700,
    border: 'none',
    borderBottom: '1px solid #e5e5e5',
    padding: '0.25rem 0',
    marginBottom: '1rem',
    outline: 'none',
    width: '100%',
  },
  bodyInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    resize: 'none',
    width: '100%',
    minHeight: 400,
  },
  saveBtn: {
    padding: '0.4rem 1rem',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '0.9rem',
  },
  cancelBtn: {
    padding: '0.4rem 1rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#fff',
    fontSize: '0.9rem',
  },
  editBtn: {
    padding: '0.4rem 1rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#fff',
    fontSize: '0.9rem',
  },
  deleteDetailBtn: {
    padding: '0.4rem 1rem',
    border: '1px solid #fca5a5',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#fff',
    color: '#dc2626',
    fontSize: '0.9rem',
  },
  newBtnLarge: {
    padding: '0.5rem 1.25rem',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '0.95rem',
  },
  loading: { padding: '2rem', color: '#888' },
  empty: { color: '#aaa', fontSize: '0.9rem', padding: '0.5rem 0' },
}
