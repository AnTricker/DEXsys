import { google } from 'googleapis'
import type {
    ISettingsRepository,
} from '../types'

/**
 * Google Sheets 系統設定 Repository 實作
 */
export class SheetsSettingsRepository implements ISettingsRepository {
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
     * 取得單一設定值
     */
    async get(key: string): Promise<string | null> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'Settings!A2:D',
        })

        const rows = response.data.values || []
        const row = rows.find(r => r[0] === key)

        return row ? row[1] : null
    }

    /**
     * 取得所有設定
     */
    async getAll(): Promise<Record<string, string>> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'Settings!A2:D',
        })

        const rows = response.data.values || []
        const settings: Record<string, string> = {}

        rows.forEach(row => {
            if (row[0]) {
                settings[row[0]] = row[1] || ''
            }
        })

        return settings
    }

    /**
     * 更新設定值
     */
    async set(key: string, value: string): Promise<void> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        // 檢查設定是否已存在
        const rowIndex = await this.findRowIndex(key)

        if (rowIndex !== -1) {
            // 更新現有設定
            const now = new Date().toISOString()

            // 先取得現有的 description
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `Settings!C${rowIndex}:C${rowIndex}`,
            })
            const description = response.data.values?.[0]?.[0] || ''

            await sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `Settings!A${rowIndex}:D${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[key, value, description, now]],
                },
            })
        } else {
            // 新增設定
            const now = new Date().toISOString()
            await sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Settings!A:D',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[key, value, '', now]],
                },
            })
        }
    }

    /**
     * 批次更新設定
     */
    async setMany(settings: Record<string, string>): Promise<void> {
        for (const [key, value] of Object.entries(settings)) {
            await this.set(key, value)
        }
    }

    /**
     * 找到指定 Key 的列索引
     */
    private async findRowIndex(key: string): Promise<number> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'Settings!A2:A',
        })

        const rows = response.data.values || []
        const index = rows.findIndex(row => row[0] === key)
        return index === -1 ? -1 : index + 2
    }
}
