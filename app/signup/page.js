'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const router = useRouter()
  const [form, setForm] = useState({
    restaurantName: '',
    email: '',
    password: '',
    whatsapp: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

 function generateSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
  async function handleSignup() {
    if (!form.restaurantName || !form.email || !form.password) {
      setError('Please fill in all required fields')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const slug = generateSlug(form.restaurantName)

    const { error: dbError } = await supabase.from('restaurants').insert({
      name: form.restaurantName,
      slug: slug,
      owner_id: data.user.id,
      whatsapp: form.whatsapp,
      description: `Welcome to ${form.restaurantName}`
    })

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🍽️</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Create your restaurant</h1>
          <p className="text-gray-500 text-sm mt-1">Get your digital menu in minutes</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">Restaurant Name *</label>
            <input
              type="text"
              placeholder="e.g. Spice Garden"
              value={form.restaurantName}
              onChange={e => setForm({ ...form, restaurantName: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">Email *</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">Password * (min 6 characters)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">WhatsApp Number</label>
            <input
              type="text"
              placeholder="e.g. 919876543210"
              value={form.whatsapp}
              onChange={e => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
            />
            <p className="text-xs text-gray-400 mt-1">Include country code — 91 for India</p>
          </div>
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold mt-6 hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Restaurant Account'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-orange-500 font-semibold hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}