import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Parse ISO string to Date without timezone conversion
// Extracts local time parts and creates Date object
function parseISOAsLocal(isoString: string): Date {
  const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
  if (match) {
    const [, year, month, day, hour, minute, second] = match
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second))
  }
  return new Date(isoString)
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    })

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const calendarId = searchParams.get('calendarId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {
      calendar: {
        userId: user.id
      }
    }

    if (calendarId) {
      whereClause.calendarId = calendarId
    }

    if (startDate && endDate) {
      whereClause.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        startDate: 'asc'
      },
      include: {
        calendar: true,
        memo: true
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.log(error, 'EVENTS_GET')
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    })

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { title, description, startDate, endDate, allDay, calendarId, memoId } = body

    if (!title || !startDate || !calendarId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Verify calendar belongs to user
    const calendar = await prisma.calendar.findUnique({
      where: {
        id: calendarId,
        userId: user.id
      }
    })

    if (!calendar) {
      return new NextResponse('Calendar not found', { status: 404 })
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: parseISOAsLocal(startDate),
        endDate: endDate ? parseISOAsLocal(endDate) : null,
        allDay: allDay || false,
        calendarId,
        memoId: memoId || null
      },
      include: {
        calendar: true,
        memo: true
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.log(error, 'EVENTS_POST')
    return new NextResponse('Internal Error', { status: 500 })
  }
}
