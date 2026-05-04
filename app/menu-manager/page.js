'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function MenuManager() {
  const [menuItems, setMenuItems] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    getRestaurant()
  }, [])

  async function getRestaurant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: rest } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (!rest) { router.push('/login'); return }
    setRestaurant(rest)
    fetchItems(rest.id)
  }

  async function fetchItems(id) {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', id)
      .order('category')
    setMenuItems(data || [])
  }

  function openAddForm() {
    setEditingItem(null)
    setForm({ name: '', description: '', price: '', category: '' })
    setShowForm(true)
  }

  function openEditForm(item) {
    setEditingItem(item)
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || ''
    })
    setShowForm(true)
  }

  async function saveItem() {
    if (!form.name || !form.price || !form.category) {
      setMessage('Please fill in name, price and category!')
      return
    }
    setLoading(true)

    if (editingItem) {
      await supabase.from('menu_items').update({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category
      }).eq('id', editingItem.id)
      setMessage('Item updated!')
    } else {
      await supabase.from('menu_items').insert({
        restaurant_id: restaurant.id,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        is_available: true
      })
      setMessage('Item added!')
    }

    setLoading(false)
    setShowForm(false)
    fetchItems(restaurant.id)
    setTimeout(() => setMessage(''), 3000)
  }

  async function deleteItem(id) {
    if (!confirm('Delete this item?')) return
    await supabase.from('menu_items').delete().eq('id', id)
    setMenuItems(menuItems.filter(i => i.id !== id))
    setMessage('Item deleted!')
    setTimeout(() => setMessage(''), 3000)
  }

  async function toggleAvailability(item) {
    await supabase.from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
    setMenuItems(menuItems.map(i =>
      i.id === item.id ? { ...i, is_available: !i.is_available } : i
    ))
  }

  const categories = [...new Set(menuItems.map(i => i.category))]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Menu Manager</h1>
          <p className="text-orange-100 text-sm">{restaurant?.name}</p>
        </div>
        <div className="flex gap-3">
          <a href="/dashboard"
            className="bg-white text-orange-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-50">
            ← Dashboard
          </a>
          <button onClick={openAddForm}
            className="bg-white text-orange-500 font-bold px-5 py-2 rounded-xl hover:bg-orange-50 text-sm">
            + Add Dish
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl mb-4 font-semibold text-sm">
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-orange-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingItem ? 'Edit Dish' : 'Add New Dish'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">Dish Name *</label>
                <input type="text" placeholder="e.g. Chicken Biryani"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:border-orange-400 text-gray-800"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Description</label>
                <input type="text" placeholder="e.g. Aromatic basmati rice with tender chicken"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:border-orange-400 text-gray-800"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-gray-600">Price (₹) *</label>
                  <input type="number" placeholder="e.g. 280"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:border-orange-400 text-gray-800"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold text-gray-600">Category *</label>
                  <input type="text" placeholder="e.g. Main Course"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:border-orange-400 text-gray-800"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveItem} disabled={loading}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50">
                {loading ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Dish'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        )}

        {menuItems.length === 0 && !showForm && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-lg">No dishes yet. Click "+ Add Dish" to get started!</p>
          </div>
        )}

        {categories.map(category => (
          <div key={category} className="mb-6">
            <h2 className="text-orange-500 font-bold text-lg mb-3">{category}</h2>
            <div className="space-y-3">
              {menuItems.filter(i => i.category === category).map(item => (
                <div key={item.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border flex justify-between items-center ${!item.is_available ? 'opacity-50' : 'border-gray-100'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      {!item.is_available && (
                        <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Unavailable</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-orange-500 font-bold mt-1">₹{item.price}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => toggleAvailability(item)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold ${item.is_available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </button>
                    <button onClick={() => openEditForm(item)}
                      className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-xl font-semibold">
                      Edit
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      className="text-xs bg-red-100 text-red-500 px-3 py-1.5 rounded-xl font-semibold">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}