export function parseRemindersIcs(text) {
  const tasks = []
  const vtodoBlocks = text.match(/BEGIN:VTODO[\s\S]*?END:VTODO/g) || []

  for (const block of vtodoBlocks) {
    const get = (key) => {
      const match = block.match(new RegExp(`^${key}[^:]*:(.*)$`, 'm'))
      return match ? unfold(match[1].trim()) : ''
    }

    const title = decodeIcsText(get('SUMMARY'))
    if (!title) continue

    const notes = decodeIcsText(get('DESCRIPTION'))
    const status = get('STATUS')
    const completed = status === 'COMPLETED'

    const dueProp = get('DUE')
    const due_date = dueProp ? parseIcsDate(dueProp) : null

    const completedProp = get('COMPLETED')
    const completed_at = completedProp ? parseIcsDate(completedProp) : null

    // Apple stores list name in X-APPLE-CALENDAR-NAME or CATEGORIES
    const list_name =
      get('X-APPLE-CALENDAR-NAME') ||
      get('CATEGORIES') ||
      get('X-WR-CALNAME') ||
      'Reminders'

    tasks.push({ title, notes, due_date, completed, completed_at, list_name })
  }

  return tasks
}

// ICS lines can be folded (continued with a leading space/tab on next line)
function unfold(str) {
  return str.replace(/\r?\n[ \t]/g, '')
}

function decodeIcsText(str) {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function parseIcsDate(str) {
  // Formats: 20240115T120000Z or 20240115
  const clean = str.replace(/[TZ]/g, '').replace(/:/g, '')
  if (clean.length >= 8) {
    const y = clean.slice(0, 4)
    const m = clean.slice(4, 6)
    const d = clean.slice(6, 8)
    const h = clean.slice(8, 10) || '00'
    const min = clean.slice(10, 12) || '00'
    return new Date(`${y}-${m}-${d}T${h}:${min}:00Z`).toISOString()
  }
  return null
}
