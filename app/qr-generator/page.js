'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'

export default function QRGenerator() {
  const [restaurant, setRestaurant] = useState(null)
  const [tableCount, setTableCount] = useState(5)
  const [generated, setGenerated] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const router = useRouter()

  useEffect(() => {
    setBaseUrl(window.location.origin)
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
  }

  function downloadQR(tableNumber) {
    const svg = document.getElementById(`qr-table-${tableNumber}`)
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 350
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 300, 350)
      ctx.drawImage(img, 25, 25, 250, 250)
      ctx.fillStyle = '#1a1a1a'
      ctx.font = 'bold 22px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`Table ${tableNumber}`, 150, 310)
      ctx.font = '13px Arial'
      ctx.fillStyle = '#666'
      ctx.fillText(restaurant?.name, 150, 335)
      const link = document.createElement('a')
      link.download = `table-${tableNumber}-qr.png`
      link.href = canvas.toDataURL()
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  function downloadAll() {
    for (let i = 1; i <= tableCount; i++) {
      setTimeout(() => downloadQR(i), i * 500)
    }
  }

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">QR Code Generator</h1>
          <p className="text-orange-100 text-sm">{restaurant?.name}</p>
        </div>
        <a href="/dashboard"
          className="bg-white text-orange-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-50">
          ← Dashboard
        </a>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 mt-4">
          <h2 className="font-bold text-gray-800 text-lg mb-4">Setup</h2>
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-600 block mb-1">Restaurant</label>
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-orange-700 font-semibold">
              {restaurant?.name}
            </div>
          </div>
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-600 block mb-1">Number of Tables</label>
            <input type="number" min="1" max="50" value={tableCount}
              onChange={e => { setTableCount(parseInt(e.target.value)); setGenerated(false) }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-400 text-gray-800"
            />
          </div>
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-600 block mb-1">Base URL (Use your PC's IP address for mobile scanning)</label>
            <input type="text" value={baseUrl}
              onChange={e => { setBaseUrl(e.target.value); setGenerated(false) }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-400 text-gray-800 font-mono text-sm mb-2"
              placeholder="http://192.168.1.x:3000"
            />
            <p className="text-xs text-gray-500">
              Preview: <span className="font-mono">{baseUrl}/menu/{restaurant?.slug}/table/[number]</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setGenerated(true)}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600">
              Generate QR Codes
            </button>
            {generated && (
              <button onClick={downloadAll}
                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900">
                Download All
              </button>
            )}
          </div>
        </div>

        {generated && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">
              {tableCount} QR Codes — {restaurant?.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tables.map(table => (
                <div key={table} className="bg-white rounded-2xl p-5 shadow-sm text-center border border-gray-100">
                  <p className="text-sm text-gray-500 mb-3 font-semibold">Table {table}</p>
                  <div className="flex justify-center mb-3">
                    <QRCode
                      id={`qr-table-${table}`}
                      value={`${baseUrl}/menu/${restaurant?.slug}/table/${table}`}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#1a1a1a"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mb-3 break-all font-mono">
                    /menu/{restaurant?.slug}/table/{table}
                  </p>
                  <button onClick={() => downloadQR(table)}
                    className="w-full bg-orange-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}