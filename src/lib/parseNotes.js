import JSZip from 'jszip'

export async function parseNotesZip(file) {
  const zip = await JSZip.loadAsync(file)
  const notes = []

  const htmlFiles = Object.entries(zip.files).filter(
    ([path, entry]) => !entry.dir && path.endsWith('.html')
  )

  for (const [path, entry] of htmlFiles) {
    const html = await entry.async('string')

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : pathToTitle(path)

    const body = stripHtml(html)

    // Folder = first path segment if nested, else 'Notes'
    const parts = path.split('/')
    const folder = parts.length > 1 ? parts[0] : 'Notes'

    if (title || body) {
      notes.push({ title: title || 'Untitled', body, folder })
    }
  }

  return notes
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
}

function pathToTitle(path) {
  const filename = path.split('/').pop() || ''
  return filename.replace(/\.html$/i, '').replace(/[-_]/g, ' ')
}
