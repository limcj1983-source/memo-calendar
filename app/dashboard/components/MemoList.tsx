'use client'

import { useState, useEffect } from 'react'

interface ExtractedDate {
  text: string
  startDate: string
  endDate?: string
  index: number
}

interface Memo {
  id: string
  title?: string
  content: string
  hasDate: boolean
  extractedDates?: ExtractedDate[]
  createdAt: string
  updatedAt: string
}

interface Calendar {
  id: string
  name: string
  color: string
  type: string
}

interface MemoListProps {
  onEventAdded?: () => void
}

export default function MemoList({ onEventAdded }: MemoListProps) {
  const [memos, setMemos] = useState<Memo[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewMemo, setShowNewMemo] = useState(false)
  const [newMemo, setNewMemo] = useState({ title: '', content: '' })
  const [editingMemo, setEditingMemo] = useState<string | null>(null)
  const [editContent, setEditContent] = useState({ title: '', content: '' })

  useEffect(() => {
    fetchMemos()
    fetchCalendars()
  }, [])

  const fetchMemos = async () => {
    try {
      const res = await fetch('/api/memos')
      if (res.ok) {
        const data = await res.json()
        console.log('FETCHED MEMOS:', data)
        setMemos(data)
      }
    } catch (error) {
      console.error('Failed to fetch memos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendars = async () => {
    try {
      const res = await fetch('/api/calendars')
      if (res.ok) {
        const data = await res.json()
        setCalendars(data)
      }
    } catch (error) {
      console.error('Failed to fetch calendars:', error)
    }
  }

  const createMemo = async () => {
    if (!newMemo.content.trim()) return

    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemo)
      })

      if (res.ok) {
        const memo = await res.json()
        setMemos([memo, ...memos])
        setNewMemo({ title: '', content: '' })
        setShowNewMemo(false)
      }
    } catch (error) {
      console.error('Failed to create memo:', error)
    }
  }

  const updateMemo = async (id: string) => {
    try {
      const res = await fetch(`/api/memos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editContent)
      })

      if (res.ok) {
        const updatedMemo = await res.json()
        setMemos(memos.map(m => m.id === id ? updatedMemo : m))
        setEditingMemo(null)
      }
    } catch (error) {
      console.error('Failed to update memo:', error)
    }
  }

  const deleteMemo = async (id: string) => {
    if (!confirm('Delete this memo?')) return

    try {
      const res = await fetch(`/api/memos/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setMemos(memos.filter(m => m.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete memo:', error)
    }
  }

  const addToCalendar = async (memo: Memo, dateInfo: ExtractedDate, calendarId: string) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: memo.title || memo.content.substring(0, 50),
          description: memo.content,
          startDate: dateInfo.startDate,
          endDate: dateInfo.endDate,
          calendarId,
          memoId: memo.id
        })
      })

      if (res.ok) {
        alert('Added to calendar!')
        if (onEventAdded) {
          onEventAdded()
        }
      }
    } catch (error) {
      console.error('Failed to add to calendar:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading memos...</div>
  }

  return (
    <div className="space-y-4">
      {/* New Memo Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Memos</h2>
        <button
          onClick={() => setShowNewMemo(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Memo
        </button>
      </div>

      {/* New Memo Form */}
      {showNewMemo && (
        <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg">
          <input
            type="text"
            placeholder="Title (optional)"
            value={newMemo.title}
            onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Write your memo... (e.g., 'Meeting tomorrow at 3pm')"
            value={newMemo.content}
            onChange={(e) => setNewMemo({ ...newMemo, content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={createMemo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowNewMemo(false)
                setNewMemo({ title: '', content: '' })
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Memo List */}
      <div className="space-y-3">
        {memos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No memos yet. Create your first memo!
          </div>
        ) : (
          memos.map((memo) => (
            <div key={memo.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              {editingMemo === memo.id ? (
                <div>
                  <input
                    type="text"
                    value={editContent.title}
                    onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  />
                  <textarea
                    value={editContent.content}
                    onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 h-32"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMemo(memo.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMemo(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {memo.title && (
                    <h3 className="font-semibold text-lg mb-2">{memo.title}</h3>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{memo.content}</p>

                  {/* Date Detection */}
                  {memo.hasDate && memo.extractedDates && memo.extractedDates.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        📅 Dates detected:
                      </p>
                      <div className="space-y-2">
                        {memo.extractedDates.map((dateInfo, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-blue-100">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">
                                "{dateInfo.text}"
                              </span>
                              <span className="text-xs text-gray-600 ml-2">
                                → {new Date(dateInfo.startDate).toLocaleString()}
                              </span>
                            </div>
                            <div className="relative group">
                              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                                + Add to Calendar
                              </button>
                              <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                                {calendars.map((cal) => (
                                  <button
                                    key={cal.id}
                                    onClick={() => addToCalendar(memo, dateInfo, cal.id)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: cal.color }}
                                    />
                                    {cal.name}
                                  </button>
                                ))}
                                {calendars.length === 0 && (
                                  <div className="px-4 py-2 text-sm text-gray-500">
                                    No calendars yet
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setEditingMemo(memo.id)
                        setEditContent({ title: memo.title || '', content: memo.content })
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMemo(memo.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                    <span className="ml-auto text-xs text-gray-500">
                      {new Date(memo.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
