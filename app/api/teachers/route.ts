import { NextRequest, NextResponse } from 'next/server'
import { getDAL } from '@/lib/dal'

/**
 * GET /api/teachers
 * 查詢所有教練
 */
export async function GET() {
    try {
        const dal = getDAL()
        const teachers = await dal.teachers.findAll()

        return NextResponse.json(teachers)
    } catch (error) {
        console.error('Error fetching teachers:', error)
        return NextResponse.json(
            { error: '查詢教練列表失敗' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/teachers
 * 建立教練
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.name || !body.email || !body.phone) {
            return NextResponse.json(
                { error: '缺少必要欄位' },
                { status: 400 }
            )
        }

        const dal = getDAL()

        const teacher = await dal.teachers.create({
            name: body.name,
            email: body.email,
            phone: body.phone,
        })

        return NextResponse.json(teacher, { status: 201 })
    } catch (error) {
        console.error('Error creating teacher:', error)
        return NextResponse.json(
            { error: '建立教練失敗' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/teachers
 * 更新教練
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

        const teacher = await dal.teachers.update(body.id, {
            name: body.name,
            email: body.email,
            phone: body.phone,
        })

        return NextResponse.json(teacher)
    } catch (error) {
        console.error('Error updating teacher:', error)
        return NextResponse.json(
            { error: '更新教練失敗' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/teachers
 * 刪除教練
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
        await dal.teachers.delete(id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting teacher:', error)
        return NextResponse.json(
            { error: '刪除教練失敗' },
            { status: 500 }
        )
    }
}
