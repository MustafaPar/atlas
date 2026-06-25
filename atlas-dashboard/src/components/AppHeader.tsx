interface Props {
  activeView: 'orders' | 'map'
  onViewOrders: () => void
  onViewMap: () => void
  onLogout: () => void
  lastUpdated: Date | null
}

export default function AppHeader({ activeView, onViewOrders, onViewMap, onLogout, lastUpdated }: Props) {
  const timeLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <header className="bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0" style={{ height: 56 }}>
      <div className="flex items-center gap-6">
        <img src="/logo-mark.svg" alt="Atlas" className="h-7" />
        <nav className="flex items-center gap-1 h-full">
          <button
            onClick={onViewOrders}
            className={`px-3 h-full text-sm transition-colors ${
              activeView === 'orders'
                ? 'text-gray-900 font-semibold border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Orders
          </button>
          <button
            onClick={onViewMap}
            className={`px-3 h-full text-sm transition-colors ${
              activeView === 'map'
                ? 'text-gray-900 font-semibold border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Map
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>Live · Last updated {timeLabel}</span>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
