import { NextRequest, NextResponse } from 'next/server'
import { getDAL } from '@/lib/dal'
import {
    canEditRules,
    getOrCreateCurrentRules,
    updateRules,
    getRulesHistory,
} from '@/lib/services/rule-manager'

/**
 * GET /api/admin/rules?month=2026-02
 * 查詢指定月份的規則
 * 
 * GET /api/admin/rules (無參數)
 * 查詢當前月份的規則
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month')
        const history = searchParams.get('history')

        const dal = getDAL()

        // 查詢歷史規則
        if (history === 'true') {
            const rules = await getRulesHistory()
            return NextResponse.json({ rules })
        }

        // 查詢指定月份或當前月份
        if (month) {
            // 驗證月份格式
            if (!/^\d{4}-\d{2}$/.test(month)) {
                return NextResponse.json(
                    { error: '月份格式錯誤,應為 YYYY-MM' },
                    { status: 400 }
                )
            }

            const rule = await dal.salaryRules.findByMonth(month)
            const editable = await canEditRules(month)

            return NextResponse.json({
                rule,
                editable,
            })
        } else {
            // 取得或建立當前規則
            const rule = await getOrCreateCurrentRules()
            const currentMonth = new Date().toISOString().slice(0, 7)
            const editable = await canEditRules(currentMonth)

            return NextResponse.json({
                rule,
                editable,
            })
        }
    } catch (error) {
        console.error('Error fetching rules:', error)
        return NextResponse.json(
            { error: '查詢規則失敗' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/rules
 * 新增或更新規則
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            effectiveMonth,
            rule1to5,
            rule6to10,
            rule11to15,
            rule16Plus,
            salesBonus,
        } = body

        // 驗證必要欄位
        if (!effectiveMonth || rule1to5 === undefined || rule6to10 === undefined ||
            rule11to15 === undefined || rule16Plus === undefined ||
            salesBonus === undefined) {
            return NextResponse.json(
                { error: '缺少必要欄位' },
                { status: 400 }
            )
        }

        // 驗證月份格式
        if (!/^\d{4}-\d{2}$/.test(effectiveMonth)) {
            return NextResponse.json(
                { error: '月份格式錯誤,應為 YYYY-MM' },
                { status: 400 }
            )
        }

        // 更新規則 (帶權限檢查)
        const rule = await updateRules({
            effectiveMonth,
            rule1to5: parseFloat(rule1to5),
            rule6to10: parseFloat(rule6to10),
            rule11to15: parseFloat(rule11to15),
            rule16Plus: parseFloat(rule16Plus),
            salesBonus: parseFloat(salesBonus),
        })

        return NextResponse.json(rule, { status: 201 })
    } catch (error: any) {
        console.error('Error updating rules:', error)
        return NextResponse.json(
            { error: error.message || '更新規則失敗' },
            { status: 500 }
        )
    }
}
