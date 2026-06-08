import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const C = {
  bg: '#fdf8f6', card: '#ffffff', pink: '#c96b8a', pinkLight: '#f2d6df',
  pinkSoft: '#fbedf2', rose: '#e8a0b4', teal: '#a8d5cc', tealLight: '#e0f4f0',
  text: '#2d2340', muted: '#9b8fa8', red: '#e05c5c', redLight: '#fdeaea',
  green: '#5caa8a', greenLight: '#e6f7f1', border: '#f0e8ee', orange: '#e8832a',
  orangeLight: '#fdf0e6',
}

function getSection(d) {
  if (!d) return 'Grands'
  return (new Date() - new Date(d)) / (1000*60*60*24*30) <= 12 ? 'Petits' : 'Grands'
}
function getAge(d) {
  if (!d) return ''
  const m = Math.floor((new Date() - new Date(d)) / (1000*60*60*24*30))
  return m < 12 ? `${m} mois` : `${Math.floor(m/12)} an${Math.floor(m/12)>1?'s':''}`
}
function formatDate(d) {
  if (!d) return ''
  const [y,m,day] = d.split('-')
  return `${day}/${m}/${y}`
}
function isActiveOnDate(c, date) {
  const d = new Date(date)
  if (c.debut_contrat && d < new Date(c.debut_contrat)) return false
  if (c.fin_contrat && d > new Date(c.fin_contrat)) return false
  return true
}
function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24))
}

function Card({ children, style={}, onClick }) {
  return <div onClick={onClick} style={{ background:C.card, borderRadius:16, padding:18, boxShadow:'0 2px 12px #e8d6e022', border:`1px solid ${C.border}`, cursor:onClick?'pointer':'default', ...style }}>{children}</div>
}
function SectionBadge({ section }) {
  const p = section==='Petits'
  return <span style={{ background:p?C.pinkLight:C.tealLight, color:p?C.pink:'#3a8a7a', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:600 }}>{p?'🧸':'🎨'} {section}</span>
}
function ProgressBar({ value, max }) {
  return <div style={{ marginTop:6, height:8, borderRadius:8, background:'#f0e8ee', overflow:'hidden' }}>
    <div style={{ width:`${Math.min(100,Math.round((value/max)*100))}%`, height:'100%', borderRadius:8, background:value>max?C.red:C.pink, transition:'width .4s' }} />
  </div>
}
function CompletBadge() {
  return <span style={{ background:C.redLight, color:C.red, borderRadius:20, padding:'5px 14px', fontSize:13, fontWeight:700 }}>🔴 COMPLET</span>
}

function Nav({ page, setPage, onLogout, onProfile }) {
  return (
    <nav style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', background:C.bg, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:10 }}>
      <span style={{ fontSize:24, marginRight:4 }}>🏡</span>
      <div style={{ display:'flex', background:'#f0e8ee', borderRadius:30, padding:4, gap:4, flex:1 }}>
        {[{key:'home',icon:'🏠'},{key:'calendar',icon:'📅'},{key:'children',icon:'👶'}].map(t => (
          <button key={t.key} onClick={() => setPage(t.key)} style={{ flex:1, border:'none', cursor:'pointer', borderRadius:24, padding:'8px', fontSize:18, background:page===t.key?C.pink:'transparent', color:page===t.key?'#fff':C.muted, transition:'all .2s' }}>{t.icon}</button>
        ))}
      </div>
      <button onClick={onProfile} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20 }} title="Profil crèche">⚙️</button>
      <button onClick={onLogout} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20 }} title="Déconnexion">🚪</button>
    </nav>
  )
}

