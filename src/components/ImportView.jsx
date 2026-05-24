import { useState, useRef } from 'react'
import { parseNotesZip } from '../lib/parseNotes.js'
import { parseRemindersIcs } from '../lib/parseReminders.js'
import { supabase } from '../lib/supabase.js'

const BATCH_SIZE = 100

export default function ImportView({ onImportComplete }) {
  const [notesFile, setNotesFile] = useState(null)
  const [remindersFile, setRemindersFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | parsing | importing | done | error
  const [error, setError] = useState('')
  const notesRef = useRef()
  const remindersRef = useRef()

  async function handleFileChange(type, file) {
    if (!file) return
    if (type === 'notes') setNotesFile(file)
    else setRemindersFile(file)
  }

  async function handlePreview() {
    setStatus('parsing')
    setError('')
    try {
      let notes = []
      let tasks = []
      if (notesFile) notes = await parseNotesZip(notesFile)
      if (remindersFile) {
        const text = await remindersFile.text()
        tasks = parseRemindersIcs(text)
      }
      setPreview({ notes, tasks })
      setStatus('idle')
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  async function handleImport() {
    if (!preview) return
    setStatus('importing')
    setError('')
    try {
      const { notes, tasks } = preview

      for (let i = 0; i < notes.length; i += BATCH_SIZE) {
        const { error } = await supabase.from('notes').insert(notes.slice(i, i + BATCH_SIZE))
        if (error) throw error
      }

      for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        const { error } = await supabase.from('tasks').insert(tasks.slice(i, i + BATCH_SIZE))
        if (error) throw error
      }

      setStatus('done')
      onImportComplete()
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  const busy = status === 'parsing' || status === 'importing'

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Import from Apple</h2>
      <p style={styles.sub}>Drop your exports below, preview, then import everything.</p>

      <div style={styles.dropRow}>
        <DropZone
          label="Apple Notes"
          hint="Export from Notes app → File → Export Notes → zip the folder"
          accept=".zip"
          file={notesFile}
          inputRef={notesRef}
          onChange={(f) => handleFileChange('notes', f)}
          disabled={busy}
        />
        <DropZone
          label="Apple Reminders"
          hint="Export from Reminders app → File → Export → .ics file"
          accept=".ics"
          file={remindersFile}
          inputRef={remindersRef}
          onChange={(f) => handleFileChange('reminders', f)}
          disabled={busy}
        />
      </div>

      {(notesFile || remindersFile) && !preview && (
        <button style={styles.btn} onClick={handlePreview} disabled={busy}>
          {status === 'parsing' ? 'Parsing...' : 'Preview Import'}
        </button>
      )}

      {preview && status !== 'done' && (
        <div style={styles.preview}>
          <p style={styles.previewText}>
            Found <strong>{preview.notes.length}</strong> notes and{' '}
            <strong>{preview.tasks.length}</strong> tasks.
          </p>
          <button style={styles.btnPrimary} onClick={handleImport} disabled={busy}>
            {status === 'importing' ? 'Importing...' : 'Import Everything'}
          </button>
        </div>
      )}

      {status === 'done' && (
        <p style={styles.success}>
          Done. {preview.notes.length} notes and {preview.tasks.length} tasks imported.
        </p>
      )}

      {error && <p style={styles.errorText}>Error: {error}</p>}
    </div>
  )
}

function DropZone({ label, hint, accept, file, inputRef, onChange, disabled }) {
  function onDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) onChange(f)
  }

  return (
    <div
      style={{ ...styles.dropZone, opacity: disabled ? 0.6 : 1 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files[0])}
      />
      <p style={styles.dropLabel}>{label}</p>
      {file ? (
        <p style={styles.fileName}>{file.name}</p>
      ) : (
        <p style={styles.dropHint}>{hint}</p>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' },
  heading: { fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 },
  sub: { color: '#666', marginBottom: '2rem' },
  dropRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  dropZone: {
    flex: 1,
    minWidth: 240,
    border: '2px dashed #ccc',
    borderRadius: 8,
    padding: '1.5rem 1rem',
    cursor: 'pointer',
    textAlign: 'center',
    background: '#fafafa',
  },
  dropLabel: { fontWeight: 600, marginBottom: 8 },
  dropHint: { fontSize: '0.82rem', color: '#888', margin: 0 },
  fileName: { fontSize: '0.9rem', color: '#333', margin: 0, wordBreak: 'break-all' },
  btn: {
    padding: '0.6rem 1.4rem',
    border: '1px solid #ccc',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.95rem',
    background: '#fff',
  },
  btnPrimary: {
    padding: '0.7rem 1.6rem',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '1rem',
    background: '#1a1a1a',
    color: '#fff',
    fontWeight: 600,
  },
  preview: { marginTop: '1rem' },
  previewText: { marginBottom: '1rem', fontSize: '1rem' },
  success: { color: '#2e7d32', fontWeight: 600, marginTop: '1rem' },
  errorText: { color: '#c62828', marginTop: '1rem' },
}
