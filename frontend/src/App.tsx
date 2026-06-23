import { Routes, Route, Navigate } from 'react-router-dom'
import Login    from './pages/Login'
import Devices  from './pages/Devices'
import Settings from './pages/Settings'

// Simple auth check — replace with real JWT validation
const isAuthenticated = () => !!localStorage.getItem('hg_token')

function Protected({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Devices /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
