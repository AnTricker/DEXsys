import { NextRequest, NextResponse } from 'next/server'
import { getDAL } from '@/lib/dal'

/**
 * GET /api/courses
 * 查詢所有課程
 */
export async function GET() {
    try {
        const dal = getDAL()
        const courses = await dal.courses.findAll()

        return NextResponse.json(courses)
    } catch (error) {
        console.error('Error fetching courses:', error)
        return NextResponse.json(
            { error: '查詢課程列表失敗' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/courses
 * 建立課程
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.name || !body.description) {
            return NextResponse.json(
                { error: '缺少必要欄位' },
                { status: 400 }
            )
        }

        const dal = getDAL()

        const course = await dal.courses.create({
            name: body.name,
            description: body.description,
        })

        return NextResponse.json(course, { status: 201 })
    } catch (error) {
        console.error('Error creating course:', error)
        return NextResponse.json(
            { error: '建立課程失敗' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/courses
 * 更新課程
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.id) {
            return NextResponse.json(
                { error: '缺少 ID' },
                { status: 400 }
            )
        }

        const dal = getDAL()

        const course = await dal.courses.update(body.id, {
            name: body.name,
            description: body.description,
        })

        return NextResponse.json(course)
    } catch (error) {
        console.error('Error updating course:', error)
        return NextResponse.json(
            { error: '更新課程失敗' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/courses
 * 刪除課程
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: '缺少 ID' },
                { status: 400 }
            )
        }

        const dal = getDAL()
        await dal.courses.delete(id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting course:', error)
        return NextResponse.json(
            { error: '刪除課程失敗' },
            { status: 500 }
        )
    }
}
