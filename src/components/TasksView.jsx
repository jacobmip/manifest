import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

const DEFAULT_LIST = 'Reminders'

export default function TasksView() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [lists, setLists] = useState([DEFAULT_LIST])
  const [newTitle, setNewTitle] = useState('')
  const [newList, setNewList] = useState(DEFAULT_LIST)
  const [newDue, setNewDue] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  async function loadTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
    if (!error) {
      const loaded = data || []
      setTasks(loaded)
      const uniqueLists = [...new Set(loaded.map((t) => t.list_name).filter(Boolean))]
      if (uniqueLists.length > 0) setLists([...new Set([DEFAULT_LIST, ...uniqueLists])])
    }
    setLoading(false)
  }

  async function addTask(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const task = {
      title: newTitle.trim(),
      list_name: newList,
      due_date: newDue || null,
      completed: false,
      source: 'manifest',
    }
    const { data, error } = await supabase.from('tasks').insert(task).select().single()
    if (!error) {
      setTasks((prev) => [data, ...prev])
      if (!lists.includes(newList)) setLists((prev) => [...prev, newList])
    }
    setNewTitle('')
    setNewDue('')
    inputRef.current?.focus()
  }

  async function toggleComplete(task) {
    const completed = !task.completed
    const completed_at = completed ? new Date().toISOString() : null
    const { error } = await supabase
      .from('tasks')
      .update({ completed, completed_at })
      .eq('id', task.id)
    if (!error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed, completed_at } : t))
      )
    }
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const grouped = filtered.reduce((acc, t) => {
    const list = t.list_name || DEFAULT_LIST
    if (!acc[list]) acc[list] = []
    acc[list].push(t)
    return acc
  }, {})

  if (loading) return <p style={styles.loading}>Loading tasks...</p>

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.filterBar}>
          {['active', 'all', 'completed'].map((f) => (
            <button
              key={f}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button style={styles.addBtn} onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {adding && (
        <form onSubmit={addTask} style={styles.form}>
          <input
            ref={inputRef}
            style={styles.formInput}
            placeholder="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div style={styles.formRow}>
            <select
              style={styles.formSelect}
              value={newList}
              onChange={(e) => setNewList(e.target.value)}
            >
              {lists.map((l) => <option key={l}>{l}</option>)}
              <option value="__new__">+ New list...</option>
            </select>
            <input
              type="date"
              style={styles.formDate}
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
            />
            <button type="submit" style={styles.submitBtn}>Add</button>
          </div>
        </form>
      )}

      {Object.keys(grouped).length === 0 && (
        <p style={styles.empty}>
          {tasks.length === 0 ? 'No tasks yet. Add one above or use Import.' : 'Nothing here.'}
        </p>
      )}

      {Object.entries(grouped).map(([listName, listTasks]) => (
        <div key={listName} style={styles.group}>
          <p style={styles.listName}>{listName}</p>
          {listTasks.map((t) => (
            <div key={t.id} style={styles.taskRow}>
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => toggleComplete(t)}
                style={styles.checkbox}
              />
              <div style={styles.taskInfo}>
                <span style={{ ...styles.taskTitle, textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#aaa' : '#1a1a1a' }}>
                  {t.title}
                </span>
                {t.due_date && (
                  <span style={styles.dueDate}>
                    Due {new Date(t.due_date).toLocaleDateString()}
                  </span>
                )}
                {t.notes && <p style={styles.taskNotes}>{t.notes}</p>}
              </div>
              <button style={styles.deleteBtn} onClick={() => deleteTask(t.id)}>✕</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: { maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  filterBar: { display: 'flex', gap: 8 },
  filterBtn: {
    padding: '0.4rem 1rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#fff',
    fontSize: '0.9rem',
  },
  filterBtnActive: { background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' },
  addBtn: {
    padding: '0.4rem 1rem',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '0.9rem',
  },
  form: {
    background: '#f7f7f7',
    borderRadius: 8,
    padding: '1rem',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  formInput: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  formRow: { display: 'flex', gap: 8, alignItems: 'center' },
  formSelect: {
    padding: '0.4rem 0.6rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: '0.9rem',
    flex: 1,
  },
  formDate: {
    padding: '0.4rem 0.6rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: '0.9rem',
  },
  submitBtn: {
    padding: '0.4rem 1rem',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },
  group: { marginBottom: '2rem' },
  listName: { fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '0.5rem' },
  taskRow: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' },
  checkbox: { marginTop: 3, cursor: 'pointer', width: 16, height: 16, flexShrink: 0 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: '0.95rem' },
  dueDate: { marginLeft: 8, fontSize: '0.78rem', color: '#888' },
  taskNotes: { margin: '4px 0 0', fontSize: '0.82rem', color: '#666' },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#ccc',
    fontSize: '0.85rem',
    padding: '0 4px',
    flexShrink: 0,
    lineHeight: 1,
  },
  loading: { padding: '2rem', color: '#888' },
  empty: { color: '#aaa', textAlign: 'center', paddingTop: '3rem' },
}
