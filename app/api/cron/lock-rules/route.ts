import { NextRequest, NextResponse } from 'next/server'
import { autoLockPreviousMonthRules } from '@/lib/services/rule-manager'

/**
 * GET /api/cron/lock-rules
 *
 * 每天由 Vercel Cron 呼叫（建議設為每月 PaymentDay 的午夜）
 * 流程：
 *   1. 鎖定上個月的 SalaryRule
 *   2. 用鎖定的 rule 重算上個月薪資
 *   3. Append 到 SalaryRecord（永久歷史）
 *
 * 也可在 Admin Dashboard 手動觸發
 */
export async function GET(request: NextRequest) {
    // Vercel Cron 會帶 Authorization header，防止外部直接呼叫
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await autoLockPreviousMonthRules()
        return NextResponse.json({ ok: true, message: '鎖定與封存完成' })
    } catch (error: any) {
        console.error('Cron lock-rules error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
