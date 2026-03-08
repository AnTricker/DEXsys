import { getDAL } from '../dal'
import type { SalaryRule, MonthlySalary } from '../dal/types'
import { calculateSalaryByRule, getSaleBonusAmount } from '../utils/salary-calc'

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
/**
 * 純計算：給定 teacherId/month/rules，回傳薪資數字，不寫任何 Sheet
 * 供 rule-manager 鎖定存檔時使用
 */
export async function computeTeacherSalaryRaw(
    teacherId: string,
    teacherName: string,
    month: string,
    rules: SalaryRule
) {
    const dal = getDAL()
    const startDate = `${month}-01`
    const endDate = getMonthEndDate(month)

    const attendances = await dal.attendances.findByCoachIdAndDateRange(teacherId, startDate, endDate)

    let attendanceSalary = 0
    let totalClasses = 0
    let totalStudents = 0
    for (const att of attendances) {
        attendanceSalary += calculateSalaryByRule(att.studentCount, rules)
        totalClasses++
        totalStudents += att.studentCount
    }

    const sales = await dal.sales.findByCoachIdAndDateRange(teacherId, startDate, endDate)

    let salesSalary = 0
    for (const sale of sales) {
        salesSalary += getSaleBonusAmount(sale.productName, sale.quantity, rules)
    }

    return {
        teacherId,
        teacherName,
        totalClasses,
        totalStudents,
        attendanceSalary,
        salesSalary,
        totalSalary: attendanceSalary + salesSalary,
    }
}

/**
 * 針對指定月份 + 指定 rules，計算所有教練薪資（不寫 MonthlySalary）
 * 用於 Rule 鎖定時的快照計算
 */
export async function computeMonthSalaryWithRule(month: string, rules: SalaryRule) {
    const dal = getDAL()
    const teachers = await dal.teachers.findAll()
    return await Promise.all(
        teachers.map(t => computeTeacherSalaryRaw(t.id, t.name, month, rules))
    )
}

async function calculateTeacherSalary(
    teacherId: string,
    teacherName: string,
    month: string,
    rules: SalaryRule
): Promise<MonthlySalary> {
    const dal = getDAL()
    const raw = await computeTeacherSalaryRaw(teacherId, teacherName, month, rules)

    // 儲存到動態草稿表
    return await dal.monthlySalary.upsert({
        month,
        ...raw,
    })
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
 * 查詢指定月份的薪資統計
 * 確保所有教練都出現，沒有記錄的補 0
 */
export async function getMonthlySalarySummary(month: string) {
    const dal = getDAL()

    // 同時取存檔薪資 & 所有教練
    const [storedSalaries, teachers] = await Promise.all([
        dal.monthlySalary.findByMonth(month),
        dal.teachers.findAll(),
    ])

    // 建立 teacherId → salary 的 map
    const salaryMap = new Map(storedSalaries.map(s => [s.teacherId, s]))

    // 對每個教練：有記錄就用，沒有就補全 0
    const salaries = teachers.map(teacher => {
        if (salaryMap.has(teacher.id)) {
            return salaryMap.get(teacher.id)!
        }
        return {
            id: '',
            month,
            teacherId: teacher.id,
            teacherName: teacher.name,
            totalClasses: 0,
            totalStudents: 0,
            attendanceSalary: 0,
            salesSalary: 0,
            totalSalary: 0,
            createdAt: new Date(),
            updatedAt: undefined,
        }
    })

    return {
        month,
        salaries,
        totalSalary: salaries.reduce((sum, s) => sum + s.totalSalary, 0),
        totalClasses: salaries.reduce((sum, s) => sum + s.totalClasses, 0),
        totalTeachers: salaries.length,
    }
}
