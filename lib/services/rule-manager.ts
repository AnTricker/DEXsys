import { getDAL } from '../dal'
import type { SalaryRule, UpsertSalaryRuleDTO } from '../dal/types'
import { computeMonthSalaryWithRule } from './salary-calculator'

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

    const paymentDayStr = await dal.settings.get('PaymentDay')
    const paymentDay = parseInt(paymentDayStr || '5')

    if (today.getDate() === paymentDay) {
        const lastMonth = new Date(today)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const lastMonthStr = lastMonth.toISOString().slice(0, 7) // e.g. 2026-02

        // 1. 鎖定上個月 Rule
        try {
            await dal.salaryRules.lock(lastMonthStr)
            console.log(`已鎖定 ${lastMonthStr} 的薪資規則`)
        } catch (error) {
            console.error(`鎖定規則失敗:`, error)
            return // 鎖定失敗就不繼續
        }

        // 2. 確認上個月是否已封存（避免重複執行）
        const alreadyArchived = await dal.salaryRecord.hasMonth(lastMonthStr)
        if (alreadyArchived) {
            console.log(`${lastMonthStr} 已封存過，跳過`)
            return
        }

        // 3. 取得剛鎖定的 rule（確保用鎖定版）
        const rule = await dal.salaryRules.findByMonth(lastMonthStr)
        if (!rule) {
            console.error(`找不到 ${lastMonthStr} 的 Rule，無法封存薪資`)
            return
        }

        // 4. 重新計算上個月所有教練薪資（純計算，不寫 MonthlySalary）
        const lockedAt = new Date()
        const rawSalaries = await computeMonthSalaryWithRule(lastMonthStr, rule)

        // 5. Append 到 SalaryRecord
        await dal.salaryRecord.appendBatch(
            rawSalaries.map(s => ({ ...s, month: lastMonthStr, lockedAt }))
        )

        console.log(`已封存 ${lastMonthStr} 薪資快照（${rawSalaries.length} 位教練）`)
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
                baseRateZero: lastRules.baseRateZero,
                baseRate1toN: lastRules.baseRate1toN,
                tierStartAtNplus1: lastRules.tierStartAtNplus1,
                tierStep: lastRules.tierStep,
                tierBonus: lastRules.tierBonus,
                bonus5Card: lastRules.bonus5Card,
                bonus10Card: lastRules.bonus10Card,
            })
        } else {
            // 使用預設規則
            rules = await dal.salaryRules.upsert({
                effectiveMonth: currentMonth,
                baseRateZero: 300,
                baseRate1toN: 500,
                tierStartAtNplus1: 5,
                tierStep: 5,
                tierBonus: 100,
                bonus5Card: 100,
                bonus10Card: 200,
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
