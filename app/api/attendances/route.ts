import { NextRequest, NextResponse } from 'next/server'
import { getDAL } from '@/lib/dal'

/**
 * POST /api/attendances
 * 建立點名記錄
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // 驗證必要欄位
        if (!body.date || !body.coachId || !body.courseId || body.studentCount === undefined) {
            return NextResponse.json(
                { error: '缺少必要欄位' },
                { status: 400 }
            )
        }

        const dal = getDAL()

        // ✅ 使用 DAL,未來完全不需要改
        const attendance = await dal.attendances.create({
            date: body.date,
            coachId: body.coachId,
            courseId: body.courseId,
            studentCount: parseInt(body.studentCount),
        })

        return NextResponse.json(attendance, { status: 201 })
    } catch (error) {
        console.error('Error creating attendance:', error)
        return NextResponse.json(
            { error: '建立點名記錄失敗' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/attendances
 * 查詢點名記錄
 * 
 * Query Parameters:
 * - coachId: 教練 ID
 * - start: 開始日期 (YYYY-MM-DD)
 * - end: 結束日期 (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const coachId = searchParams.get('coachId')
        const start = searchParams.get('start')
        const end = searchParams.get('end')

        const dal = getDAL()

        let attendances

        if (coachId && start && end) {
            // 根據教練 ID 和日期範圍查詢
            attendances = await dal.attendances.findByCoachIdAndDateRange(coachId, start, end)
        } else if (coachId) {
            // 根據教練 ID 查詢
            attendances = await dal.attendances.findByCoachId(coachId)
        } else if (start && end) {
            // 根據日期範圍查詢
            attendances = await dal.attendances.findByDateRange(start, end)
        } else {
            // 查詢所有
            attendances = await dal.attendances.findAll()
        }

        return NextResponse.json(attendances)
    } catch (error) {
        console.error('Error fetching attendances:', error)
        return NextResponse.json(
            { error: '查詢點名記錄失敗' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/attendances
 * 更新點名記錄
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

        const attendance = await dal.attendances.update(body.id, {
            date: body.date,
            courseId: body.courseId,
            studentCount: body.studentCount !== undefined ? parseInt(body.studentCount) : undefined,
        })

        return NextResponse.json(attendance)
    } catch (error) {
        console.error('Error updating attendance:', error)
        return NextResponse.json(
            { error: '更新點名記錄失敗' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/attendances
 * 刪除點名記錄
 * 
 * Query Parameters:
 * - id: 點名記錄 ID
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
        await dal.attendances.delete(id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting attendance:', error)
        return NextResponse.json(
            { error: '刪除點名記錄失敗' },
            { status: 500 }
        )
    }
}
