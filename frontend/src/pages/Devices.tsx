import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface Device {
  id: string
  name: string
  mac: string
  ip: string
  blocked: boolean
  lastSeen: string
  type: 'phone' | 'laptop' | 'tv' | 'tablet' | 'unknown'
}

const typeIcon: Record<Device['type'], string> = {
  phone: '📱', laptop: '💻', tv: '📺', tablet: '📱', unknown: '🖥️',
}

function authHeader() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem('hg_token')}` } }
}

export default function Devices() {
  const [devices, setDevices]   = useState<Device[]>([])
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const navigate = useNavigate()

  async function load() {
    try {
      const { data } = await axios.get('/api/devices', authHeader())
      setDevices(data)
    } catch {
      // Token expired — back to login
      localStorage.removeItem('hg_token')
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  async function toggle(device: Device) {
    setToggling(device.id)
    try {
      const { data } = await axios.patch(
        `/api/devices/${device.id}`,
        { blocked: !device.blocked },
        authHeader()
      )
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, blocked: data.blocked } : d))
    } finally {
      setToggling(null)
    }
  }

  useEffect(() => { load() }, [])

  const online  = devices.filter(d => !d.blocked)
  const blocked = devices.filter(d =>  d.blocked)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>HomeGuard</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 2 }}>
            {devices.length} devices on your network
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={load} style={{ padding: '8px 12px' }}>↻ Refresh</button>
          <button className="btn-ghost" onClick={() => navigate('/settings')} style={{ padding: '8px 12px' }}>Settings</button>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--gray-600)', textAlign: 'center', marginTop: 48 }}>Loading devices…</p>}

      {!loading && devices.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>📡</p>
          <p style={{ fontWeight: 500 }}>No devices found</p>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 6 }}>
            Make sure the HomeGuard agent is running on your home network.
          </p>
        </div>
      )}

      {/* Online devices */}
      {online.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', letterSpacing: '.06em', marginBottom: 8 }}>
            ONLINE — {online.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {online.map(d => <DeviceRow key={d.id} device={d} onToggle={toggle} toggling={toggling === d.id} />)}
          </div>
        </>
      )}

      {/* Blocked devices */}
      {blocked.length > 0 && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', letterSpacing: '.06em', marginBottom: 8 }}>
            BLOCKED — {blocked.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {blocked.map(d => <DeviceRow key={d.id} device={d} onToggle={toggle} toggling={toggling === d.id} />)}
          </div>
        </>
      )}
    </div>
  )
}

function DeviceRow({ device, onToggle, toggling }: { device: Device; onToggle: (d: Device) => void; toggling: boolean }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', opacity: toggling ? .6 : 1, transition: 'opacity .2s' }}>
      <span style={{ fontSize: 26 }}>{typeIcon[device.type]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{device.name}</div>
        <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>{device.ip} · {device.mac}</div>
      </div>
      <span className={`badge ${device.blocked ? 'badge-red' : 'badge-green'}`}>
        {device.blocked ? '⛔ Blocked' : '✓ Online'}
      </span>
      <button
        onClick={() => onToggle(device)}
        disabled={toggling}
        className={device.blocked ? 'btn-primary' : 'btn-danger'}
        style={{ minWidth: 90, padding: '8px 14px', fontSize: 13 }}
      >
        {toggling ? '…' : device.blocked ? 'Unblock' : 'Block'}
      </button>
    </div>
  )
}
