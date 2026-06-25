import { useState } from 'react'
import { getToken } from './auth/useAuth'
import LoginPage from './auth/LoginPage'
import OrdersPage from './orders/OrdersPage'
import MapPage from './map/MapPage'

type View = 'orders' | 'map'

export default function App() {
  const [authed, setAuthed] = useState(() => getToken() !== null)
  const [view, setView] = useState<View>('orders')

  function handleLogout() {
    setAuthed(false)
    setView('orders')
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />
  }

  if (view === 'map') {
    return (
      <MapPage
        onLogout={handleLogout}
        onViewOrders={() => setView('orders')}
      />
    )
  }

  return (
    <OrdersPage
      onLogout={handleLogout}
      onViewMap={() => setView('map')}
    />
  )
}
