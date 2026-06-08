import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const C = {
  bg: '#fdf8f6', card: '#ffffff', pink: '#c96b8a',
  pinkSoft: '#fbedf2', text: '#2d2340', muted: '#9b8fa8',
  border: '#f0e8ee', red: '#e05c5c', green: '#5caa8a',
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleReset() {
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas')
    if (password.length < 6) return setError('Minimum 6 caractères')
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError('Erreur, réessayez')
    else setSuccess('Mot de passe modifié ! Vous pouvez vous connecter.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Nouveau mot de passe</h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        <div style={{ background: C.card, borderRadius: 20, padding: 28, boxShadow: '0 4px 24px #e8d6e033', border: `1px solid ${C.border}` }}>
          {[
            { label: 'NOUVEAU MOT DE PASSE', val: password, set: setPassword },
            { label: 'CONFIRMER LE MOT DE PASSE', val: confirm, set: setConfirm },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type="password" placeholder="••••••••" value={f.val}
                onChange={e => f.set(e.target.value)}
                style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}

          {error && <div style={{ background: '#fdeaea', color: C.red, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
          {success && <div style={{ background: '#e6f7f1', color: C.green, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>✅ {success}</div>}

          <button onClick={handleReset} disabled={loading} style={{
            width: '100%', background: C.pink, color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            {loading ? 'Modification...' : '🔐 Modifier le mot de passe'}
          </button>
        </div>
      </div>
    </div>
  )
}