import { getDAL } from '../dal'
import type { SalaryRule, UpsertSalaryRuleDTO } from '../dal/types'

/**
 * 規則管理服務
 * 處理薪資規則的管理邏輯
 */

/**
 * 檢查規則是否可編輯
 * @param month 月份 (格式: YYYY-MM)
 * @returns 是否可編輯
 */
export async function canEditRules(month: string): Promise<boolean> {
    const dal = getDAL()
    const today = new Date()
    const currentMonth = today.toISOString().slice(0, 7) // 2026-02

    // 當月規則永遠可以編輯
    if (month === currentMonth) return true

    // 歷史月份不能編輯
    if (month < currentMonth) return false

    // 未來月份也不能編輯
    if (month > currentMonth) return false

    return true
}

/**
 * 自動鎖定上個月規則 (每日執行)
 * 應該在發薪日當天執行
 */
export async function autoLockPreviousMonthRules(): Promise<void> {
    const dal = getDAL()
    const today = new Date()

    // 取得發薪日設定
    const paymentDayStr = await dal.settings.get('PaymentDay')
    const paymentDay = parseInt(paymentDayStr || '5')

    // 如果今天是發薪日
    if (today.getDate() === paymentDay) {
        const lastMonth = new Date(today)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const lastMonthStr = lastMonth.toISOString().slice(0, 7)

        // 鎖定上個月規則
        try {
            await dal.salaryRules.lock(lastMonthStr)
            console.log(`已鎖定 ${lastMonthStr} 的薪資規則`)
        } catch (error) {
            console.error(`鎖定規則失敗:`, error)
        }
    }
}

/**
 * 取得或建立當月規則
 * 如果當月沒有規則,會複製上個月的規則
 * @returns 當月規則
 */
export async function getOrCreateCurrentRules(): Promise<SalaryRule> {
    const dal = getDAL()
    const currentMonth = new Date().toISOString().slice(0, 7)
    let rules = await dal.salaryRules.findByMonth(currentMonth)

    if (!rules) {
        // 如果當月沒有規則,複製上個月的規則
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const lastMonthStr = lastMonth.toISOString().slice(0, 7)
        const lastRules = await dal.salaryRules.findByMonth(lastMonthStr)

        if (lastRules) {
            // 複製上個月規則
            rules = await dal.salaryRules.upsert({
                effectiveMonth: currentMonth,
                rule1to5: lastRules.rule1to5,
                rule6to10: lastRules.rule6to10,
                rule11to15: lastRules.rule11to15,
                rule16Plus: lastRules.rule16Plus,
                salesBonus: lastRules.salesBonus,
            })
        } else {
            // 使用預設規則
            rules = await dal.salaryRules.upsert({
                effectiveMonth: currentMonth,
                rule1to5: 500,
                rule6to10: 800,
                rule11to15: 1200,
                rule16Plus: 1500,
                salesBonus: 10,
            })
        }
    }

    return rules
}

/**
 * 更新規則 (帶權限檢查)
 * @param data 規則資料
 * @returns 更新後的規則
 */
export async function updateRules(data: UpsertSalaryRuleDTO): Promise<SalaryRule> {
    const dal = getDAL()

    // 檢查是否可編輯
    const canEdit = await canEditRules(data.effectiveMonth)
    if (!canEdit) {
        throw new Error('無法編輯此月份的規則 (已過發薪日或規則已鎖定)')
    }

    // 更新規則
    return await dal.salaryRules.upsert(data)
}

/**
 * 取得規則歷史
 * @returns 所有規則,按月份降序排列
 */
export async function getRulesHistory(): Promise<SalaryRule[]> {
    const dal = getDAL()
    const rules = await dal.salaryRules.findAll()

    // 按月份降序排列 (最新的在前)
    return rules.sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))
}