function NotifBanner({ enfants, dismissed, onDismiss }) {
  const soon = enfants.filter(c => {
    if (!c.fin_contrat) return false
    const days = daysUntil(c.fin_contrat)
    return days >= 0 && days <= 30
  }).filter(c => !dismissed.includes(c.id))
  if (soon.length === 0) return null
  return (
    <div style={{ background:C.orangeLight, border:`1px solid #f0c08a`, borderRadius:14, padding:'12px 16px', margin:'16px 16px 0', maxWidth:480, marginLeft:'auto', marginRight:'auto' }}>
      <div style={{ fontWeight:700, color:C.orange, fontSize:14, marginBottom:6 }}>⚠️ {soon.length} contrat{soon.length>1?'s':''} expirent bientôt</div>
      {soon.map(c => (
        <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:13, color:C.text }}>{c.nom}</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12, color:C.orange, fontWeight:600 }}>{daysUntil(c.fin_contrat)===0?"Aujourd'hui":`dans ${daysUntil(c.fin_contrat)}j`}</span>
            <button onClick={() => onDismiss(c.id)} style={{ border:'none', background:'none', cursor:'pointer', color:C.muted, fontSize:16 }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProfileModal({ creche, onClose, onSave }) {
  const [nom, setNom] = useState(creche.nom)
  const [maxP, setMaxP] = useState(creche.max_petits)
  const [maxG, setMaxG] = useState(creche.max_grands)
  const [logo, setLogo] = useState(creche.logo_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `logos/${creche.id}.${ext}`
    const { error } = await supabase.storage.from('creche-logos').upload(path, file, { upsert:true })
    if (!error) {
      const { data } = supabase.storage.from('creche-logos').getPublicUrl(path)
      setLogo(data.publicUrl)
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase.from('creches').update({ nom, max_petits:maxP, max_grands:maxG, logo_url:logo }).eq('id', creche.id).select().single()
    if (!error) { onSave(data); onClose() }
    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(45,35,64,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.card, borderRadius:20, padding:24, maxWidth:400, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, color:C.text, fontSize:18, fontWeight:800 }}>⚙️ Profil de la crèche</h3>
          <button onClick={onClose} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:C.muted }}>✕</button>
        </div>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          {logo
            ? <img src={logo} alt="logo" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:`3px solid ${C.pinkLight}` }} />
            : <div style={{ width:80, height:80, borderRadius:'50%', background:C.pinkSoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto' }}>👶</div>
          }
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display:'none' }} />
          <button onClick={() => fileRef.current.click()} style={{ marginTop:10, border:`1px solid ${C.border}`, background:C.pinkSoft, color:C.pink, borderRadius:20, padding:'6px 16px', fontSize:13, fontWeight:700, cursor:'pointer', display:'block', margin:'10px auto 0' }}>
            {uploading ? 'Upload...' : '📷 Changer le logo'}
          </button>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:1, display:'block', marginBottom:6 }}>NOM DE LA CRÈCHE</label>
          <input value={nom} onChange={e=>setNom(e.target.value)}
            style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:12, padding:'11px 14px', fontSize:14, color:C.text, background:C.bg, outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          {[{label:'🧸 MAX PETITS',val:maxP,set:setMaxP},{label:'🎨 MAX GRANDS',val:maxG,set:setMaxG}].map(f => (
            <div key={f.label}>
              <label style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:0.5, display:'block', marginBottom:6 }}>{f.label}</label>
              <input type="number" min="1" max="99" value={f.val} onChange={e=>f.set(parseInt(e.target.value)||1)}
                style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:12, padding:'11px 14px', fontSize:18, fontWeight:700, color:C.pink, background:C.bg, outline:'none', boxSizing:'border-box', textAlign:'center' }} />
            </div>
          ))}
        </div>
        <div style={{ background:C.pinkSoft, borderRadius:12, padding:'10px 16px', marginBottom:20, textAlign:'center' }}>
          <span style={{ color:C.muted, fontSize:12 }}>Capacité totale : </span>
          <span style={{ color:C.pink, fontWeight:800, fontSize:18 }}>{maxP+maxG} enfants</span>
        </div>
        <div style={{ background:C.pinkSoft, borderRadius:12, padding:'10px 16px', marginBottom:20, textAlign:'center' }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>🔗 Code de partage</div>
          <div style={{ fontSize:18, fontWeight:800, color:C.pink, letterSpacing:3 }}>{creche.code}</div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ width:'100%', background:C.pink, color:'#fff', border:'none', borderRadius:12, padding:'13px', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          {saving?'Sauvegarde...':'✅ Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

function HomePage({ enfants, creche, dismissed, onDismiss }) {
  const today = new Date().toISOString().split('T')[0]
  const actifs = enfants.filter(c => isActiveOnDate(c, today))
  const petits = actifs.filter(c => c.section==='Petits')
  const grands = actifs.filter(c => c.section==='Grands')
  const maxP=creche.max_petits, maxG=creche.max_grands, maxT=maxP+maxG
  const complet = actifs.length >= maxT
  const m=new Date().getMonth(), y=new Date().getFullYear()
  const arrivees = enfants.filter(c => { if(!c.debut_contrat)return false; const d=new Date(c.debut_contrat); return d.getMonth()===m&&d.getFullYear()===y })
  const departs = enfants.filter(c => { if(!c.fin_contrat)return false; const d=new Date(c.fin_contrat); return d.getMonth()===m&&d.getFullYear()===y })
  const monthName = new Date().toLocaleString('fr-FR',{month:'long',year:'numeric'})

  return (
    <div style={{ padding:'20px 16px', maxWidth:480, margin:'0 auto' }}>
      <NotifBanner enfants={enfants} dismissed={dismissed} onDismiss={onDismiss} />
      <div style={{ textAlign:'center', margin:'28px 0' }}>
        {creche.logo_url
          ? <img src={creche.logo_url} alt="logo" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:`3px solid ${C.pinkLight}`, margin:'0 auto 14px', display:'block' }} />
          : <div style={{ width:80, height:80, borderRadius:'50%', background:C.pinkSoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 14px' }}>👶</div>
        }
        <h1 style={{ fontSize:26, fontWeight:800, color:C.text, margin:0 }}>Bienvenue à</h1>
        <h1 style={{ fontSize:26, fontWeight:800, color:C.pink, margin:'2px 0 8px' }}>{creche.nom}</h1>
        <p style={{ color:C.muted, fontSize:14 }}>Gestion simple et bienveillante</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
        {[{icon:'🧸',label:'Petits',sub:`max ${maxP}`},{icon:'🎨',label:'Grands',sub:`max ${maxG}`},{icon:'📋',label:'Capacité',sub:`${maxT} enfants`}].map(s => (
          <Card key={s.label} style={{ textAlign:'center', padding:'14px 8px' }}>
            <div style={{ fontSize:24 }}>{s.icon}</div>
            <div style={{ fontSize:12, fontWeight:700, color:C.text, marginTop:4 }}>{s.label}</div>
            <div style={{ fontSize:11, color:C.muted }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:C.text }}>Tableau de bord</h2>
          <span style={{ color:C.muted, fontSize:13 }}>{monthName}</span>
        </div>
        {complet && <CompletBadge />}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
        {[{label:'TOTAL',val:actifs.length,max:maxT,icon:'👥'},{label:'PETITS',val:petits.length,max:maxP,icon:'🧸'},{label:'GRANDS',val:grands.length,max:maxG,icon:'🎨'}].map(s => (
          <Card key={s.label}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:1 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.val>s.max?C.red:C.text }}>{s.val}<span style={{ fontSize:16, color:C.muted }}>/{s.max}</span></div>
            <ProgressBar value={s.val} max={s.max} />
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom:12 }}>
        <div style={{ color:C.green, fontWeight:700, fontSize:14, marginBottom:4 }}>↗ Arrivées ce mois ({arrivees.length})</div>
        {arrivees.length===0 ? <div style={{ color:C.muted, fontSize:13, fontStyle:'italic' }}>Aucune arrivée</div>
          : arrivees.map(c => <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
              <span style={{ width:28, height:28, borderRadius:'50%', background:C.pinkLight, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:C.pink, fontSize:12 }}>{c.nom[0]}</span>
              <span style={{ fontSize:13, fontWeight:600 }}>{c.nom}</span><SectionBadge section={c.section} />
            </div>)}
      </Card>
      <Card style={{ marginBottom:12 }}>
        <div style={{ color:C.red, fontWeight:700, fontSize:14, marginBottom:4 }}>↘ Départs ce mois ({departs.length})</div>
        {departs.length===0 ? <div style={{ color:C.muted, fontSize:13, fontStyle:'italic' }}>Aucun départ</div>
          : departs.map(c => <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
              <span style={{ width:28, height:28, borderRadius:'50%', background:C.pinkLight, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:C.pink, fontSize:12 }}>{c.nom[0]}</span>
              <span style={{ fontSize:13, fontWeight:600 }}>{c.nom}</span><SectionBadge section={c.section} />
            </div>)}
      </Card>
      <Card style={{ textAlign:'center', background:C.pinkSoft }}>
        <div style={{ fontSize:13, color:C.muted, marginBottom:6 }}>🔗 Code de partage</div>
        <div style={{ fontSize:20, fontWeight:800, color:C.pink, letterSpacing:3 }}>{creche.code}</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Partagez ce code à vos co-directrices</div>
      </Card>
    </div>
  )
}

function CalendarPage({ enfants, creche }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today.getDate())
  const [showModal, setShowModal] = useState(false)
  const year=viewDate.getFullYear(), month=viewDate.getMonth()
  const monthName = viewDate.toLocaleString('fr-FR',{month:'long',year:'numeric'})
  const offset = (d => d===0?6:d-1)(new Date(year,month,1).getDay())
  const daysInMonth = new Date(year,month+1,0).getDate()
  const maxP=creche.max_petits, maxG=creche.max_grands, maxT=maxP+maxG
  const selStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`
  const actifs = enfants.filter(c => isActiveOnDate(c, selStr))
  const petits = actifs.filter(c => c.section==='Petits')
  const grands = actifs.filter(c => c.section==='Grands')
  const complet = actifs.length >= maxT
  const arrivees = enfants.filter(c => { if(!c.debut_contrat)return false; const d=new Date(c.debut_contrat); return d.getMonth()===month&&d.getFullYear()===year })
  const departs = enfants.filter(c => { if(!c.fin_contrat)return false; const d=new Date(c.fin_contrat); return d.getMonth()===month&&d.getFullYear()===year })

  function exportPDF() {
    const win = window.open('','_blank')
    win.document.write(`<html><head><title>Calendrier ${monthName}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#2d2340}h1{color:#c96b8a}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#f2d6df;color:#c96b8a;padding:8px;text-align:left}td{padding:8px;border-bottom:1px solid #f0e8ee}.badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:12px;font-weight:bold}.complet{background:#fdeaea;color:#e05c5c}.ok{background:#e6f7f1;color:#5caa8a}.petit{background:#f2d6df;color:#c96b8a}.grand{background:#e0f4f0;color:#3a8a7a}</style></head><body>
    <h1>📅 Calendrier — ${monthName}</h1>
    <p><strong>Enfants inscrits :</strong> ${actifs.length}/${maxT} <span class="badge ${complet?'complet':'ok'}">${complet?'🔴 COMPLET':'🟢 Places disponibles'}</span></p>
    ${arrivees.length>0?`<p style="color:#5caa8a">↗ ${arrivees.length} arrivée(s) : ${arrivees.map(c=>c.nom).join(', ')}</p>`:''}
    ${departs.length>0?`<p style="color:#e05c5c">↘ ${departs.length} départ(s) : ${departs.map(c=>c.nom).join(', ')}</p>`:''}
    <h2>Liste des enfants</h2>
    <table><tr><th>Nom</th><th>Âge</th><th>Section</th><th>Début</th><th>Fin</th></tr>
    ${actifs.map(c=>`<tr><td>${c.nom}</td><td>${getAge(c.date_naissance)}</td><td><span class="badge ${c.section==='Petits'?'petit':'grand'}">${c.section}</span></td><td>${formatDate(c.debut_contrat)}</td><td>${formatDate(c.fin_contrat)}</td></tr>`).join('')}
    </table><p style="margin-top:30px;color:#9b8fa8;font-size:12px">Exporté le ${new Date().toLocaleDateString('fr-FR')}</p>
    </body></html>`)
    win.document.close()
    setTimeout(()=>win.print(),500)
  }

  return (
    <div style={{ padding:'20px 16px', maxWidth:480, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, margin:0 }}>Calendrier</h2>
        <button onClick={exportPDF} style={{ background:C.pink, color:'#fff', border:'none', borderRadius:20, padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer' }}>📄 PDF</button>
      </div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <button onClick={()=>setViewDate(new Date(year,month-1,1))} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:C.pink }}>‹</button>
          <span style={{ fontWeight:700, color:C.text, textTransform:'capitalize' }}>{monthName}</span>
          <button onClick={()=>setViewDate(new Date(year,month+1,1))} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:C.pink }}>›</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
          {['LUN','MAR','MER','JEU','VEN','SAM','DIM'].map(d=><div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:C.muted }}>{d}</div>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
          {Array(offset).fill(null).map((_,i)=><div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const day=i+1
            const isToday=day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()
            const isSel=day===selected
            return <button key={day} onClick={()=>setSelected(day)} style={{ border:'none', cursor:'pointer', borderRadius:'50%', width:36, height:36, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:isSel||isToday?700:400, background:isSel?C.pink:'transparent', color:isSel?'#fff':isToday?C.pink:C.text, outline:isToday&&!isSel?`2px solid ${C.rose}`:'none' }}>{day}</button>
          })}
        </div>
      </Card>
      <Card onClick={()=>setShowModal(true)}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:1 }}>👥 ENFANTS INSCRITS</div>
            <div style={{ fontSize:26, fontWeight:800, color:actifs.length>maxT?C.red:C.text }}>{actifs.length}<span style={{ fontSize:14, color:C.muted }}>/{maxT}</span></div>
          </div>
          {complet && <CompletBadge />}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ background:C.pinkSoft, borderRadius:12, padding:'10px 14px' }}>
            <div style={{ fontSize:12, color:C.muted }}>🧸 Petits</div>
            <div style={{ fontSize:20, fontWeight:800 }}>{petits.length}<span style={{ fontSize:12, color:C.muted }}>/{maxP}</span></div>
          </div>
          <div style={{ background:C.tealLight, borderRadius:12, padding:'10px 14px' }}>
            <div style={{ fontSize:12, color:C.muted }}>🎨 Grands</div>
            <div style={{ fontSize:20, fontWeight:800 }}>{grands.length}<span style={{ fontSize:12, color:C.muted }}>/{maxG}</span></div>
          </div>
        </div>
        {arrivees.length>0&&<div style={{ marginTop:8, color:C.green, fontSize:13, fontWeight:600 }}>↗ +{arrivees.length} arrivée(s) ce mois</div>}
        {departs.length>0&&<div style={{ marginTop:4, color:C.red, fontSize:13, fontWeight:600 }}>↘ -{departs.length} départ(s) ce mois</div>}
        <div style={{ marginTop:10, color:C.pink, fontSize:13, fontWeight:600 }}>Cliquer pour voir le détail →</div>
      </Card>
      {showModal && (
        <div onClick={()=>setShowModal(false)} style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(45,35,64,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.card, borderRadius:20, padding:24, maxWidth:400, width:'100%', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, color:C.text, fontSize:18, fontWeight:800 }}>Enfants — {monthName}</h3>
              <button onClick={()=>setShowModal(false)} style={{ border:'none', background:'none', fontSize:20, cursor:'pointer', color:C.muted }}>✕</button>
            </div>
            {actifs.length===0 ? <p style={{ color:C.muted, fontStyle:'italic' }}>Aucun enfant ce mois</p>
              : actifs.map(c=>(
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ width:32, height:32, borderRadius:'50%', background:C.pinkLight, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:C.pink, fontSize:13 }}>{c.nom[0]}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{c.nom} <span style={{ color:C.muted, fontWeight:400 }}>({getAge(c.date_naissance)})</span></div>
                  </div>
                  <SectionBadge section={c.section} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChildCard({ c, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nom:c.nom, date_naissance:c.date_naissance||'', section:c.section, debut_contrat:c.debut_contrat||'', fin_contrat:c.fin_contrat||'', adaptation:c.adaptation||'', notes:c.notes||'' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase.from('enfants').update({ ...form, date_naissance:form.date_naissance||null, debut_contrat:form.debut_contrat||null, fin_contrat:form.fin_contrat||null }).eq('id',c.id).select().single()
    if (!error) { onUpdate(data); setEditing(false) }
    setSaving(false)
  }

  async function handleNoteBlur(notes) {
    await supabase.from('enfants').update({ notes }).eq('id',c.id)
    onUpdate({ ...c, notes })
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer cet enfant ? Cette action est irréversible.')) return
    onDelete(c.id)
  }

  if (editing) return (
    <div style={{ background:C.card, borderRadius:16, padding:18, border:`2px solid ${C.pink}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontWeight:700, color:C.pink, fontSize:15 }}>✏️ Modifier</span>
        <button onClick={()=>setEditing(false)} style={{ border:'none', background:'none', cursor:'pointer', color:C.muted, fontSize:18 }}>✕</button>
      </div>
      {[{label:'NOM COMPLET',key:'nom',type:'text'},{label:'DATE DE NAISSANCE',key:'date_naissance',type:'date'},{label:'DÉBUT DE CONTRAT',key:'debut_contrat',type:'date'},{label:'FIN DE CONTRAT',key:'fin_contrat',type:'date'}].map(f=>(
        <div key={f.key} style={{ marginBottom:10 }}>
          <label style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:1, display:'block', marginBottom:4 }}>{f.label}</label>
          <input type={f.type} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
            style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 12px', fontSize:14, color:C.text, background:C.bg, boxSizing:'border-box', outline:'none' }} />
        </div>
      ))}
      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:1, display:'block', marginBottom:4 }}>SECTION</label>
        <select value={form.section} onChange={e=>setForm(p=>({...p,section:e.target.value}))}
          style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 12px', fontSize:14, color:C.text, background:C.bg, outline:'none' }}>
          <option value="Petits">🧸 Petits</option>
          <option value="Grands">🎨 Grands</option>
        </select>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:1, display:'block', marginBottom:4 }}>DATE D'ADAPTATION</label>
        <input type="text" placeholder="ex : semaine du 10 juin..." value={form.adaptation} onChange={e=>setForm(p=>({...p,adaptation:e.target.value}))}
          style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 12px', fontSize:14, color:C.text, background:C.bg, boxSizing:'border-box', outline:'none' }} />
      </div>
      <button onClick={handleSave} disabled={saving} style={{ width:'100%', background:C.pink, color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
        {saving?'Sauvegarde...':'✅ Sauvegarder'}
      </button>
    </div>
  )

  return (
    <div style={{ background:C.card, borderRadius:16, padding:18, boxShadow:'0 2px 12px #e8d6e022', border:`1px solid ${C.border}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <span style={{ width:34, height:34, borderRadius:'50%', background:C.pinkLight, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:C.pink, fontSize:14 }}>{c.nom[0]}</span>
        <div style={{ flex:1 }}>
          <span style={{ fontWeight:700, color:C.text, fontSize:15 }}>{c.nom}</span>
          {c.date_naissance&&<span style={{ color:C.muted, fontSize:12, marginLeft:6 }}>({getAge(c.date_naissance)})</span>}
        </div>
        <SectionBadge section={c.section} />
      </div>
      {(c.debut_contrat||c.fin_contrat)&&<div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>📅 {formatDate(c.debut_contrat)} → {formatDate(c.fin_contrat)}</div>}
      {c.adaptation&&<div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>🗓️ Adaptation : {c.adaptation}</div>}
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <button onClick={()=>setEditing(true)} style={{ border:`1px solid ${C.border}`, background:C.pinkSoft, color:C.pink, borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>✏️ Modifier</button>
        <button onClick={handleDelete} style={{ border:'none', background:'none', cursor:'pointer', fontSize:16, color:C.muted }}>🗑️</button>
      </div>
      <textarea placeholder="Notes libres..." defaultValue={c.notes||''} onBlur={e=>handleNoteBlur(e.target.value)}
        style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 12px', fontSize:13, color:C.text, background:C.bg, resize:'vertical', minHeight:48, boxSizing:'border-box', outline:'none', fontFamily:'inherit' }} />
    </div>
  )
}

function ChildrenPage({ enfants, setEnfants, creche }) {
  const [form, setForm] = useState({ nom:'', date_naissance:'', section:'auto', debut_contrat:'', fin_contrat:'', adaptation:'', notes:'' })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const maxP=creche.max_petits, maxG=creche.max_grands, maxT=maxP+maxG
  const today=new Date().toISOString().split('T')[0]
  const actifs=enfants.filter(c=>isActiveOnDate(c,today))
  const petits=actifs.filter(c=>c.section==='Petits')
  const grands=actifs.filter(c=>c.section==='Grands')
  const filtered = enfants.filter(c=>c.nom.toLowerCase().includes(search.toLowerCase()))

  async function handleAdd() {
    if (!form.nom.trim()) return
    setLoading(true)
    const section = form.section==='auto' ? getSection(form.date_naissance) : form.section
    const { data, error } = await supabase.from('enfants').insert({ ...form, section, creche_id:creche.id, date_naissance:form.date_naissance||null, debut_contrat:form.debut_contrat||null, fin_contrat:form.fin_contrat||null }).select().single()
    if (!error) setEnfants(prev=>[data,...prev])
    setForm({ nom:'', date_naissance:'', section:'auto', debut_contrat:'', fin_contrat:'', adaptation:'', notes:'' })
    setLoading(false)
  }

  async function handleDelete(id) {
    await supabase.from('enfants').delete().eq('id',id)
    setEnfants(prev=>prev.filter(c=>c.id!==id))
  }

  return (
    <div style={{ padding:'20px 16px', maxWidth:480, margin:'0 auto' }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:14 }}>Enfants</h2>
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        <span style={{ background:C.pinkLight, color:C.pink, borderRadius:20, padding:'5px 12px', fontSize:12, fontWeight:700 }}>🧸 Petits : {petits.length}/{maxP}</span>
        <span style={{ background:C.tealLight, color:'#3a8a7a', borderRadius:20, padding:'5px 12px', fontSize:12, fontWeight:700 }}>🎨 Grands : {grands.length}/{maxG}</span>
        <span style={{ background:C.pinkSoft, color:C.muted, borderRadius:20, padding:'5px 12px', fontSize:12, fontWeight:700 }}>👥 {actifs.length}/{maxT}</span>
      </div>

      <Card style={{ marginBottom:20 }}>
        <h3 style={{ margin:'0 0 14px', color:C.pink, fontSize:16, fontWeight:700 }}>+ Ajouter un enfant</h3>
        {[{label:'NOM COMPLET *',key:'nom',type:'text',placeholder:'Prénom Nom'},{label:'DATE DE NAISSANCE',key:'date_naissance',type:'date'},{label:'DÉBUT DE CONTRAT',key:'debut_contrat',type:'date'},{label:'FIN DE CONTRAT',key:'fin_contrat',type:'date'}].map(f=>(
          <div key={f.key} style={{ marginBottom:12 }}>
            <label style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:1, display:'block', marginBottom:4 }}>{f.label}</label>
            <input type={f.type} placeholder={f.placeholder||''} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
              style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 12px', fontSize:14, color:C.text, background:C.bg, boxSizing:'border-box', outline:'none' }} />
          </div>
        ))}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:1, display:'block', marginBottom:4 }}>SECTION</label>
          <select value={form.section} onChange={e=>setForm(p=>({...p,section:e.target.value}))}
            style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 12px', fontSize:14, color:C.text, background:C.bg, outline:'none' }}>
            <option value="auto">Automatique</option>
            <option value="Petits">🧸 Petits (0–12 mois)</option>
            <option value="Grands">🎨 Grands (12 mois +)</option>
          </select>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:1, display:'block', marginBottom:4 }}>DATE D'ADAPTATION</label>
          <input type="text" placeholder="ex : semaine du 10 juin..." value={form.adaptation} onChange={e=>setForm(p=>({...p,adaptation:e.target.value}))}
            style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 12px', fontSize:14, color:C.text, background:C.bg, boxSizing:'border-box', outline:'none' }} />
        </div>
        <button onClick={handleAdd} disabled={loading} style={{ width:'100%', background:C.pink, color:'#fff', border:'none', borderRadius:12, padding:'13px', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          {loading?'Ajout...':'+ Ajouter l\'enfant'}
        </button>
      </Card>

      {/* Barre de recherche */}
      <div style={{ marginBottom:16 }}>
        <input type="text" placeholder="🔍 Rechercher un enfant..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:12, padding:'11px 14px', fontSize:14, color:C.text, background:C.card, boxSizing:'border-box', outline:'none' }} />
        {search && <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>{filtered.length} résultat{filtered.length>1?'s':''} pour "{search}"</div>}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.map(c=><ChildCard key={c.id} c={c} onUpdate={u=>setEnfants(prev=>prev.map(x=>x.id===u.id?u:x))} onDelete={handleDelete} />)}
        {filtered.length===0 && search && <div style={{ textAlign:'center', color:C.muted, fontSize:14, padding:'20px 0' }}>Aucun enfant trouvé pour "{search}"</div>}
      </div>
    </div>
  )
}

export default function Dashboard({ creche, setCreche, userId }) {
  const [page, setPage] = useState('home')
  const [enfants, setEnfants] = useState([])
  const [showProfile, setShowProfile] = useState(false)
  const [dismissed, setDismissed] = useState([])

  useEffect(() => {
    supabase.from('enfants').select('*').eq('creche_id',creche.id).order('created_at',{ascending:false})
      .then(({data}) => { if(data) setEnfants(data) })
  }, [creche.id])

  async function handleLogout() { await supabase.auth.signOut() }

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Nav page={page} setPage={setPage} onLogout={handleLogout} onProfile={()=>setShowProfile(true)} />
      {page==='home' && <HomePage enfants={enfants} creche={creche} dismissed={dismissed} onDismiss={id=>setDismissed(prev=>[...prev,id])} />}
      {page==='calendar' && <CalendarPage enfants={enfants} creche={creche} />}
      {page==='children' && <ChildrenPage enfants={enfants} setEnfants={setEnfants} creche={creche} />}
      {showProfile && <ProfileModal creche={creche} onClose={()=>setShowProfile(false)} onSave={updated=>setCreche(updated)} />}
    </div>
  )
}
