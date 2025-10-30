'use client'

import { useState, useEffect } from 'react'

interface Calendar {
  id: string
  name: string
  description?: string
  color: string
  type: string
  isVisible: boolean
  _count?: {
    events: number
  }
}

interface Event {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  allDay: boolean
  calendar: Calendar
}

const CALENDAR_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
]

const CALENDAR_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'school', label: 'School' },
  { value: 'family', label: 'Family' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
]

interface CalendarViewProps {
  refreshKey?: number
}

type ViewMode = 'month' | 'week' | 'day'

export default function CalendarView({ refreshKey }: CalendarViewProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [showNewCalendar, setShowNewCalendar] = useState(false)
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    description: '',
    color: CALENDAR_COLORS[0],
    type: 'personal'
  })
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: false,
    calendarId: ''
  })
  const [editEvent, setEditEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    calendarId: ''
  })

  useEffect(() => {
    fetchCalendars()
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [currentDate, refreshKey])

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

  const fetchEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)

      const res = await fetch(
        `/api/events?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
      )
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const createCalendar = async () => {
    if (!newCalendar.name.trim()) return

    try {
      const res = await fetch('/api/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCalendar)
      })

      if (res.ok) {
        const calendar = await res.json()
        setCalendars([...calendars, calendar])
        setNewCalendar({
          name: '',
          description: '',
          color: CALENDAR_COLORS[0],
          type: 'personal'
        })
        setShowNewCalendar(false)
      }
    } catch (error) {
      console.error('Failed to create calendar:', error)
    }
  }

  const toggleCalendarVisibility = async (calendarId: string, currentVisibility: boolean) => {
    try {
      const res = await fetch(`/api/calendars/${calendarId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !currentVisibility })
      })

      if (res.ok) {
        const updated = await res.json()
        setCalendars(calendars.map(c => c.id === calendarId ? updated : c))
      }
    } catch (error) {
      console.error('Failed to toggle calendar:', error)
    }
  }

  const deleteCalendar = async (calendarId: string) => {
    if (!confirm('Delete this calendar and all its events?')) return

    try {
      const res = await fetch(`/api/calendars/${calendarId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setCalendars(calendars.filter(c => c.id !== calendarId))
        setEvents(events.filter(e => e.calendar.id !== calendarId))
      }
    } catch (error) {
      console.error('Failed to delete calendar:', error)
    }
  }

  const createEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.startDate || !newEvent.calendarId) return

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      })

      if (res.ok) {
        const event = await res.json()
        setEvents([...events, event])
        setNewEvent({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          allDay: false,
          calendarId: ''
        })
        setShowNewEvent(false)
      }
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setEvents(events.filter(e => e.id !== eventId))
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const updateEvent = async () => {
    if (!selectedEvent || !editEvent.title.trim() || !editEvent.startDate || !editEvent.calendarId) return

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editEvent)
      })

      if (res.ok) {
        const updated = await res.json()
        setEvents(events.map(e => e.id === selectedEvent.id ? updated : e))
        setSelectedEvent(null)
        setIsEditingEvent(false)
      }
    } catch (error) {
      console.error('Failed to update event:', error)
    }
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsEditingEvent(false)
    setEditEvent({
      title: event.title,
      description: event.description || '',
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
      calendarId: event.calendar.id
    })
  }

  const startEditingEvent = () => {
    setIsEditingEvent(true)
  }

  const cancelEditingEvent = () => {
    if (selectedEvent) {
      setEditEvent({
        title: selectedEvent.title,
        description: selectedEvent.description || '',
        startDate: new Date(selectedEvent.startDate).toISOString().slice(0, 16),
        endDate: selectedEvent.endDate ? new Date(selectedEvent.endDate).toISOString().slice(0, 16) : '',
        calendarId: selectedEvent.calendar.id
      })
    }
    setIsEditingEvent(false)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return events.filter(event => {
      const eventDate = new Date(event.startDate)
      return eventDate.toDateString() === date.toDateString() &&
             calendars.find(c => c.id === event.calendar.id)?.isVisible
    })
  }

  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 1)
      setCurrentDate(newDate)
    }
  }

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 1)
      setCurrentDate(newDate)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate)
      return eventDate.toDateString() === date.toDateString() &&
             calendars.find(c => c.id === event.calendar.id)?.isVisible
    })
  }

  const getEventsForTimeSlot = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate)
      return eventStart.toDateString() === date.toDateString() &&
             eventStart.getHours() === hour &&
             calendars.find(c => c.id === event.calendar.id)?.isVisible
    })
  }

  const getCurrentViewTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' })
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays()
      return `${weekDays[0].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calendar</h2>
          <p className="text-sm text-gray-500">{events.length} events this month</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewEvent(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Event
          </button>
          <button
            onClick={() => setShowNewCalendar(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Calendar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Calendars */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
            <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Calendars
            </h3>
            <div className="space-y-2">
              {calendars.map((calendar) => (
                <div key={calendar.id} className="flex items-center gap-2 p-2.5 hover:bg-gray-50 rounded-lg transition-colors group">
                  <input
                    type="checkbox"
                    checked={calendar.isVisible}
                    onChange={() => toggleCalendarVisibility(calendar.id, calendar.isVisible)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-700 truncate">{calendar.name}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                    {calendar._count?.events || 0}
                  </span>
                  <button
                    onClick={() => deleteCalendar(calendar.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {calendars.length === 0 && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">No calendars yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Calendar View */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPrevious}
                  className="p-2 hover:bg-white rounded-lg font-bold text-gray-700 hover:text-blue-600 transition-all shadow-sm hover:shadow"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold min-w-[240px] text-center text-gray-800">
                  {getCurrentViewTitle()}
                </h3>
                <button
                  onClick={goToNext}
                  className="p-2 hover:bg-white rounded-lg font-bold text-gray-700 hover:text-blue-600 transition-all shadow-sm hover:shadow"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm bg-white hover:bg-blue-50 rounded-lg font-medium text-gray-700 hover:text-blue-600 border border-gray-200 transition-all shadow-sm"
                >
                  Today
                </button>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      viewMode === 'month'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      viewMode === 'week'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      viewMode === 'day'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Day
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Month View */}
              {viewMode === 'month' && (
                <>
                  {/* Day Labels */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {getDaysInMonth().map((day, index) => {
                      const isToday = day &&
                        new Date().toDateString() ===
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

                      return (
                        <div
                          key={index}
                          className={`min-h-[100px] border rounded-lg p-2 ${
                            day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                          } ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}`}
                        >
                          {day && (
                            <>
                              <div className={`text-sm font-semibold mb-1 ${
                                isToday ? 'text-blue-600' : 'text-gray-700'
                              }`}>
                                {day}
                              </div>
                              <div className="space-y-1">
                                {getEventsForDay(day).map(event => (
                                  <div
                                    key={event.id}
                                    className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ backgroundColor: event.calendar.color + '20', borderLeft: `3px solid ${event.calendar.color}` }}
                                    onClick={() => handleEventClick(event)}
                                  >
                                    <div className="font-medium truncate">{event.title}</div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Week View */}
              {viewMode === 'week' && (
                <>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {getWeekDays().map((day, idx) => {
                      const isToday = day.toDateString() === new Date().toDateString()
                      const dayNames = ['일', '월', '화', '수', '목', '금', '토']
                      return (
                        <div key={idx} className="text-center">
                          <div className="text-xs text-gray-600">
                            {dayNames[day.getDay()]}
                          </div>
                          <div className={`text-lg font-semibold ${
                            isToday ? 'text-blue-600' : 'text-gray-800'
                          }`}>
                            {day.getDate()}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Time Slots */}
                  <div className="grid grid-cols-7 gap-2">
                    {getWeekDays().map((day, dayIdx) => (
                      <div key={dayIdx} className="space-y-1">
                        {Array.from({ length: 24 }, (_, hour) => {
                          const eventsInSlot = getEventsForTimeSlot(day, hour)
                          return (
                            <div key={hour} className="min-h-[40px] border-t border-gray-100 p-1">
                              {hour === 0 && <div className="text-xs text-gray-400">{hour}:00</div>}
                              {eventsInSlot.map(event => (
                                <div
                                  key={event.id}
                                  className="text-xs p-1 rounded cursor-pointer hover:opacity-80 mb-1"
                                  style={{ backgroundColor: event.calendar.color + '20', borderLeft: `3px solid ${event.calendar.color}` }}
                                  onClick={() => handleEventClick(event)}
                                >
                                  <div className="font-medium truncate">{event.title}</div>
                                  <div className="text-xs text-gray-600">
                                    {new Date(event.startDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Day View */}
              {viewMode === 'day' && (
                <div className="max-h-[600px] overflow-y-auto">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const eventsInSlot = getEventsForTimeSlot(currentDate, hour)
                    return (
                      <div key={hour} className="flex border-b border-gray-200 min-h-[60px]">
                        <div className="w-20 flex-shrink-0 p-2 text-sm text-gray-600 font-medium">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="flex-1 p-2 space-y-1">
                          {eventsInSlot.map(event => (
                            <div
                              key={event.id}
                              className="p-2 rounded cursor-pointer hover:opacity-80"
                              style={{ backgroundColor: event.calendar.color + '20', borderLeft: `4px solid ${event.calendar.color}` }}
                              onClick={() => handleEventClick(event)}
                            >
                              <div className="font-semibold">{event.title}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(event.startDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                {event.endDate && ` - ${new Date(event.endDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
                              </div>
                              {event.description && (
                                <div className="text-sm text-gray-500 mt-1">{event.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Calendar Modal */}
      {showNewCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">New Calendar</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Work, Personal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newCalendar.type}
                  onChange={(e) => setNewCalendar({ ...newCalendar, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {CALENDAR_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex gap-2">
                  {CALENDAR_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCalendar({ ...newCalendar, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCalendar.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={createCalendar}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewCalendar(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {showNewEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">New Event</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Calendar</label>
                <select
                  value={newEvent.calendarId}
                  onChange={(e) => setNewEvent({ ...newEvent, calendarId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select calendar</option>
                  {calendars.map(cal => (
                    <option key={cal.id} value={cal.id}>{cal.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-20"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={createEvent}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Event
                </button>
                <button
                  onClick={() => setShowNewEvent(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold">Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {isEditingEvent ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={editEvent.title}
                    onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Calendar</label>
                  <select
                    value={editEvent.calendarId}
                    onChange={(e) => setEditEvent({ ...editEvent, calendarId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {calendars.map(cal => (
                      <option key={cal.id} value={cal.id}>{cal.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editEvent.startDate}
                    onChange={(e) => setEditEvent({ ...editEvent, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={editEvent.endDate}
                    onChange={(e) => setEditEvent({ ...editEvent, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editEvent.description}
                    onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={updateEvent}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEditingEvent}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-3">{selectedEvent.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedEvent.calendar.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{selectedEvent.calendar.name}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="font-medium text-gray-600 w-16">Start:</span>
                    <span className="text-gray-800">
                      {new Date(selectedEvent.startDate).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {selectedEvent.endDate && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="font-medium text-gray-600 w-16">End:</span>
                      <span className="text-gray-800">
                        {new Date(selectedEvent.endDate).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {selectedEvent.description && (
                  <div>
                    <span className="block font-medium text-gray-600 text-sm mb-1">Description</span>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={startEditingEvent}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEvent(selectedEvent.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
