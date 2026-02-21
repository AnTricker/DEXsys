import { NextRequest, NextResponse } from 'next/server'
import { getMonthlySalarySummary } from '@/lib/services/salary-calculator'

/**
 * GET /api/admin/salary/monthly?month=2026-02
 * 查詢指定月份的薪資記錄
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month')

        if (!month) {
            return NextResponse.json(
                { error: '缺少 month 參數' },
                { status: 400 }
            )
        }

        // 驗證月份格式 (YYYY-MM)
        if (!/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json(
                { error: '月份格式錯誤,應為 YYYY-MM' },
                { status: 400 }
            )
        }

        const summary = await getMonthlySalarySummary(month)
        return NextResponse.json(summary)
    } catch (error) {
        console.error('Error fetching monthly salary:', error)
        return NextResponse.json(
            { error: '查詢薪資失敗' },
            { status: 500 }
        )
    }
}
