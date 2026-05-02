'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: rest } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'spice-garden')
      .single()
    setRestaurant(rest)

    const { data: items } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', rest.id)
    setMenuItems(items)
  }

  function addToCart(item) {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
    } else {
      setCart([...cart, { ...item, qty: 1 }])
    }
  }

  function removeFromCart(itemId) {
    setCart(cart.filter(c => c.id !== itemId))
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  async function placeOrder() {
    if (!tableNumber) return alert('Please enter your table number!')
    if (cart.length === 0) return alert('Your cart is empty!')

    await supabase.from('orders').insert({
      restaurant_id: restaurant.id,
      table_number: tableNumber,
      items: cart,
      total: total,
      status: 'pending'
    })
    setOrderPlaced(true)
    setCart([])
  }

  const categories = [...new Set(menuItems.map(i => i.category))]

  if (orderPlaced) return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-orange-600 mb-2">Order Placed!</h2>
        <p className="text-gray-600">Your food is being prepared. Sit back and relax!</p>
        <p className="text-lg font-semibold mt-4">Table {tableNumber}</p>
        <button onClick={() => { setOrderPlaced(false); setTableNumber('') }}
          className="mt-6 bg-orange-500 text-white px-6 py-2 rounded-full">
          Order More
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-orange-500 text-white p-6 text-center">
        <h1 className="text-3xl font-bold">{restaurant?.name}</h1>
        <p className="mt-1 text-orange-100">{restaurant?.description}</p>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Table number input */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-600 mb-1">Your Table Number</label>
          <input
            type="number"
            placeholder="Enter table number e.g. 5"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-400"
          />
        </div>

        {/* Menu */}
        {categories.map(category => (
          <div key={category} className="mb-6">
            <h2 className="text-lg font-bold text-orange-500 mb-3">{category}</h2>
            <div className="space-y-3">
              {menuItems.filter(i => i.category === category).map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-orange-500 font-bold mt-1">₹{item.price}</p>
                  </div>
                  <button onClick={() => addToCart(item)}
                    className="bg-orange-500 text-white w-9 h-9 rounded-full text-xl font-bold hover:bg-orange-600">
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Cart */}
        {cart.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mt-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Your Order</h2>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">{item.name} x{item.qty}</span>
                <div className="flex items-center gap-3">
                  <span className="text-orange-500 font-semibold">₹{item.price * item.qty}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-sm">remove</button>
                </div>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg mt-3">
              <span>Total</span>
              <span className="text-orange-500">₹{total}</span>
            </div>
            <button onClick={placeOrder}
              className="w-full bg-orange-500 text-white py-3 rounded-xl mt-4 font-semibold text-lg hover:bg-orange-600">
              Place Order
            </button>
          </div>
        )}
      </div>
    </div>
  )
}