import { google } from 'googleapis'
import type {
    SalaryRule,
    UpsertSalaryRuleDTO,
    ISalaryRulesRepository,
} from '../types'

/**
 * Google Sheets 薪資規則 Repository 實作
 *
 * Sheet 欄位對應 (A–L):
 *   A: ID
 *   B: EffectiveMonth
 *   C: BaseRateZero   (0人費率)
 *   D: BaseRate1to4   (1-4人費率)
 *   E: TierStartAt    (梯進起始人數)
 *   F: TierStep       (每幾人升一階)
 *   G: TierBonus      (每階加多少)
 *   H: Bonus5Card     (五堂卡每張抽成)
 *   I: Bonus10Card    (十堂卡每張抽成)
 *   J: IsLocked
 *   K: LockedAt
 *   L: CreatedAt
 */
export class SheetsSalaryRulesRepository implements ISalaryRulesRepository {
    private spreadsheetId: string

    constructor(spreadsheetId: string) {
        this.spreadsheetId = spreadsheetId
    }

    /**
     * 取得 Google Sheets 認證
     */
    private async getAuth() {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })
        return auth
    }

    /**
     * 查詢指定月份的規則
     */
    async findByMonth(month: string): Promise<SalaryRule | null> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'SalaryRules!A2:L',
        })

        const rows = response.data.values || []
        const row = rows.find(r => r[1] === month)

        return row ? this.rowToSalaryRule(row) : null
    }

    /**
     * 查詢當前月份的規則
     */
    async getCurrent(): Promise<SalaryRule | null> {
        const currentMonth = new Date().toISOString().slice(0, 7)
        return this.findByMonth(currentMonth)
    }

    /**
     * 新增或更新規則
     */
    async upsert(data: UpsertSalaryRuleDTO): Promise<SalaryRule> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const existing = await this.findByMonth(data.effectiveMonth)

        const buildRow = (id: string, isLocked: boolean, lockedAt: string, createdAt: string) => [
            id,
            data.effectiveMonth,
            data.baseRateZero,
            data.baseRate1toN,
            data.tierStartAtNplus1,
            data.tierStep,
            data.tierBonus,
            data.bonus5Card,
            data.bonus10Card,
            isLocked,
            lockedAt,
            createdAt,
        ]

        if (existing) {
            const rowIndex = await this.findRowIndex(existing.id)
            if (rowIndex === -1) throw new Error('找不到要更新的規則')

            await sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `SalaryRules!A${rowIndex}:L${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [buildRow(
                        existing.id,
                        existing.isLocked,
                        existing.lockedAt ? existing.lockedAt.toISOString() : '',
                        existing.createdAt.toISOString(),
                    )],
                },
            })

            return { ...existing, ...data }
        } else {
            const id = 'SR' + Date.now()
            const now = new Date().toISOString()

            await sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'SalaryRules!A:L',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [buildRow(id, false, '', now)],
                },
            })

            return {
                id,
                ...data,
                isLocked: false,
                lockedAt: null,
                createdAt: new Date(now),
            }
        }
    }

    /**
     * 鎖定規則（IsLocked=J, LockedAt=K → col J:K → 位置不變）
     */
    async lock(month: string): Promise<void> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const rule = await this.findByMonth(month)
        if (!rule) throw new Error('找不到要鎖定的規則')

        const rowIndex = await this.findRowIndex(rule.id)
        if (rowIndex === -1) throw new Error('找不到要鎖定的規則')

        const now = new Date().toISOString()

        await sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `SalaryRules!J${rowIndex}:K${rowIndex}`, // J=IsLocked, K=LockedAt
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[true, now]],
            },
        })
    }

    /**
     * 查詢所有規則
     */
    async findAll(): Promise<SalaryRule[]> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'SalaryRules!A2:L',
        })

        const rows = response.data.values || []
        return rows.map(row => this.rowToSalaryRule(row))
    }

    /**
     * 檢查規則是否可編輯
     */
    async canEdit(month: string): Promise<boolean> {
        const rule = await this.findByMonth(month)
        if (!rule) return true

        if (rule.isLocked) return false

        const currentMonth = new Date().toISOString().slice(0, 7)
        if (month !== currentMonth) return false

        return true
    }

    /**
     * 將 Google Sheets 列轉換為 SalaryRule 物件
     *
     * A[0]=ID, B[1]=EffectiveMonth,
     * C[2]=BaseRateZero, D[3]=BaseRate1to4,
     * E[4]=TierStartAt, F[5]=TierStep, G[6]=TierBonus,
     * H[7]=Bonus5Card, I[8]=Bonus10Card,
     * J[9]=IsLocked, K[10]=LockedAt, L[11]=CreatedAt
     */
    private rowToSalaryRule(row: any[]): SalaryRule {
        return {
            id: row[0],
            effectiveMonth: row[1],
            baseRateZero: parseFloat(row[2]) || 300,
            baseRate1toN: parseFloat(row[3]) || 500,
            tierStartAtNplus1: parseFloat(row[4]) || 5,
            tierStep: parseFloat(row[5]) || 5,
            tierBonus: parseFloat(row[6]) || 100,
            bonus5Card: parseFloat(row[7]) || 100,
            bonus10Card: parseFloat(row[8]) || 200,
            isLocked: String(row[9]).toUpperCase() === 'TRUE' || row[9] === true,
            lockedAt: row[10] ? new Date(row[10]) : null,
            createdAt: new Date(row[11]),
        }
    }

    /**
     * 找到指定 ID 的列索引（資料從第 2 列開始）
     */
    private async findRowIndex(id: string): Promise<number> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'SalaryRules!A2:A',
        })

        const rows = response.data.values || []
        const index = rows.findIndex(row => row[0] === id)
        return index === -1 ? -1 : index + 2
    }
}
