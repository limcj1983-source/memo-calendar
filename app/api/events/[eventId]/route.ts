import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
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
    const { title, description, startDate, endDate, allDay, calendarId } = body

    const existingEvent = await prisma.event.findUnique({
      where: {
        id: eventId
      },
      include: {
        calendar: true
      }
    })

    if (!existingEvent || existingEvent.calendar.userId !== user.id) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // If calendarId is being changed, verify new calendar belongs to user
    if (calendarId && calendarId !== existingEvent.calendarId) {
      const newCalendar = await prisma.calendar.findUnique({
        where: {
          id: calendarId,
          userId: user.id
        }
      })

      if (!newCalendar) {
        return new NextResponse('Calendar not found', { status: 404 })
      }
    }

    const event = await prisma.event.update({
      where: {
        id: eventId
      },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        allDay,
        calendarId
      },
      include: {
        calendar: true,
        memo: true
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.log(error, 'EVENT_PATCH')
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
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

    const existingEvent = await prisma.event.findUnique({
      where: {
        id: eventId
      },
      include: {
        calendar: true
      }
    })

    if (!existingEvent || existingEvent.calendar.userId !== user.id) {
      return new NextResponse('Not Found', { status: 404 })
    }

    await prisma.event.delete({
      where: {
        id: eventId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log(error, 'EVENT_DELETE')
    return new NextResponse('Internal Error', { status: 500 })
  }
}
