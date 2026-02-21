import { getDAL } from '../dal'
import type { SalaryRule, MonthlySalary } from '../dal/types'

/**
 * 薪資計算服務
 * 處理月薪資的計算邏輯
 */

/**
 * 計算指定月份的薪資
 * @param month 月份 (格式: YYYY-MM)
 * @returns 計算結果
 */
export async function calculateMonthlySalary(month: string): Promise<MonthlySalary[]> {
    const dal = getDAL()

    // 1. 取得該月規則
    const rules = await dal.salaryRules.findByMonth(month)
    if (!rules) {
        throw new Error(`該月份 (${month}) 沒有設定薪資規則`)
    }

    // 2. 取得所有教練
    const teachers = await dal.teachers.findAll()
    if (teachers.length === 0) {
        throw new Error('沒有教練資料')
    }

    // 3. 清除舊的計算結果 (如果有)
    await dal.monthlySalary.deleteByMonth(month)

    // 4. 對每個教練計算薪資
    const results: MonthlySalary[] = []
    for (const teacher of teachers) {
        const salary = await calculateTeacherSalary(teacher.id, teacher.name, month, rules)
        results.push(salary)
    }

    return results
}

/**
 * 計算單一教練的月薪資
 * @param teacherId 教練 ID
 * @param teacherName 教練姓名
 * @param month 月份
 * @param rules 薪資規則
 * @returns 薪資記錄
 */
async function calculateTeacherSalary(
    teacherId: string,
    teacherName: string,
    month: string,
    rules: SalaryRule
): Promise<MonthlySalary> {
    const dal = getDAL()

    // 計算月份的開始和結束日期
    const startDate = `${month}-01`
    const endDate = getMonthEndDate(month)

    // 1. 取得該月點名記錄
    const attendances = await dal.attendances.findByCoachIdAndDateRange(
        teacherId,
        startDate,
        endDate
    )

    // 2. 計算點名薪資
    let attendanceSalary = 0
    let totalClasses = 0
    let totalStudents = 0

    for (const att of attendances) {
        attendanceSalary += calculateSalaryByRule(att.studentCount, rules)
        totalClasses++
        totalStudents += att.studentCount
    }

    // 3. 取得該月銷售記錄
    const sales = await dal.sales.findByCoachIdAndDateRange(
        teacherId,
        startDate,
        endDate
    )

    // 4. 計算銷售獎金 (依課卡類型 × 數量)
    let salesSalary = 0
    for (const sale of sales) {
        salesSalary += getSaleBonusAmount(sale.productName, sale.quantity)
    }

    // 5. 儲存結果
    return await dal.monthlySalary.upsert({
        month,
        teacherId,
        teacherName,
        totalClasses,
        totalStudents,
        attendanceSalary,
        salesSalary,
        totalSalary: attendanceSalary + salesSalary,
    })
}

/**
 * 根據人數計算薪資
 * @param studentCount 學員人數
 * @param rules 薪資規則
 * @returns 薪資金額
 */
function calculateSalaryByRule(studentCount: number, rules: SalaryRule): number {
    if (studentCount <= 5) return rules.rule1to5
    if (studentCount <= 10) return rules.rule6to10
    if (studentCount <= 15) return rules.rule11to15
    return rules.rule16Plus
}

/**
 * 取得月份的最後一天
 * @param month 月份 (格式: YYYY-MM)
 * @returns 日期字串 (格式: YYYY-MM-DD)
 */
function getMonthEndDate(month: string): string {
    const [year, monthNum] = month.split('-').map(Number)
    const lastDay = new Date(year, monthNum, 0).getDate()
    return `${month}-${String(lastDay).padStart(2, '0')}`
}

/**
 * 根據商品名稱計算銷售獎金
 * 十堂卡: $200 × 數量
 * 五堂卡: $100 × 數量
 * 單堂卡 / 額外銷售: 無獎金
 */
function getSaleBonusAmount(productName: string, quantity: number): number {
    if (productName.includes('十堂卡')) return 200 * quantity
    if (productName.includes('五堂卡')) return 100 * quantity
    return 0
}

/**
 * 查詢指定月份的薪資統計
 * @param month 月份 (格式: YYYY-MM)
 * @returns 薪資記錄和統計資訊
 */
export async function getMonthlySalarySummary(month: string) {
    const dal = getDAL()
    const salaries = await dal.monthlySalary.findByMonth(month)

    const summary = {
        month,
        salaries,
        totalSalary: salaries.reduce((sum, s) => sum + s.totalSalary, 0),
        totalClasses: salaries.reduce((sum, s) => sum + s.totalClasses, 0),
        totalTeachers: salaries.length,
    }

    return summary
}
