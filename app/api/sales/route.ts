import { NextRequest, NextResponse } from 'next/server'
import { getDAL } from '@/lib/dal'

/**
 * POST /api/sales
 * 建立銷售記錄
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.date || !body.coachId || !body.productName ||
            body.quantity === undefined || body.unitPrice === undefined) {
            return NextResponse.json(
                { error: '缺少必要欄位' },
                { status: 400 }
            )
        }

        const dal = getDAL()

        const sales = await dal.sales.create({
            date: body.date,
            coachId: body.coachId,
            productName: body.productName,
            quantity: parseInt(body.quantity) || 1,
            unitPrice: parseFloat(body.unitPrice) || 0,
        })

        return NextResponse.json(sales, { status: 201 })
    } catch (error) {
        console.error('Error creating sales:', error)
        return NextResponse.json(
            { error: '建立銷售記錄失敗' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/sales
 * 查詢銷售記錄
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

        let sales

        if (coachId && start && end) {
            sales = await dal.sales.findByCoachIdAndDateRange(coachId, start, end)
        } else if (coachId) {
            sales = await dal.sales.findByCoachId(coachId)
        } else if (start && end) {
            sales = await dal.sales.findByDateRange(start, end)
        } else {
            sales = await dal.sales.findAll()
        }

        return NextResponse.json(sales)
    } catch (error) {
        console.error('Error fetching sales:', error)
        return NextResponse.json(
            { error: '查詢銷售記錄失敗' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/sales
 * 更新銷售記錄
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

        const sales = await dal.sales.update(body.id, {
            date: body.date,
            productName: body.productName,
            quantity: body.quantity !== undefined ? parseInt(body.quantity) : undefined,
            unitPrice: body.unitPrice !== undefined ? parseFloat(body.unitPrice) : undefined,
        })

        return NextResponse.json(sales)
    } catch (error) {
        console.error('Error updating sales:', error)
        return NextResponse.json(
            { error: '更新銷售記錄失敗' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/sales
 * 刪除銷售記錄
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
        await dal.sales.delete(id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting sales:', error)
        return NextResponse.json(
            { error: '刪除銷售記錄失敗' },
            { status: 500 }
        )
    }
}
