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
  const [searchQuery, setSearchQuery] = useState('')
  const [filterByDate, setFilterByDate] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

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
        setMemos(prevMemos => [memo, ...prevMemos])
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
        setMemos(prevMemos => prevMemos.map(m => m.id === id ? updatedMemo : m))
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
        // 편집 모드 리셋
        if (editingMemo === id) {
          setEditingMemo(null)
        }
        // 함수형 업데이트로 최신 상태 보장
        setMemos(prevMemos => prevMemos.filter(m => m.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete memo:', error)
    }
  }

  // Remove only date expression, keep time
  const removeDateExpression = (text: string): string => {
    // Remove Korean date patterns: 내일, 모레, N일 후, N월 N일, etc.
    let cleaned = text
      .replace(/내일\s*/g, '')
      .replace(/모레\s*/g, '')
      .replace(/\d+일\s*후\s*/g, '')
      .replace(/다음\s*주\s*[월화수목금토일]요일\s*/g, '')
      .replace(/\d{1,2}월\s*\d{1,2}일\s*/g, '')
      .replace(/\d{1,2}[.\/\-]\d{1,2}\s*/g, '')

    // Clean up extra spaces
    return cleaned.replace(/\s+/g, ' ').trim()
  }

  const addToCalendar = async (memo: Memo, dateInfo: ExtractedDate, calendarId: string) => {
    try {
      // Remove date expression from title
      const originalTitle = memo.title || memo.content.substring(0, 50)
      const cleanTitle = removeDateExpression(originalTitle)

      // Also clean description
      const cleanDescription = removeDateExpression(memo.content)

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle || originalTitle, // Fallback to original if empty
          description: cleanDescription || memo.content,
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

  // Filter memos based on search query and date filter
  const filteredMemos = memos.filter(memo => {
    const matchesSearch = searchQuery === '' ||
      memo.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDateFilter = !filterByDate || memo.hasDate

    return matchesSearch && matchesDateFilter
  })

  if (loading) {
    return <div className="text-center py-8">Loading memos...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Memos</h2>
          <p className="text-xs sm:text-sm text-gray-500">{filteredMemos.length} of {memos.length} notes</p>
        </div>
        <button
          onClick={() => setShowNewMemo(true)}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all text-sm font-medium flex items-center justify-center gap-2 touch-manipulation"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Memo
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search memos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterByDate(!filterByDate)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 touch-manipulation ${
                filterByDate
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">With Dates</span>
              <span className="sm:hidden">Dates</span>
            </button>
            {(searchQuery || filterByDate) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterByDate(false)
                }}
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all touch-manipulation"
                title="Clear filters"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* New Memo Form */}
      {showNewMemo && (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-4 sm:p-5 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">New Memo</h3>
          </div>
          <input
            type="text"
            placeholder="Title (optional)"
            value={newMemo.title}
            onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg mb-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <textarea
            placeholder="Write your memo... (e.g., 'Meeting tomorrow at 3pm')"
            value={newMemo.content}
            onChange={(e) => setNewMemo({ ...newMemo, content: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg mb-3 h-32 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
          />
          <div className="flex gap-2">
            <button
              onClick={createMemo}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-sm sm:text-base font-medium shadow-md hover:shadow-lg transition-all touch-manipulation"
            >
              Save Memo
            </button>
            <button
              onClick={() => {
                setShowNewMemo(false)
                setNewMemo({ title: '', content: '' })
              }}
              className="px-3 sm:px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 text-sm sm:text-base font-medium transition-colors touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Memo List */}
      <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-2">
        {filteredMemos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">{memos.length === 0 ? 'No memos yet' : 'No memos found'}</p>
            <p className="text-gray-400 text-sm mt-1">{memos.length === 0 ? 'Create your first memo to get started!' : 'Try adjusting your search or filters'}</p>
          </div>
        ) : (
          filteredMemos.map((memo) => (
            <div key={memo.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all hover:border-blue-300 group">
              {editingMemo === memo.id ? (
                <div>
                  <input
                    type="text"
                    value={editContent.title}
                    onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={editContent.content}
                    onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 h-32 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMemo(memo.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 text-sm font-medium touch-manipulation"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMemo(null)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 active:bg-gray-500 text-sm font-medium touch-manipulation"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {memo.title && (
                    <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-800 flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {memo.title}
                    </h3>
                  )}
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap mb-3 leading-relaxed">{memo.content}</p>

                  {/* Date Detection */}
                  {memo.hasDate && memo.extractedDates && memo.extractedDates.length > 0 && (
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs sm:text-sm font-semibold text-blue-900">
                          Dates detected
                        </p>
                      </div>
                      <div className="space-y-2">
                        {memo.extractedDates.map((dateInfo, idx) => {
                          const dropdownId = `${memo.id}-${idx}`
                          return (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between bg-white p-2.5 sm:p-3 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  "{dateInfo.text}"
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                {(() => {
                                  // Parse ISO string directly to avoid timezone conversion
                                  const isoDate = dateInfo.startDate
                                  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
                                  if (match) {
                                    const [, year, month, day, hour, minute] = match
                                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))
                                    return date.toLocaleString('ko-KR', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  }
                                  return new Date(dateInfo.startDate).toLocaleString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                })()}
                              </span>
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => setOpenDropdown(openDropdown === dropdownId ? null : dropdownId)}
                                className="w-full sm:w-auto px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs sm:text-sm hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 touch-manipulation"
                              >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add to Calendar
                              </button>
                              {openDropdown === dropdownId && (
                                <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                                  {calendars.map((cal) => (
                                    <button
                                      key={cal.id}
                                      onClick={() => {
                                        addToCalendar(memo, dateInfo, cal.id)
                                        setOpenDropdown(null)
                                      }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 flex items-center gap-2 transition-colors first:pt-3 last:pb-3 touch-manipulation"
                                    >
                                      <span
                                        className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm flex-shrink-0"
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
                              )}
                            </div>
                          </div>
                        )}
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4 pt-3 border-t border-gray-100">
                    <div className="flex gap-2 flex-1">
                      <button
                        onClick={() => {
                          setEditingMemo(memo.id)
                          setEditContent({ title: memo.title || '', content: memo.content })
                        }}
                        className="flex-1 sm:flex-none px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 active:bg-gray-300 font-medium transition-colors flex items-center justify-center gap-1 touch-manipulation"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMemo(memo.id)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs sm:text-sm hover:bg-red-100 active:bg-red-200 font-medium transition-colors flex items-center justify-center gap-1 touch-manipulation"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center justify-center sm:justify-end gap-1 px-2">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
