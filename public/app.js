const tabs = [...document.querySelectorAll('.tab')]
const sections = ['compose', 'chat', 'activity']

tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabs.forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    sections.forEach((id) => document.getElementById(id).classList.add('hidden'))
    document.getElementById(btn.dataset.tab).classList.remove('hidden')
  })
})

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

document.getElementById('composeForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const body = Object.fromEntries(new FormData(e.target).entries())
  const status = document.getElementById('composeStatus')
  status.textContent = 'Submitting...'
  try {
    const data = await api('/api/content', { method: 'POST', body: JSON.stringify(body) })
    status.textContent = `Queued ${data.id} (${data.status})`
    e.target.description.value = ''
  } catch (err) {
    status.textContent = err.message
  }
})

const chatBox = document.getElementById('chatBox')
function addMsg(role, text) {
  const div = document.createElement('div')
  div.className = `msg ${role}`
  div.textContent = `${role}: ${text}`
  chatBox.appendChild(div)
}

document.getElementById('chatForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const prompt = document.getElementById('chatPrompt').value.trim()
  if (!prompt) return
  addMsg('user', prompt)
  document.getElementById('chatPrompt').value = ''
  try {
    const data = await api('/api/query', {
      method: 'POST',
      body: JSON.stringify({
        user_id: document.getElementById('chatUser').value,
        app_id: document.getElementById('chatApp').value,
        prompt
      })
    })
    addMsg('assistant', data.answer)
  } catch (err) {
    addMsg('assistant', `Error: ${err.message}`)
  }
})

async function loadFeed() {
  const feed = document.getElementById('feed')
  const data = await api('/api/recent?limit=20')
  feed.innerHTML = ''
  data.items.forEach((item) => {
    const li = document.createElement('li')
    li.innerHTML = `<div><strong>${item.title || '(untitled)'}</strong><p>${item.description}</p><small>${item.status}</small></div><span>${new Date(item.createdAt).toLocaleString()}</span>`
    feed.appendChild(li)
  })
}

document.getElementById('refresh').addEventListener('click', loadFeed)
setInterval(() => {
  if (document.getElementById('auto').checked) loadFeed()
}, 5000)
loadFeed()
