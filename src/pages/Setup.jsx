import { useState } from 'react'
import { supabase } from '../supabase'

const C = {
  bg: '#fdf8f6', card: '#ffffff', pink: '#c96b8a', pinkLight: '#f2d6df',
  pinkSoft: '#fbedf2', text: '#2d2340', muted: '#9b8fa8', border: '#f0e8ee',
  red: '#e05c5c', teal: '#a8d5cc', tealLight: '#e0f4f0',
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CRECHE-'
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function Setup({ userId, onDone }) {
  const [mode, setMode] = useState('create')
  const [nomCreche, setNomCreche] = useState('')
  const [maxPetits, setMaxPetits] = useState(7)
  const [maxGrands, setMaxGrands] = useState(14)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!nomCreche.trim()) return setError('Entrez le nom de votre crèche')
    setError('')
    setLoading(true)
    const newCode = generateCode()
    const { data, error } = await supabase
      .from('creches')
      .insert({ nom: nomCreche, max_petits: maxPetits, max_grands: maxGrands, code: newCode, owner_id: userId })
      .select()
      .single()
    if (error) { setError('Erreur lors de la création'); setLoading(false); return }
    await supabase.from('creche_membres').insert({ creche_id: data.id, user_id: userId })
    onDone(data)
    setLoading(false)
  }

  async function handleJoin() {
    if (!code.trim()) return setError('Entrez le code de la crèche')
    setError('')
    setLoading(true)
    const { data: creche, error } = await supabase
      .from('creches')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single()
    if (error || !creche) { setError('Code invalide, vérifiez et réessayez'); setLoading(false); return }
    const { error: e2 } = await supabase
      .from('creche_membres')
      .insert({ creche_id: creche.id, user_id: userId })
    if (e2) { setError('Vous êtes peut-être déjà membre'); setLoading(false); return }
    onDone(creche)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🏡</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Votre crèche</h2>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>Créez ou rejoignez une crèche</p>
        </div>

        <div style={{ background: C.card, borderRadius: 20, padding: 28, boxShadow: '0 4px 24px #e8d6e033', border: `1px solid ${C.border}` }}>

          {/* Tabs */}
          <div style={{ display: 'flex', background: C.pinkSoft, borderRadius: 30, padding: 4, marginBottom: 24, gap: 4 }}>
            {[
              { key: 'create', label: '🏗️ Créer une crèche' },
              { key: 'join', label: '🔗 Rejoindre' },
            ].map(t => (
              <button key={t.key} onClick={() => { setMode(t.key); setError('') }} style={{
                flex: 1, border: 'none', cursor: 'pointer', borderRadius: 24, padding: '10px 8px',
                fontSize: 13, fontWeight: 700,
                background: mode === t.key ? C.pink : 'transparent',
                color: mode === t.key ? '#fff' : C.muted,
                transition: 'all .2s',
              }}>{t.label}</button>
            ))}
          </div>

          {mode === 'create' ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>NOM DE LA CRÈCHE</label>
                <input value={nomCreche} onChange={e => setNomCreche(e.target.value)}
                  placeholder="Ex : Les Bébés du Monde"
                  style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: '🧸 MAX PETITS (0-12 mois)', val: maxPetits, set: setMaxPetits },
                  { label: '🎨 MAX GRANDS (12 mois+)', val: maxGrands, set: setMaxGrands },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input type="number" min="1" max="50" value={f.val}
                      onChange={e => f.set(parseInt(e.target.value) || 1)}
                      style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 18, fontWeight: 700, color: C.pink, background: C.bg, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
                  </div>
                ))}
              </div>

              <div style={{ background: C.pinkSoft, borderRadius: 12, padding: '12px 16px', marginBottom: 20, textAlign: 'center' }}>
                <span style={{ color: C.muted, fontSize: 12 }}>Capacité totale : </span>
                <span style={{ color: C.pink, fontWeight: 800, fontSize: 18 }}>{maxPetits + maxGrands} enfants</span>
              </div>

              {error && <div style={{ background: '#fdeaea', color: C.red, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

              <button onClick={handleCreate} disabled={loading} style={{
                width: '100%', background: C.pink, color: '#fff', border: 'none',
                borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>
                {loading ? 'Création...' : '🏗️ Créer ma crèche'}
              </button>
            </>
          ) : (
            <>
              <div style={{ background: C.tealLight, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <p style={{ color: '#3a8a7a', fontSize: 13, margin: 0 }}>📩 Demandez le code à la directrice principale de votre crèche</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, display: 'block', marginBottom: 6 }}>CODE DE LA CRÈCHE</label>
                <input value={code} onChange={e => setCode(e.target.value)}
                  placeholder="Ex : CRECHE-AB3KP"
                  style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 15, fontWeight: 700, color: C.pink, background: C.bg, outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 2 }} />
              </div>

              {error && <div style={{ background: '#fdeaea', color: C.red, borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

              <button onClick={handleJoin} disabled={loading} style={{
                width: '100%', background: C.pink, color: '#fff', border: 'none',
                borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>
                {loading ? 'Recherche...' : '🔗 Rejoindre la crèche'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}