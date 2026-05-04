'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🍽️</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Restaurant Login</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your restaurant</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold mt-6 hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <a href="/signup" className="text-orange-500 font-semibold hover:underline">Sign up free</a>
        </p>
      </div>
    </div>
  )
}