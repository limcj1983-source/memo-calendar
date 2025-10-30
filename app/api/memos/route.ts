import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractDates, hasDateReferences } from '@/lib/dateParser'

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

    const memos = await prisma.memo.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        events: {
          include: {
            calendar: true
          }
        }
      }
    })

    return NextResponse.json(memos)
  } catch (error) {
    console.log(error, 'MEMOS_GET')
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
    const { title, content } = body

    if (!content) {
      return new NextResponse('Content is required', { status: 400 })
    }

    // Extract dates from content
    const extractedDates = extractDates(content)
    const hasDates = hasDateReferences(content)

    console.log('DATE EXTRACTION:', {
      content,
      hasDates,
      extractedDates: JSON.stringify(extractedDates, null, 2)
    })

    const memo = await prisma.memo.create({
      data: {
        title,
        content,
        userId: user.id,
        hasDate: hasDates,
        extractedDates: hasDates ? extractedDates : null
      },
      include: {
        events: true
      }
    })

    console.log('CREATED MEMO:', JSON.stringify(memo, null, 2))

    return NextResponse.json(memo)
  } catch (error) {
    console.log(error, 'MEMOS_POST')
    return new NextResponse('Internal Error', { status: 500 })
  }
}
