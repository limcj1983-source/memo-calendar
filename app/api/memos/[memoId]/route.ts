import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractDates, hasDateReferences } from '@/lib/dateParser'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ memoId: string }> }
) {
  try {
    const { memoId } = await params
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

    const memo = await prisma.memo.findUnique({
      where: {
        id: memoId,
        userId: user.id
      },
      include: {
        events: {
          include: {
            calendar: true
          }
        }
      }
    })

    if (!memo) {
      return new NextResponse('Not Found', { status: 404 })
    }

    return NextResponse.json(memo)
  } catch (error) {
    console.log(error, 'MEMO_GET')
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memoId: string }> }
) {
  try {
    const { memoId } = await params
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
    const { title, content, color } = body

    const existingMemo = await prisma.memo.findUnique({
      where: {
        id: memoId,
        userId: user.id
      }
    })

    if (!existingMemo) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // Extract dates from content
    const extractedDates = extractDates(content)
    const hasDates = hasDateReferences(content)

    const memo = await prisma.memo.update({
      where: {
        id: memoId
      },
      data: {
        title,
        content,
        color: color || existingMemo.color,
        hasDate: hasDates,
        extractedDates: hasDates ? (extractedDates as any) : undefined
      },
      include: {
        events: {
          include: {
            calendar: true
          }
        }
      }
    })

    return NextResponse.json(memo)
  } catch (error) {
    console.log(error, 'MEMO_PATCH')
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ memoId: string }> }
) {
  try {
    const { memoId } = await params
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

    const existingMemo = await prisma.memo.findUnique({
      where: {
        id: memoId,
        userId: user.id
      }
    })

    if (!existingMemo) {
      return new NextResponse('Not Found', { status: 404 })
    }

    await prisma.memo.delete({
      where: {
        id: memoId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log(error, 'MEMO_DELETE')
    return new NextResponse('Internal Error', { status: 500 })
  }
}
