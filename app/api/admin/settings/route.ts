import { NextRequest, NextResponse } from 'next/server'
import { getDAL } from '@/lib/dal'

/**
 * GET /api/admin/settings
 * 取得所有系統設定
 */
export async function GET(request: NextRequest) {
    try {
        const dal = getDAL()
        const settings = await dal.settings.getAll()

        return NextResponse.json({ settings })
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json(
            { error: '查詢設定失敗' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/admin/settings
 * 更新系統設定
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const dal = getDAL()

        // 批次更新設定
        await dal.settings.setMany(body)

        return NextResponse.json({
            success: true,
            message: '設定已更新',
        })
    } catch (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json(
            { error: '更新設定失敗' },
            { status: 500 }
        )
    }
}
