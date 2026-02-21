import { NextRequest, NextResponse } from 'next/server'
import { calculateMonthlySalary } from '@/lib/services/salary-calculator'

/**
 * POST /api/admin/salary/calculate
 * 計算並儲存指定月份的薪資
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { month } = body

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

        const results = await calculateMonthlySalary(month)
        const totalSalary = results.reduce((sum, r) => sum + r.totalSalary, 0)

        return NextResponse.json({
            success: true,
            month,
            calculated: results.length,
            totalSalary,
            results,
        }, { status: 201 })
    } catch (error: any) {
        console.error('Error calculating salary:', error)
        return NextResponse.json(
            { error: error.message || '計算薪資失敗' },
            { status: 500 }
        )
    }
}
