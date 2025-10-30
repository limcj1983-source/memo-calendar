'use client'

import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState } from 'react'
import MemoList from './components/MemoList'
import CalendarView from './components/CalendarView'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEventAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Memo Calendar</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left Side - Memos (2/5) */}
          <div className="xl:col-span-2">
            <MemoList onEventAdded={handleEventAdded} />
          </div>

          {/* Right Side - Calendar (3/5) */}
          <div className="xl:col-span-3">
            <CalendarView refreshKey={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  )
}
