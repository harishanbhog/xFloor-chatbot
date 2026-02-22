const { useEffect, useMemo, useState } = React

function Badge({ children }) {
  return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{children}</span>
}

function NavTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-emerald-100 text-brand' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  )
}

function VisitCard({ item, active, onClick }) {
  const date = new Date(item.createdAt)
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card ${
        active ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 rounded-xl border border-indigo-200 bg-indigo-50 text-center shadow-sm">
          <div className="rounded-t-xl bg-indigo-600 py-1 text-xs font-bold text-white">{month}</div>
          <div className="py-1 text-2xl font-extrabold text-indigo-900">{date.getDate()}</div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500">Office Visit</p>
          <h3 className="text-xl font-bold text-slate-900">{item.title || 'Doctor Note'}</h3>
          <p className="text-sm text-slate-600">{item.description || 'No transcript content available.'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-indigo-500">Contact</p>
          <p className={`text-xs font-semibold ${item.status === 'indexed' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {item.status || 'queued'}
          </p>
        </div>
      </div>
    </button>
  )
}

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`rounded-2xl px-4 py-3 text-base ${isUser ? 'bg-brand text-white ml-10' : 'bg-emerald-50 text-slate-800 mr-10 border border-emerald-100'}`}>
      {text}
    </div>
  )
}

function App() {
  const [activeNav, setActiveNav] = useState('Profile')
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [messages, setMessages] = useState([
    { role: 'user', text: 'What does my diagnosis mean in simple terms?' },
    { role: 'assistant', text: 'Ask a question to begin. I can summarize recent visit notes for you.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedEvent = useMemo(() => events.find((e) => e.id === selectedEventId) || null, [events, selectedEventId])

  const refresh = async () => {
    const res = await fetch('/api/recent?limit=10')
    const data = await res.json()
    setEvents(data.items || [])
    if (!selectedEventId && data.items?.length) setSelectedEventId(data.items[0].id)
  }

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 5000)
    return () => clearInterval(timer)
  }, [])

  const createQuickVisit = async () => {
    setBusy(true)
    try {
      await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floor_id: 'default-floor',
          block_id: 'visits',
          block_type: 'post',
          user_id: 'alex-johnson',
          title: `Visit update ${new Date().toLocaleTimeString()}`,
          description: 'Patient reports improved energy levels, mild headache, follow-up recommended in one week.'
        })
      })
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const sendChat = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const question = chatInput.trim()
    setMessages((m) => [...m, { role: 'user', text: question }])
    setChatInput('')
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'alex-johnson', app_id: 'postvisit-style', prompt: question })
    })
    const data = await res.json()
    setMessages((m) => [...m, { role: 'assistant', text: data.answer || 'No response' }])
  }

  return (
    <div>
      <header className="border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl text-mint">✓</div>
            <h1 className="text-4xl font-semibold tracking-tight">postvisit<span className="text-mint">.ai</span></h1>
            <Badge>Patient Panel</Badge>
          </div>
          <nav className="hidden gap-2 md:flex">
            {['Profile', 'My Health', 'Reference', 'Record Visit'].map((tab) => (
              <NavTab key={tab} label={tab} active={tab === activeNav} onClick={() => setActiveNav(tab)} />
            ))}
          </nav>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium">Alex Johnson ▾</div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[2.4fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-card transition hover:shadow-lg">
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
              <div className="flex-1">
                <h2 className="text-5xl font-extrabold leading-tight text-slate-900">Alex Johnson</h2>
                <p className="mt-1 text-2xl text-slate-600">Male, 40 y.o.</p>
                <p className="text-2xl text-slate-500">alex.johnson.pvcs@demo.postvisit.ai</p>
              </div>
              <button
                onClick={createQuickVisit}
                className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                disabled={busy}
              >
                {busy ? 'Saving...' : 'Add Visit Note'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-4xl font-bold">Visit History</h3>
            <button onClick={refresh} className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200">↻ Refresh</button>
          </div>

          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">No visits yet. Click <strong>Add Visit Note</strong>.</div>
            ) : (
              events.map((item) => (
                <VisitCard key={item.id} item={item} active={item.id === selectedEvent?.id} onClick={() => setSelectedEventId(item.id)} />
              ))
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">PostVisit AI</p>
                <p className="text-lg text-slate-500">Ask anything about your visit</p>
              </div>
              <div className="h-11 w-11 rounded-full bg-emerald-100 text-center text-2xl leading-[44px] text-emerald-600">✓</div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {selectedEvent && (
              <button
                onClick={() => setChatInput(`Summarize this visit: ${selectedEvent.description}`)}
                className="w-full rounded-full bg-brand px-4 py-3 text-left text-xl font-semibold text-white transition hover:bg-emerald-700"
              >
                Summarize selected visit in simple terms
              </button>
            )}
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              {messages.slice(-6).map((m, i) => (
                <ChatBubble key={`${m.role}-${i}`} role={m.role} text={m.text} />
              ))}
            </div>
            <form onSubmit={sendChat} className="flex items-center gap-2">
              <button type="button" className="h-12 w-12 rounded-full bg-slate-100 text-3xl text-slate-500 transition hover:bg-slate-200">+</button>
              <input
                className="h-12 flex-1 rounded-full border border-slate-300 px-4 text-lg focus:border-emerald-400 focus:outline-none"
                placeholder="Ask about your visit..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button className="rounded-full bg-mint px-5 py-3 text-xl font-semibold text-white transition hover:bg-brand">Send</button>
            </form>
          </div>
        </aside>
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
