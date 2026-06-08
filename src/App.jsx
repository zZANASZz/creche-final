import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './pages/login'
import Setup from './pages/setup'
import Dashboard from './pages/dashboard'
import ResetPassword from './pages/resetPassword'

export default function App() {
  const [session, setSession] = useState(null)
  const [creche, setCreche] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadCreche(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadCreche(session.user.id)
      else { setCreche(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadCreche(userId) {
    setLoading(true)
    const { data } = await supabase
      .from('creche_membres')
      .select('creche_id, creches(*)')
      .eq('user_id', userId)
      .single()
    if (data) setCreche(data.creches)
    else setCreche(null)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fdf8f6' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👶</div>
        <p style={{ color: '#c96b8a', fontWeight: 600 }}>Chargement...</p>
      </div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/setup" element={session && !creche ? <Setup userId={session.user.id} onDone={(c) => setCreche(c)} /> : <Navigate to={session ? "/" : "/login"} />} />
      <Route path="/*" element={
        !session ? <Navigate to="/login" /> :
        !creche ? <Navigate to="/setup" /> :
        <Dashboard creche={creche} setCreche={setCreche} userId={session.user.id} />
      } />
    </Routes>
  )
}