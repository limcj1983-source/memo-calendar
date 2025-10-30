import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params
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
    const { name, description, color, type, isVisible } = body

    const existingCalendar = await prisma.calendar.findUnique({
      where: {
        id: calendarId,
        userId: user.id
      }
    })

    if (!existingCalendar) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const calendar = await prisma.calendar.update({
      where: {
        id: calendarId
      },
      data: {
        name,
        description,
        color,
        type,
        isVisible
      }
    })

    return NextResponse.json(calendar)
  } catch (error) {
    console.log(error, 'CALENDAR_PATCH')
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params
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

    const existingCalendar = await prisma.calendar.findUnique({
      where: {
        id: calendarId,
        userId: user.id
      }
    })

    if (!existingCalendar) {
      return new NextResponse('Not Found', { status: 404 })
    }

    await prisma.calendar.delete({
      where: {
        id: calendarId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log(error, 'CALENDAR_DELETE')
    return new NextResponse('Internal Error', { status: 500 })
  }
}
