import type { SalaryRule } from '../dal/types'

/**
 * 根據人數 + SalaryRule 計算該堂薪資（梯進式）
 *
 * 0人       → baseRateZero（車資補償）
 * 1 ~ (tierStartAtNplus1-1) → baseRate1toN（底薪）
 * ≥ tierStartAtNplus1 → baseRate1toN + ceil((count - tierStartAtNplus1 + 1) / tierStep) × tierBonus
 *
 * 預設值驗算：
 *   0人  → 300
 *   4人  → 500
 *   5人  → ceil((5-5+1)/5)=1 → 500+100=600 ✓
 *   9人  → ceil((9-5+1)/5)=1 → 500+100=600 ✓
 *  10人  → ceil((10-5+1)/5)=2 → 500+200=700 ✓
 */
export function calculateSalaryByRule(studentCount: number, rules: SalaryRule): number {
    if (studentCount === 0) return rules.baseRateZero
    if (studentCount < rules.tierStartAtNplus1) return rules.baseRate1toN
    const tiers = Math.ceil((studentCount - rules.tierStartAtNplus1 + 1) / rules.tierStep)
    return rules.baseRate1toN + tiers * rules.tierBonus
}

/**
 * 根據商品名稱計算銷售獎金
 * 十堂卡: bonus10Card × 數量
 * 五堂卡: bonus5Card  × 數量
 * 單堂卡 / 額外銷售: 無獎金
 */
export function getSaleBonusAmount(productName: string, quantity: number, rules: SalaryRule): number {
    if (productName.includes('十堂卡')) return rules.bonus10Card * quantity
    if (productName.includes('五堂卡')) return rules.bonus5Card * quantity
    return 0
}
