import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const calendars = await prisma.calendar.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        _count: {
          select: {
            events: true
          }
        }
      }
    })

    return NextResponse.json(calendars)
  } catch (error) {
    console.log(error, 'CALENDARS_GET')
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
    const { name, description, color, type } = body

    if (!name) {
      return new NextResponse('Name is required', { status: 400 })
    }

    const calendar = await prisma.calendar.create({
      data: {
        name,
        description,
        color: color || '#3b82f6',
        type: type || 'personal',
        userId: user.id
      }
    })

    return NextResponse.json(calendar)
  } catch (error) {
    console.log(error, 'CALENDARS_POST')
    return new NextResponse('Internal Error', { status: 500 })
  }
}
