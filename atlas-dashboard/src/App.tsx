import { useState } from 'react'
import { getToken } from './auth/useAuth'
import LoginPage from './auth/LoginPage'
import OrdersPage from './orders/OrdersPage'

export default function App() {
  const [authed, setAuthed] = useState(() => getToken() !== null)

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />
  }
  return <OrdersPage onLogout={() => setAuthed(false)} />
}
