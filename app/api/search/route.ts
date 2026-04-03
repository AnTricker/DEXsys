import { NextRequest, NextResponse } from 'next/server'
import { getDAL } from '@/lib/dal'

/**
 * POST /api/search
 * Body: { password, teacherId, year, month }
 * 驗證密碼（Settings.SearchPwd），查詢該教練指定月份的點名+銷售紀錄
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { password, teacherId, year, month } = body

        if (!password || !teacherId || !year || !month) {
            return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })
        }

        const dal = getDAL()

        // 驗證密碼
        const correctPwd = await dal.settings.get('SearchPwd')
        if (!correctPwd || password !== correctPwd) {
            return NextResponse.json({ error: '密碼錯誤' }, { status: 401 })
        }

        // 計算月份起訖
        const paddedMonth = String(month).padStart(2, '0')
        const start = `${year}-${paddedMonth}-01`
        const lastDay = new Date(Number(year), Number(month), 0).getDate()
        const end = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`

        // 並行查詢點名 & 銷售
        const [attendances, sales] = await Promise.all([
            dal.attendances.findByCoachIdAndDateRange(teacherId, start, end),
            dal.sales.findByCoachIdAndDateRange(teacherId, start, end),
        ])

        // 取得課程名稱 map
        const courses = await dal.courses.findAll()
        const courseMap: Record<string, string> = {}
        for (const c of courses) courseMap[c.id] = c.name

        // 統一格式並合併
        type AttendanceRecord = {
            type: 'attendance'
            date: string
            courseName: string
            studentCount: number
        }
        type SalesRecord = {
            type: 'sales'
            date: string
            productName: string
            quantity: number
            totalAmount: number
        }
        type Record_ = AttendanceRecord | SalesRecord

        const records: Record_[] = [
            ...attendances.map((a) => ({
                type: 'attendance' as const,
                date: a.date,
                courseName: courseMap[a.courseId] ?? a.courseId,
                studentCount: a.studentCount,
            })),
            ...sales.map((s) => ({
                type: 'sales' as const,
                date: s.date,
                productName: s.productName,
                quantity: s.quantity,
                totalAmount: s.quantity * s.unitPrice,
            })),
        ]

        // 按日期排序；同日點名優先
        records.sort((a, b) => {
            if (a.date < b.date) return -1
            if (a.date > b.date) return 1
            // 同日：點名在前
            if (a.type === 'attendance' && b.type === 'sales') return -1
            if (a.type === 'sales' && b.type === 'attendance') return 1
            return 0
        })

        return NextResponse.json({ records })
    } catch (error) {
        console.error('Error in search:', error)
        return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
    }
}
