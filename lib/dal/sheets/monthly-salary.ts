import { google } from 'googleapis'
import type {
    MonthlySalary,
    UpsertMonthlySalaryDTO,
    IMonthlySalaryRepository,
} from '../types'

/**
 * Google Sheets 月薪資 Repository 實作
 */
export class SheetsMonthlySalaryRepository implements IMonthlySalaryRepository {
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
     * 查詢指定月份的所有薪資記錄
     */
    async findByMonth(month: string): Promise<MonthlySalary[]> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'MonthlySalary!A2:K',
        })

        const rows = response.data.values || []
        return rows
            .filter(row => row[1] === month)
            .map(row => this.rowToMonthlySalary(row))
    }

    /**
     * 查詢指定教練的月薪資
     */
    async findByTeacherAndMonth(teacherId: string, month: string): Promise<MonthlySalary | null> {
        const records = await this.findByMonth(month)
        return records.find(r => r.teacherId === teacherId) || null
    }

    /**
     * 新增或更新薪資記錄
     */
    async upsert(data: UpsertMonthlySalaryDTO): Promise<MonthlySalary> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        // 檢查是否已存在
        const existing = await this.findByTeacherAndMonth(data.teacherId, data.month)

        if (existing) {
            // 更新現有記錄
            const rowIndex = await this.findRowIndex(existing.id)
            if (rowIndex === -1) throw new Error('找不到要更新的記錄')

            const now = new Date().toISOString()
            await sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `MonthlySalary!A${rowIndex}:K${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        existing.id,
                        data.month,
                        data.teacherId,
                        data.teacherName,
                        data.totalClasses,
                        data.totalStudents,
                        data.attendanceSalary,
                        data.salesSalary,
                        data.totalSalary,
                        existing.createdAt.toISOString(),
                        now,
                    ]],
                },
            })

            return {
                ...existing,
                ...data,
                updatedAt: new Date(now),
            }
        } else {
            // 新增記錄
            const id = 'MS' + Date.now()
            const now = new Date().toISOString()

            await sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'MonthlySalary!A:K',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[
                        id,
                        data.month,
                        data.teacherId,
                        data.teacherName,
                        data.totalClasses,
                        data.totalStudents,
                        data.attendanceSalary,
                        data.salesSalary,
                        data.totalSalary,
                        now,
                        now,
                    ]],
                },
            })

            return {
                id,
                ...data,
                createdAt: new Date(now),
                updatedAt: new Date(now),
            }
        }
    }

    /**
     * 查詢所有有記錄的月份
     */
    async getAvailableMonths(): Promise<string[]> {
        const all = await this.findAll()
        const months = [...new Set(all.map(r => r.month))]
        return months.sort().reverse() // 最新的在前
    }

    /**
     * 刪除指定月份的所有記錄
     */
    async deleteByMonth(month: string): Promise<void> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'MonthlySalary!A2:K',
        })

        const rows = response.data.values || []
        const rowsToDelete: number[] = []

        rows.forEach((row, index) => {
            if (row[1] === month) {
                rowsToDelete.push(index + 2) // +2 因為從第2列開始
            }
        })

        // 從後往前刪除,避免索引錯亂
        for (const rowIndex of rowsToDelete.reverse()) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                requestBody: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: await this.getSheetId('MonthlySalary'),
                                dimension: 'ROWS',
                                startIndex: rowIndex - 1,
                                endIndex: rowIndex,
                            },
                        },
                    }],
                },
            })
        }
    }

    /**
     * 查詢所有記錄
     */
    async findAll(): Promise<MonthlySalary[]> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'MonthlySalary!A2:K',
        })

        const rows = response.data.values || []
        return rows.map(row => this.rowToMonthlySalary(row))
    }

    /**
     * 將 Google Sheets 列轉換為 MonthlySalary 物件
     */
    private rowToMonthlySalary(row: any[]): MonthlySalary {
        return {
            id: row[0],
            month: row[1],
            teacherId: row[2],
            teacherName: row[3],
            totalClasses: parseInt(row[4]) || 0,
            totalStudents: parseInt(row[5]) || 0,
            attendanceSalary: parseFloat(row[6]) || 0,
            salesSalary: parseFloat(row[7]) || 0,
            totalSalary: parseFloat(row[8]) || 0,
            createdAt: new Date(row[9]),
            updatedAt: new Date(row[10]),
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
            range: 'MonthlySalary!A2:A',
        })

        const rows = response.data.values || []
        const index = rows.findIndex(row => row[0] === id)
        return index === -1 ? -1 : index + 2 // +2 因為從第2列開始
    }

    /**
     * 取得工作表 ID
     */
    private async getSheetId(sheetName: string): Promise<number> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId,
        })

        const sheet = response.data.sheets?.find(s => s.properties?.title === sheetName)
        return sheet?.properties?.sheetId || 0
    }
}
