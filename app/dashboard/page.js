'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [restaurantId, setRestaurantId] = useState(null)

  useEffect(() => {
    getRestaurant()
  }, [])

  async function getRestaurant() {
    const { data } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', 'spice-garden')
      .single()
    setRestaurantId(data.id)
    fetchOrders(data.id)
    subscribeToOrders(data.id)
  }

  async function fetchOrders(id) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }

  function subscribeToOrders(id) {
    supabase
      .channel('orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${id}`
      }, (payload) => {
        setOrders(prev => [payload.new, ...prev])
      })
      .subscribe()
  }

  async function updateStatus(orderId, status) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o))
  }

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    served: 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Spice Garden — Dashboard</h1>
          <p className="text-orange-100 text-sm">Live orders will appear here instantly</p>
        </div>
        <div className="bg-orange-400 px-4 py-2 rounded-xl text-sm font-semibold">
          {orders.filter(o => o.status === 'pending').length} pending
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-lg">No orders yet. Waiting for customers...</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-orange-500 text-white text-lg font-bold px-4 py-1 rounded-xl">
                      Table {order.table_number}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full font-semibold ${statusColor[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700">
                      <span>{item.name} × {item.qty}</span>
                      <span className="text-orange-500">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t pt-3">
                  <span className="font-bold text-gray-800">Total: ₹{order.total}</span>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button onClick={() => updateStatus(order.id, 'preparing')}
                        className="bg-blue-500 text-white px-4 py-1.5 rounded-xl text-sm font-semibold">
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => updateStatus(order.id, 'ready')}
                        className="bg-green-500 text-white px-4 py-1.5 rounded-xl text-sm font-semibold">
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button onClick={() => updateStatus(order.id, 'served')}
                        className="bg-gray-500 text-white px-4 py-1.5 rounded-xl text-sm font-semibold">
                        Mark Served
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}