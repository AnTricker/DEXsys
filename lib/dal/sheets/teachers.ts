import { google } from 'googleapis'
import {
    ITeacherRepository,
    Teacher,
    CreateTeacherDTO,
    UpdateTeacherDTO,
} from '../types'

/**
 * Google Sheets 教練 Repository 實作
 */
export class SheetsTeacherRepository implements ITeacherRepository {
    private spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
    private sheetName = 'Teachers'

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
     * 產生 ID
     */
    private generateId(): string {
        return `COACH${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 查詢所有教練
     */
    async findAll(): Promise<Teacher[]> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:E`,
        })

        const rows = response.data.values || []

        return rows.map(row => ({
            id: row[0],
            name: row[1],
            email: row[2],
            phone: row[3],
            createdAt: new Date(row[4]),
        }))
    }

    /**
     * 根據 ID 查詢教練
     */
    async findById(id: string): Promise<Teacher | null> {
        const all = await this.findAll()
        return all.find(t => t.id === id) || null
    }

    /**
     * 根據 Email 查詢教練
     */
    async findByEmail(email: string): Promise<Teacher | null> {
        const all = await this.findAll()
        return all.find(t => t.email === email) || null
    }

    /**
     * 建立教練
     */
    async create(data: CreateTeacherDTO): Promise<Teacher> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const id = this.generateId()
        const now = new Date().toISOString()

        await sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    id,
                    data.name,
                    data.email,
                    data.phone,
                    now,
                ]],
            },
        })

        return {
            id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            createdAt: new Date(now),
        }
    }

    /**
     * 更新教練
     */
    async update(id: string, data: UpdateTeacherDTO): Promise<Teacher> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:E`,
        })

        const rows = response.data.values || []
        const rowIndex = rows.findIndex(row => row[0] === id)

        if (rowIndex === -1) {
            throw new Error(`Teacher with id ${id} not found`)
        }

        const row = rows[rowIndex]
        const updatedRow = [
            row[0], // ID
            data.name || row[1],
            data.email || row[2],
            data.phone || row[3],
            row[4], // CreatedAt
        ]

        await sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A${rowIndex + 2}:E${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        })

        return {
            id: updatedRow[0],
            name: updatedRow[1],
            email: updatedRow[2],
            phone: updatedRow[3],
            createdAt: new Date(updatedRow[4]),
        }
    }

    /**
     * 刪除教練
     */
    async delete(id: string): Promise<void> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:E`,
        })

        const rows = response.data.values || []
        const rowIndex = rows.findIndex(row => row[0] === id)

        if (rowIndex === -1) {
            throw new Error(`Teacher with id ${id} not found`)
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 1, // 假設 Teachers 是第二個工作表
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1,
                            endIndex: rowIndex + 2,
                        },
                    },
                }],
            },
        })
    }
}
