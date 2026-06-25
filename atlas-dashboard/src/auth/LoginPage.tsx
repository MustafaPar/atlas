import { useState, FormEvent } from 'react'
import client from '../api/client'
import { setToken } from './useAuth'
import type { ApiResponse, AuthResponse } from '../api/types'

interface Props {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await client.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', {
        email,
        password,
      })
      setToken(res.data.data.accessToken)
      onLogin()
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } }; message?: string }
      const status = err.response?.status
      const msg    = err.response?.data?.message
      if (status === 401) {
        setError('Invalid credentials. Check email and password.')
      } else if (status) {
        setError(`Login failed (HTTP ${status}${msg ? ': ' + msg : ''}).`)
      } else {
        setError(`Cannot reach backend: ${err.message ?? 'network error'}. Is the server running?`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-full.svg" alt="Atlas" className="w-full" />
          <p className="mt-3 text-xs tracking-widest uppercase text-gray-500">
            Real-time Delivery Operations
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => { setEmail('demo@atlas.io'); setPassword('demo12345') }}
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            Use demo account
          </button>
        </div>
      </div>
    </div>
  )
}
