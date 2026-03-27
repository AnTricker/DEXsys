import { NextResponse } from 'next/server'
import { getDAL } from '@/lib/dal'

/**
 * GET /api/salary-rules/current
 * 取得當前月份的薪資規則
 */
export async function GET() {
    try {
        const dal = getDAL()
        const rules = await dal.salaryRules.getCurrent()

        if (!rules) {
            return NextResponse.json(null)
        }

        return NextResponse.json(rules)
    } catch (error) {
        console.error('Error fetching current salary rules:', error)
        return NextResponse.json(
            { error: '查詢薪資規則失敗' },
            { status: 500 }
        )
    }
}
