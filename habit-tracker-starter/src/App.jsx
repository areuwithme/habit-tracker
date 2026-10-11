import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const categories = ['Wellbeing', 'Study', 'Health', 'Personal']

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekDays() {
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long', month: 'long', day: 'numeric',
  }).format(date)
}

function SetupNotice() {
  return (
    <main className="setup-screen">
      <section className="setup-card">
        <span className="brand-mark">d</span>
        <p className="eyebrow">One small step at a time</p>
        <h1>Connect your Supabase project</h1>
        <p>Create a <code>.env.local</code> file beside <code>package.json</code> with your Project URL and publishable key. Then restart the development server.</p>
        <pre>{'VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY'}</pre>
        <p className="muted">Run the SQL in <code>supabase/schema.sql</code> in your Supabase SQL Editor first.</p>
      </section>
    </main>
  )
}

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    const result = mode === 'signup'
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
      : await supabase.auth.signInWithPassword({ email, password })

    setBusy(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    if (mode === 'signup' && !result.data.session) {
      setNotice('Check your email for a confirmation link, then come back here to sign in.')
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <a className="brand" href="#top" aria-label="Daymark home">
          <span className="brand-mark">d</span><span>daymark</span>
        </a>
        <div className="story-copy">
          <p className="eyebrow">Build a rhythm that feels like yours</p>
          <h1>Small steps.<br /><em>Real momentum.</em></h1>
          <p>A gentle place to keep promises to yourself. Choose a habit, show up today, and let the days add up.</p>
          <div className="story-note"><span className="note-dot" /> Your progress is private to your account.</div>
        </div>
        <span className="story-caption">A little better, at your own pace.</span>
      </section>

      <section className="auth-panel">
        <div className="mobile-brand brand"><span className="brand-mark">d</span><span>daymark</span></div>
        <div className="auth-box">
          <p className="eyebrow">Welcome to your next chapter</p>
          <h2>{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>
          <p className="auth-hint">{mode === 'login' ? 'Pick up where you left off.' : 'Start with one habit you want to keep.'}</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {notice && <p className="form-message success-message" role="status">{notice}</p>}
            <button className="button primary-button full-button" type="submit" disabled={busy}>
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!busy && <span aria-hidden="true">↗</span>}
            </button>
          </form>
          <p className="switch-mode">
            {mode === 'login' ? 'New to Daymark?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice('') }}>
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
          <p className="privacy-note"><span>✦</span> Your habits belong to you. Your data stays private.</p>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState(categories[0])
  const [saving, setSaving] = useState(false)
  const [busyHabit, setBusyHabit] = useState('')
  const [actionError, setActionError] = useState('')

  const weekDays = useMemo(() => getWeekDays(), [])
  const today = dateKey(new Date())
  const weekStart = dateKey(weekDays[0])
  const weekEnd = dateKey(weekDays[6])
  const todayLogs = new Set(logs.filter((log) => log.completed_on === today).map((log) => log.habit_id))

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return undefined
    }
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) setActionError(error.message)
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadDashboard = useCallback(async () => {
    if (!user) return
    setLoadingData(true)
    setLoadError('')
    const [habitResult, logResult] = await Promise.all([
      supabase.from('habits').select('id, name, category, created_at').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('id, habit_id, completed_on').eq('user_id', user.id).gte('completed_on', weekStart).lte('completed_on', weekEnd),
    ])
    setLoadingData(false)
    if (habitResult.error || logResult.error) {
      setLoadError(habitResult.error?.message ?? logResult.error?.message ?? 'Could not load your habits.')
      return
    }
    setHabits(habitResult.data ?? [])
    setLogs(logResult.data ?? [])
  }, [user, weekStart, weekEnd])

  useEffect(() => {
    if (user) loadDashboard()
    else { setHabits([]); setLogs([]) }
  }, [user, loadDashboard])

  async function addHabit(event) {
    event.preventDefault()
    const name = newName.trim()
    if (!name || !user) return
    setSaving(true)
    setActionError('')
    const { error } = await supabase.from('habits').insert({
      user_id: user.id,
      name,
      category: newCategory,
    })
    setSaving(false)
    if (error) { setActionError(error.message); return }
    setNewName('')
    await loadDashboard()
  }

  async function toggleToday(habit) {
    if (!user) return
    setBusyHabit(habit.id)
    setActionError('')
    const result = todayLogs.has(habit.id)
      ? await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('completed_on', today).eq('user_id', user.id)
      : await supabase.from('habit_logs').insert({ user_id: user.id, habit_id: habit.id, completed_on: today })
    setBusyHabit('')
    if (result.error) { setActionError(result.error.message); return }
    await loadDashboard()
  }

  async function deleteHabit(habit) {
    if (!user || !window.confirm(`Delete "${habit.name}" and its history?`)) return
    setBusyHabit(habit.id)
    setActionError('')
    const { error } = await supabase.from('habits').delete().eq('id', habit.id).eq('user_id', user.id)
    setBusyHabit('')
    if (error) { setActionError(error.message); return }
    await loadDashboard()
  }

  async function signOut() {
    setActionError('')
    const { error } = await supabase.auth.signOut()
    if (error) setActionError(error.message)
  }

  if (!isSupabaseConfigured) return <SetupNotice />
  if (authLoading) return <main className="loading-screen"><span className="loader" /> Loading your space...</main>
  if (!user) return <AuthScreen />

  const completeCount = todayLogs.size
  const completionPercent = habits.length ? Math.round((completeCount / habits.length) * 100) : 0
  const weeklyCount = logs.length
  const firstName = user.email?.split('@')[0] || 'friend'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top"><span className="brand-mark">d</span><span>daymark</span></a>
        <div className="side-label">YOUR SPACE</div>
        <a className="nav-item active" href="#today"><span className="nav-icon">◷</span> Today's habits</a>
        <a className="nav-item" href="#week"><span className="nav-icon">▦</span> This week</a>
        <div className="sidebar-bottom">
          <div className="quote-card"><span className="quote-spark">✳</span><p>“You do not rise to the level of your goals. You fall to the level of your systems.”</p><small>JAMES CLEAR</small></div>
          <div className="account-row"><span className="avatar">{firstName[0].toUpperCase()}</span><span className="account-email">{user.email}</span><button className="icon-button logout-button" title="Sign out" onClick={signOut}>↗</button></div>
        </div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <span className="breadcrumb">MY SPACE <span>/</span> OVERVIEW</span>
          <div className="topbar-right"><span className="today-pill"><span /> YOUR PRIVATE SPACE</span><button className="mobile-signout" onClick={signOut}>Sign out</button></div>
        </header>

        <section className="welcome-row" id="today">
          <div><p className="eyebrow">{formatDate(new Date())}</p><h1>Good day, {firstName}<span className="wave">.</span></h1><p className="subheading">A little progress is still progress. What will you show up for today?</p></div>
          <div className="progress-ring" style={{ '--progress': `${completionPercent}%` }}><div><strong>{completionPercent}<small>%</small></strong><span>DONE TODAY</span></div></div>
        </section>

        <section className="stats-grid" aria-label="Habit summary">
          <article className="stat-card"><span className="stat-icon green-icon">✓</span><div><span className="stat-label">COMPLETED TODAY</span><strong>{completeCount}<small> / {habits.length}</small></strong></div><span className="stat-foot">habits checked in</span></article>
          <article className="stat-card"><span className="stat-icon purple-icon">✳</span><div><span className="stat-label">ACTIVE HABITS</span><strong>{habits.length}</strong></div><span className="stat-foot">your daily practices</span></article>
          <article className="stat-card"><span className="stat-icon amber-icon">↗</span><div><span className="stat-label">THIS WEEK</span><strong>{weeklyCount}</strong></div><span className="stat-foot">completed check-ins</span></article>
        </section>

        <section className="content-grid">
          <div className="habits-panel panel">
            <div className="section-heading"><div><p className="eyebrow">MAKE TODAY COUNT</p><h2>Your habits <span className="count-badge">{habits.length}</span></h2></div><span className="date-chip">TODAY</span></div>
            <form className="add-habit-form" onSubmit={addHabit}>
              <input aria-label="New habit name" maxLength={80} value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Add a habit to your day..." required />
              <select aria-label="Habit category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
              <button className="button add-button" type="submit" disabled={saving}>{saving ? 'Adding...' : '+ Add habit'}</button>
            </form>
            {actionError && <p className="form-message error-message" role="alert">{actionError}</p>}
            {loadError && <div className="inline-error" role="alert"><strong>Couldn't load your data.</strong><span>{loadError}</span><button className="text-button" onClick={loadDashboard}>Try again</button></div>}
            {loadingData ? <div className="empty-state">Loading your habits...</div> : habits.length === 0 ? (
              <div className="empty-state"><span className="empty-spark">✳</span><strong>Your first habit starts here.</strong><span>Keep it small and make it yours.</span></div>
            ) : (
              <div className="habit-list">
                {habits.map((habit) => {
                  const done = todayLogs.has(habit.id)
                  return <article className={`habit-row ${done ? 'habit-done' : ''}`} key={habit.id}>
                    <button className={`check-button ${done ? 'checked' : ''}`} onClick={() => toggleToday(habit)} disabled={busyHabit === habit.id} aria-label={`${done ? 'Unmark' : 'Mark'} ${habit.name} ${done ? 'incomplete' : 'complete'} for today`}>{done ? '✓' : ''}</button>
                    <div className="habit-info"><strong>{habit.name}</strong><span className={`category-tag ${habit.category.toLowerCase()}`}>{habit.category}</span></div>
                    <span className="habit-status">{done ? 'Done for today' : 'Today'}</span>
                    <button className="icon-button delete-button" title={`Delete ${habit.name}`} onClick={() => deleteHabit(habit)} disabled={busyHabit === habit.id}>×</button>
                  </article>
                })}
              </div>
            )}
            <div className="list-footer"><span><span className="tiny-lock">⌑</span> Your habits are private to your account</span><span>ONE DAY AT A TIME</span></div>
          </div>

          <aside className="week-panel panel" id="week">
            <div className="section-heading"><div><p className="eyebrow">YOUR CONSISTENCY</p><h2>This week</h2></div><span className="week-icon">▦</span></div>
            <p className="week-summary">You've checked in <strong>{weeklyCount} {weeklyCount === 1 ? 'time' : 'times'}</strong> this week. Keep your gentle rhythm going.</p>
            <div className="week-chart" aria-label="Habit check-ins by day this week">
              {weekDays.map((date) => {
                const key = dateKey(date)
                const count = logs.filter((log) => log.completed_on === key).length
                const max = Math.max(habits.length, 1)
                const height = count ? Math.max(14, Math.round((count / max) * 100)) : 5
                return <div className="chart-day" key={key} title={`${count} completed`}><div className="bar-track"><div className={`bar-fill ${key === today ? 'bar-today' : ''}`} style={{ height: `${height}%` }} /></div><span className={key === today ? 'day-today' : ''}>{new Intl.DateTimeFormat('en', { weekday: 'narrow' }).format(date)}</span></div>
              })}
            </div>
            <div className="week-legend"><span><i /> Check-ins</span><span><i className="legend-today" /> Today</span></div>
            <div className="encouragement"><span>✦</span><div><strong>Progress over perfection</strong><p>Every check-in is a vote for the person you're becoming.</p></div></div>
          </aside>
        </section>

        <footer className="page-footer"><span>DAYMARK <span className="footer-dot">·</span> SHOW UP FOR YOURSELF</span><span>MADE FOR THE LONG GAME</span></footer>
      </main>
    </div>
  )
}

export default App
