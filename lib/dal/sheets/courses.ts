import { google } from 'googleapis'
import {
    ICourseRepository,
    Course,
    CreateCourseDTO,
    UpdateCourseDTO,
} from '../types'

/**
 * Google Sheets 課程 Repository 實作
 */
export class SheetsCourseRepository implements ICourseRepository {
    private spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
    private sheetName = 'Courses'

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
        return `COURSE${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 查詢所有課程
     */
    async findAll(): Promise<Course[]> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:D`,
        })

        const rows = response.data.values || []

        return rows.map(row => ({
            id: row[0],
            name: row[1],
            description: row[2],
            createdAt: new Date(row[3]),
        }))
    }

    /**
     * 根據 ID 查詢課程
     */
    async findById(id: string): Promise<Course | null> {
        const all = await this.findAll()
        return all.find(c => c.id === id) || null
    }

    /**
     * 建立課程
     */
    async create(data: CreateCourseDTO): Promise<Course> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const id = this.generateId()
        const now = new Date().toISOString()

        await sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A:D`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    id,
                    data.name,
                    data.description,
                    now,
                ]],
            },
        })

        return {
            id,
            name: data.name,
            description: data.description,
            createdAt: new Date(now),
        }
    }

    /**
     * 更新課程
     */
    async update(id: string, data: UpdateCourseDTO): Promise<Course> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:D`,
        })

        const rows = response.data.values || []
        const rowIndex = rows.findIndex(row => row[0] === id)

        if (rowIndex === -1) {
            throw new Error(`Course with id ${id} not found`)
        }

        const row = rows[rowIndex]
        const updatedRow = [
            row[0], // ID
            data.name || row[1],
            data.description || row[2],
            row[3], // CreatedAt
        ]

        await sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A${rowIndex + 2}:D${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        })

        return {
            id: updatedRow[0],
            name: updatedRow[1],
            description: updatedRow[2],
            createdAt: new Date(updatedRow[3]),
        }
    }

    /**
     * 刪除課程
     */
    async delete(id: string): Promise<void> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:D`,
        })

        const rows = response.data.values || []
        const rowIndex = rows.findIndex(row => row[0] === id)

        if (rowIndex === -1) {
            throw new Error(`Course with id ${id} not found`)
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 3, // 假設 Courses 是第四個工作表
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
