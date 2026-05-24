import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export default function TasksView() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active') // all | active | completed

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
    if (!error) setTasks(data || [])
    setLoading(false)
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

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const grouped = filtered.reduce((acc, t) => {
    const list = t.list_name || 'Reminders'
    if (!acc[list]) acc[list] = []
    acc[list].push(t)
    return acc
  }, {})

  if (loading) return <p style={styles.loading}>Loading tasks...</p>

  return (
    <div style={styles.container}>
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

      {Object.keys(grouped).length === 0 && (
        <p style={styles.empty}>
          {tasks.length === 0 ? 'No tasks yet. Use Import to load them.' : 'Nothing here.'}
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
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: { maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem' },
  filterBar: { display: 'flex', gap: 8, marginBottom: '1.5rem' },
  filterBtn: {
    padding: '0.4rem 1rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#fff',
    fontSize: '0.9rem',
  },
  filterBtnActive: { background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' },
  group: { marginBottom: '2rem' },
  listName: { fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '0.5rem' },
  taskRow: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' },
  checkbox: { marginTop: 3, cursor: 'pointer', width: 16, height: 16, flexShrink: 0 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: '0.95rem' },
  dueDate: { marginLeft: 8, fontSize: '0.78rem', color: '#888' },
  taskNotes: { margin: '4px 0 0', fontSize: '0.82rem', color: '#666' },
  loading: { padding: '2rem', color: '#888' },
  empty: { color: '#aaa', textAlign: 'center', paddingTop: '3rem' },
}
