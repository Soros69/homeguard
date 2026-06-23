import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function authHeader() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem('hg_token')}` } }
}

export default function Settings() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('hg_token')
    navigate('/login')
  }

  async function exportData() {
    const { data } = await axios.get('/api/account/export', authHeader())
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'homeguard-my-data.json'; a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteAccount() {
    if (!confirm('Delete your account and all data? This cannot be undone.')) return
    await axios.delete('/api/account', authHeader())
    localStorage.removeItem('hg_token')
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button className="btn-ghost" onClick={() => navigate('/')} style={{ padding: '6px 12px', fontSize: 13 }}>← Back</button>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Settings</h1>
      </div>

      {/* Account */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Account</h2>
        <button className="btn-ghost" onClick={logout} style={{ width: '100%' }}>Sign out</button>
      </div>

      {/* GDPR */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Your data</h2>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16, lineHeight: 1.5 }}>
          Under UK GDPR you can export or delete all data we hold about you at any time.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-ghost" onClick={exportData}>⬇ Export my data (JSON)</button>
          <button className="btn-danger" onClick={deleteAccount}>Delete my account and all data</button>
        </div>
      </div>

      {/* Privacy */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Privacy &amp; legal</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
          <a href="/privacy">Privacy policy →</a>
          <a href="/terms">Terms of service →</a>
        </div>
        <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 16, lineHeight: 1.5 }}>
          HomeGuard beta — friends &amp; family testing only. We store your email address
          and device names from your home network. We never share or sell your data.
        </p>
      </div>
    </div>
  )
}
