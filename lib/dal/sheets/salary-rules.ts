import { google } from 'googleapis'
import type {
    SalaryRule,
    UpsertSalaryRuleDTO,
    ISalaryRulesRepository,
} from '../types'

/**
 * Google Sheets 薪資規則 Repository 實作
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
            range: 'SalaryRules!A2:J',
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

        // 檢查是否已存在
        const existing = await this.findByMonth(data.effectiveMonth)

        if (existing) {
            // 更新現有規則
            const rowIndex = await this.findRowIndex(existing.id)
            if (rowIndex === -1) throw new Error('找不到要更新的規則')

            await sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `SalaryRules!A${rowIndex}:J${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        existing.id,
                        data.effectiveMonth,
                        data.rule1to5,
                        data.rule6to10,
                        data.rule11to15,
                        data.rule16Plus,
                        data.salesBonus,
                        existing.isLocked,
                        existing.lockedAt ? existing.lockedAt.toISOString() : '',
                        existing.createdAt.toISOString(),
                    ]],
                },
            })

            return {
                ...existing,
                ...data,
            }
        } else {
            // 新增規則
            const id = 'SR' + Date.now()
            const now = new Date().toISOString()

            await sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'SalaryRules!A:J',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        id,
                        data.effectiveMonth,
                        data.rule1to5,
                        data.rule6to10,
                        data.rule11to15,
                        data.rule16Plus,
                        data.salesBonus,
                        false, // isLocked
                        '', // lockedAt
                        now, // createdAt
                    ]],
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
     * 鎖定規則
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
            range: `SalaryRules!H${rowIndex}:I${rowIndex}`,
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
            range: 'SalaryRules!A2:J',
        })

        const rows = response.data.values || []
        return rows.map(row => this.rowToSalaryRule(row))
    }

    /**
     * 檢查規則是否可編輯
     */
    async canEdit(month: string): Promise<boolean> {
        const rule = await this.findByMonth(month)
        if (!rule) return true // 如果規則不存在,可以建立

        // 如果已鎖定,不能編輯
        if (rule.isLocked) return false

        // 只能編輯當月規則
        const currentMonth = new Date().toISOString().slice(0, 7)
        if (month !== currentMonth) return false

        return true
    }

    /**
     * 將 Google Sheets 列轉換為 SalaryRule 物件
     */
    private rowToSalaryRule(row: any[]): SalaryRule {
        return {
            id: row[0],
            effectiveMonth: row[1],
            rule1to5: parseFloat(row[2]) || 0,
            rule6to10: parseFloat(row[3]) || 0,
            rule11to15: parseFloat(row[4]) || 0,
            rule16Plus: parseFloat(row[5]) || 0,
            salesBonus: parseFloat(row[6]) || 0,
            isLocked: String(row[7]).toUpperCase() === 'TRUE' || row[7] === true,
            lockedAt: row[8] ? new Date(row[8]) : null,
            createdAt: new Date(row[9]),
        }
    }

    /**
     * 找到指定 ID 的列索引
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
