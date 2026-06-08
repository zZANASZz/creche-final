import { useState } from 'react'
import { supabase } from '../supabase'

const C = {
  bg: '#fdf8f6', card: '#ffffff', pink: '#c96b8a', pinkLight: '#f2d6df',
  pinkSoft: '#fbedf2', text: '#2d2340', muted: '#9b8fa8', border: '#f0e8ee',
  red: '#e05c5c', green: '#5caa8a',
}

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Email ou mot de passe incorrect')
    } else if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError('Erreur lors de la création du compte')
      else setSuccess('Compte créé ! Connectez-vous maintenant.')
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      })
      if (error) setError('Erreur, vérifiez votre email')
      else setSuccess('Email envoyé ! Vérifiez votre boîte mail.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.pinkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 16px' }}>👶</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>Bienvenue à</h1>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.pink, margin: '2px 0 8px' }}>Ma Crèche</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Gestion simple et bienveillante</p>
        </div>

        <div style={{ background: C.card, borderRadius: 20, padding: 28, boxShadow: '0 4px 24px #e8d6e033', border: `1px solid ${C.border}` }}>

          {mode !== 'forgot' && (
            <div style={{ display: 'flex', background: C.pinkSoft, borderRadius: 30, padding: 4, marginBottom: 24, gap: 4 }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                  flex: 1, border: 'none', cursor: 'pointer', borderRadius: 24, padding: '10px',
                  fontSize: 14, fontWeight: 700,
                  background: mode === m ? C.pink : 'transparent',
                  color: mode === m ? '#fff' : C.muted, transition: 'all .2s',
                }}>
                  {m === 'login' ? '🔑 Connexion' : '✨ Créer un compte'}
                </button>
              ))}
            </div>
          )}

          {mode === 'forgot' && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                style={{ border: 'none', background: 'none', color: C.pink, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                ← Retour à la connexion
              </button>
              <h3 style={{ margin: '10px 0 4px', color: C.text, fontSize: 18, fontWeight: 800 }}>Mot de passe oublié</h3>
              <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Entrez votre email pour recevoir un lien de réinitialisation</p>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input type="email" placeholder="votre@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {mode !== 'forgot' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>MOT DE PASSE</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -8 }}>
              <button onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                style={{ border: 'none', background: 'none', color: C.pink, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {error && <div style={{ background: '#fdeaea', color: C.red, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
          {success && <div style={{ background: '#e6f7f1', color: C.green, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>✅ {success}</div>}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', background: C.pink, color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Chargement...' :
              mode === 'login' ? '🔑 Se connecter' :
              mode === 'register' ? '✨ Créer mon compte' :
              '📧 Envoyer le lien'}
          </button>
        </div>
      </div>
    </div>
  )
}