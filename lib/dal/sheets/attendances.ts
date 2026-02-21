import { google } from 'googleapis'
import {
    IAttendanceRepository,
    Attendance,
    CreateAttendanceDTO,
    UpdateAttendanceDTO,
} from '../types'

/**
 * Google Sheets 點名記錄 Repository 實作
 */
export class SheetsAttendanceRepository implements IAttendanceRepository {
    private sheets = google.sheets('v4')
    private spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
    private sheetName = 'Attendances'

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
     * 計算薪資
     * 規則:
     * - 1-5人: $500
     * - 6-10人: $800
     * - 11-15人: $1200
     * - 16+人: $1500
     */
    private calculateSalary(studentCount: number): number {
        if (studentCount >= 1 && studentCount <= 5) return 500
        if (studentCount >= 6 && studentCount <= 10) return 800
        if (studentCount >= 11 && studentCount <= 15) return 1200
        if (studentCount >= 16) return 1500
        return 0
    }

    /**
     * 產生 ID (使用時間戳記 + 隨機數)
     */
    private generateId(): string {
        return `ATT${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 建立點名記錄
     */
    async create(data: CreateAttendanceDTO): Promise<Attendance> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const id = this.generateId()
        const salary = this.calculateSalary(data.studentCount)
        const now = new Date().toISOString()

        // 寫入 Google Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A:G`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    id,
                    data.date,
                    data.coachId,
                    data.courseId,
                    data.studentCount,
                    salary,
                    now,
                ]],
            },
        })

        return {
            id,
            date: data.date,
            coachId: data.coachId,
            courseId: data.courseId,
            studentCount: data.studentCount,
            calculatedSalary: salary,
            createdAt: new Date(now),
        }
    }

    /**
     * 根據 ID 查詢點名記錄
     */
    async findById(id: string): Promise<Attendance | null> {
        const all = await this.findAll()
        return all.find(a => a.id === id) || null
    }

    /**
     * 根據教練 ID 查詢點名記錄
     */
    async findByCoachId(coachId: string): Promise<Attendance[]> {
        const all = await this.findAll()
        return all.filter(a => a.coachId === coachId)
    }

    /**
     * 根據日期範圍查詢點名記錄
     */
    async findByDateRange(start: string, end: string): Promise<Attendance[]> {
        const all = await this.findAll()
        return all.filter(a => a.date >= start && a.date <= end)
    }

    /**
     * 根據教練 ID 和日期範圍查詢點名記錄
     */
    async findByCoachIdAndDateRange(
        coachId: string,
        start: string,
        end: string
    ): Promise<Attendance[]> {
        const all = await this.findAll()
        return all.filter(
            a => a.coachId === coachId && a.date >= start && a.date <= end
        )
    }

    /**
     * 更新點名記錄
     */
    async update(id: string, data: UpdateAttendanceDTO): Promise<Attendance> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        // 先取得所有資料找到要更新的列
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:G`,
        })

        const rows = response.data.values || []
        const rowIndex = rows.findIndex(row => row[0] === id)

        if (rowIndex === -1) {
            throw new Error(`Attendance with id ${id} not found`)
        }

        const row = rows[rowIndex]
        const updatedRow = [
            row[0], // ID
            data.date || row[1],
            row[2], // CoachID (不可更新)
            data.courseId || row[3],
            data.studentCount !== undefined ? data.studentCount : row[4],
            data.studentCount !== undefined
                ? this.calculateSalary(data.studentCount)
                : row[5],
            row[6], // CreatedAt
        ]

        // 更新該列 (rowIndex + 2 因為第一列是標題,且索引從 1 開始)
        await sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A${rowIndex + 2}:G${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        })

        return {
            id: updatedRow[0],
            date: updatedRow[1],
            coachId: updatedRow[2],
            courseId: updatedRow[3],
            studentCount: parseInt(updatedRow[4]),
            calculatedSalary: parseFloat(updatedRow[5]),
            createdAt: new Date(updatedRow[6]),
        }
    }

    /**
     * 刪除點名記錄
     */
    async delete(id: string): Promise<void> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        // 先取得所有資料找到要刪除的列
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:G`,
        })

        const rows = response.data.values || []
        const rowIndex = rows.findIndex(row => row[0] === id)

        if (rowIndex === -1) {
            throw new Error(`Attendance with id ${id} not found`)
        }

        // 刪除該列 (rowIndex + 1 因為第一列是標題)
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // 假設 Attendances 是第一個工作表
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1,
                            endIndex: rowIndex + 2,
                        },
                    },
                }],
            },
        })
    }

    /**
     * 查詢所有點名記錄
     */
    async findAll(): Promise<Attendance[]> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:G`,
        })

        const rows = response.data.values || []

        return rows.map(row => ({
            id: row[0],
            date: row[1],
            coachId: row[2],
            courseId: row[3],
            studentCount: parseInt(row[4]),
            calculatedSalary: parseFloat(row[5]),
            createdAt: new Date(row[6]),
        }))
    }
}
