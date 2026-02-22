const { useEffect, useMemo, useRef, useState } = React

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
          <p className="text-sm text-slate-600 line-clamp-2">{item.description || 'No transcript content available.'}</p>
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
    <div className={`rounded-2xl px-4 py-3 text-base ${isUser ? 'ml-10 bg-brand text-white' : 'mr-10 border border-emerald-100 bg-emerald-50 text-slate-800'}`}>
      {text}
    </div>
  )
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-emerald-100 bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 text-lg hover:bg-slate-200">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function formatSecs(total) {
  const m = Math.floor(total / 60).toString().padStart(2, '0')
  const s = Math.floor(total % 60).toString().padStart(2, '0')
  return `${m}:${s}`
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

  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteTitle, setNoteTitle] = useState('Visit note')
  const [attachments, setAttachments] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [recordSecs, setRecordSecs] = useState(0)
  const [recordErr, setRecordErr] = useState('')
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

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

  const submitEvent = async ({ title, description, extra = {} }) => {
    setSubmitting(true)
    try {
      await fetch('/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floor_id: 'default-floor',
          block_id: 'visits',
          block_type: 'post',
          user_id: 'alex-johnson',
          title,
          description,
          ...extra
        })
      })
      await refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const submitNoteModal = async (e) => {
    e.preventDefault()
    const names = attachments.map((f) => f.name)
    const desc = [noteText.trim(), names.length ? `Attachments: ${names.join(', ')}` : ''].filter(Boolean).join('\n')
    if (!desc) return
    await submitEvent({ title: noteTitle || 'Visit note', description: desc, extra: { attachment_names: names } })
    setNoteText('')
    setAttachments([])
    setShowNoteModal(false)
  }

  const openRecordModal = () => {
    setShowRecordModal(true)
    setRecordErr('')
    setRecorded(false)
    setRecordSecs(0)
  }

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setRecordErr('Audio recording is not supported in this browser/environment.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setRecorded(false)
      intervalRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000)
      recorder.onstop = () => {
        setRecording(false)
        setRecorded(true)
      }
    } catch {
      setRecordErr('Microphone permission denied or unavailable.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const submitRecording = async () => {
    await submitEvent({
      title: `Voice note ${new Date().toLocaleTimeString()}`,
      description: `Recorded voice note captured for ${formatSecs(recordSecs)}.`,
      extra: { recording_duration_secs: recordSecs, mime_type: 'audio/webm' }
    })
    setShowRecordModal(false)
    setRecordSecs(0)
    setRecorded(false)
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
      body: JSON.stringify({ user_id: 'alex-johnson', app_id: 'docvisit-style', prompt: question })
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
            <h1 className="text-4xl font-semibold tracking-tight">docvisit<span className="text-mint">.ai</span></h1>
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
            <div className="flex flex-wrap items-center gap-5">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
              <div className="flex-1">
                <h2 className="text-5xl font-extrabold leading-tight text-slate-900">Alex Johnson</h2>
                <p className="mt-1 text-2xl text-slate-600">Male, 40 y.o.</p>
                <p className="text-2xl text-slate-500">alex.johnson.pvcs@demo.postvisit.ai</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:scale-105 hover:bg-emerald-600"
                >
                  Add Visit Note
                </button>
                <button
                  onClick={openRecordModal}
                  className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:scale-105 hover:bg-indigo-600"
                >
                  Record Visit
                </button>
              </div>
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
                <p className="text-3xl font-bold">DocVisit AI</p>
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

      {showNoteModal && (
        <ModalShell title="Capture anything you want to add" subtitle="Write a brief note, add files, and submit to memory." onClose={() => setShowNoteModal(false)}>
          <form onSubmit={submitNoteModal} className="space-y-4">
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg focus:border-emerald-400 focus:outline-none"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Title"
            />
            <textarea
              className="min-h-44 w-full rounded-2xl border border-emerald-100 bg-lime-100/60 px-5 py-4 text-lg focus:border-emerald-400 focus:outline-none"
              placeholder="Write something you want to remember..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:bg-slate-100">
              <div>
                <p className="font-semibold">Attach image, video, or PDF</p>
                <p className="text-sm text-slate-500">JPG, PNG, MP4, MOV, PDF</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-sm shadow">Select files</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf"
                multiple
                onChange={(e) => setAttachments(Array.from(e.target.files || []))}
              />
            </label>
            {attachments.length > 0 && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{attachments.map((f) => f.name).join(' • ')}</div>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowNoteModal(false)} className="rounded-xl border border-slate-200 px-5 py-2 font-semibold hover:bg-slate-50">Cancel</button>
              <button disabled={submitting} className="rounded-xl bg-lime-500 px-6 py-2 font-semibold text-white transition hover:bg-lime-600 disabled:bg-lime-300">
                {submitting ? 'Submitting...' : 'Remember'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {showRecordModal && (
        <ModalShell title="Record voice note" subtitle="Capture visit audio then submit to memory." onClose={() => setShowRecordModal(false)}>
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-slate-50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-full bg-emerald-100 text-6xl shadow-lg">🎙️</div>
              <p className="text-5xl font-bold tracking-wide text-slate-700">{formatSecs(recordSecs)}</p>
              <p className="mt-2 text-slate-500">{recording ? 'Recording in progress...' : recorded ? 'Recording complete.' : 'Ready to start recording.'}</p>
              {recordErr && <p className="mt-2 font-semibold text-rose-600">{recordErr}</p>}
            </div>

            <div className="flex justify-center gap-3">
              {!recording && !recorded && (
                <button onClick={startRecording} className="rounded-full bg-emerald-400 px-8 py-3 text-xl font-semibold text-white transition hover:bg-emerald-500">Start</button>
              )}
              {recording && (
                <button onClick={stopRecording} className="rounded-full bg-rose-500 px-8 py-3 text-xl font-semibold text-white transition hover:bg-rose-600">Stop</button>
              )}
              {recorded && (
                <button disabled={submitting} onClick={submitRecording} className="rounded-full bg-brand px-8 py-3 text-xl font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-300">
                  {submitting ? 'Submitting...' : 'Submit recording'}
                </button>
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
