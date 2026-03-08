import { google } from 'googleapis'
import type { SalaryRecord, ISalaryRecordRepository } from '../types'

/**
 * Google Sheets SalaryRecord Repository（append-only）
 *
 * Sheet 欄位對應 (A–K):
 *   A: ID
 *   B: Month         (YYYY-MM)
 *   C: TeacherID
 *   D: TeacherName
 *   E: TotalClasses
 *   F: TotalStudents
 *   G: AttendanceSalary
 *   H: SalesSalary
 *   I: TotalSalary
 *   J: LockedAt      (Rule 鎖定時間戳)
 *   K: CreatedAt
 */
export class SheetsSalaryRecordRepository implements ISalaryRecordRepository {
    private spreadsheetId: string

    constructor(spreadsheetId: string) {
        this.spreadsheetId = spreadsheetId
    }

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
     * 查詢指定月份的所有封存記錄
     */
    async findByMonth(month: string): Promise<SalaryRecord[]> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'SalaryRecord!A2:K',
        })

        const rows = response.data.values || []
        return rows
            .filter(r => r[1] === month)
            .map(r => this.rowToRecord(r))
    }

    /**
     * 批次 append 一整月薪資快照
     * 每次呼叫對應一整個月所有教練的資料
     */
    async appendBatch(records: Omit<SalaryRecord, 'id' | 'createdAt'>[]): Promise<void> {
        if (records.length === 0) return

        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const now = new Date().toISOString()
        const values = records.map(r => [
            `SR-${r.month}-${r.teacherId}-${Date.now()}`,  // ID
            r.month,
            r.teacherId,
            r.teacherName,
            r.totalClasses,
            r.totalStudents,
            r.attendanceSalary,
            r.salesSalary,
            r.totalSalary,
            r.lockedAt instanceof Date ? r.lockedAt.toISOString() : r.lockedAt,
            now, // createdAt
        ])

        await sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: 'SalaryRecord!A:K',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        })
    }

    /**
     * 檢查指定月份是否已封存過
     */
    async hasMonth(month: string): Promise<boolean> {
        const records = await this.findByMonth(month)
        return records.length > 0
    }

    private rowToRecord(row: any[]): SalaryRecord {
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
            lockedAt: new Date(row[9]),
            createdAt: new Date(row[10]),
        }
    }
}
