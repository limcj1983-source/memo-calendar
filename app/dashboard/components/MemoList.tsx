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
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Memos</h2>
          <p className="text-sm text-gray-500">{memos.length} notes</p>
        </div>
        <button
          onClick={() => setShowNewMemo(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Memo
        </button>
      </div>

      {/* New Memo Form */}
      {showNewMemo && (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-5 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="font-semibold text-gray-800">New Memo</h3>
          </div>
          <input
            type="text"
            placeholder="Title (optional)"
            value={newMemo.title}
            onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <textarea
            placeholder="Write your memo... (e.g., 'Meeting tomorrow at 3pm')"
            value={newMemo.content}
            onChange={(e) => setNewMemo({ ...newMemo, content: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-3 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
          />
          <div className="flex gap-2">
            <button
              onClick={createMemo}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md hover:shadow-lg transition-all"
            >
              Save Memo
            </button>
            <button
              onClick={() => {
                setShowNewMemo(false)
                setNewMemo({ title: '', content: '' })
              }}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Memo List */}
      <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-2">
        {memos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No memos yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first memo to get started!</p>
          </div>
        ) : (
          memos.map((memo) => (
            <div key={memo.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all hover:border-blue-300 group">
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
                    <h3 className="font-bold text-lg mb-2 text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {memo.title}
                    </h3>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap mb-3 leading-relaxed">{memo.content}</p>

                  {/* Date Detection */}
                  {memo.hasDate && memo.extractedDates && memo.extractedDates.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-semibold text-blue-900">
                          Dates detected
                        </p>
                      </div>
                      <div className="space-y-2">
                        {memo.extractedDates.map((dateInfo, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  "{dateInfo.text}"
                                </span>
                              </div>
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                {new Date(dateInfo.startDate).toLocaleString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="relative group">
                              <button className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add
                              </button>
                              <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                                {calendars.map((cal) => (
                                  <button
                                    key={cal.id}
                                    onClick={() => addToCalendar(memo, dateInfo, cal.id)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 transition-colors first:pt-3 last:pb-3"
                                  >
                                    <span
                                      className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
                                      style={{ backgroundColor: cal.color }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">{cal.name}</span>
                                  </button>
                                ))}
                                {calendars.length === 0 && (
                                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
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

                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingMemo(memo.id)
                        setEditContent({ title: memo.title || '', content: memo.content })
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 font-medium transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMemo(memo.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 font-medium transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                    <span className="ml-auto text-xs text-gray-500 flex items-center gap-1 px-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(memo.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
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
