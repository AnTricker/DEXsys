import { google } from 'googleapis'
import {
    ISalesRepository,
    Sales,
    CreateSalesDTO,
    UpdateSalesDTO,
} from '../types'
import { SheetsTeacherRepository } from './teachers'

/**
 * Google Sheets 銷售記錄 Repository 實作
 * 欄位順序: ID(A), Date(B), CoachID(C), 教練名稱(D), ProductName(E), Quantity(F), UnitPrice(G), Total(H), Commission(I), CreatedAt(J)
 */
export class SheetsSalesRepository implements ISalesRepository {
    private spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
    private sheetName = 'Sales'
    private teacherRepo = new SheetsTeacherRepository()

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
        return `SALE${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * 建立銷售記錄
     */
    async create(data: CreateSalesDTO): Promise<Sales> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const id = this.generateId()
        const now = new Date().toISOString()

        const coach = await this.teacherRepo.findById(data.coachId)
        const coachName = coach?.name || ''

        await sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A:J`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    id,
                    data.date,
                    data.coachId,
                    coachName,
                    data.productName,
                    data.quantity,
                    data.unitPrice,
                    '=INDIRECT("F"&ROW()) * INDIRECT("G"&ROW())', // H: Total Formula
                    data.commission || 0, // I: Commission
                    now, // J: CreatedAt
                ]],
            },
        })

        return {
            id,
            date: data.date,
            coachId: data.coachId,
            productName: data.productName,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            commission: data.commission || 0,
            createdAt: new Date(now),
        }
    }

    /**
     * 根據 ID 查詢銷售記錄
     */
    async findById(id: string): Promise<Sales | null> {
        const all = await this.findAll()
        return all.find(s => s.id === id) || null
    }

    /**
     * 根據教練 ID 查詢銷售記錄
     */
    async findByCoachId(coachId: string): Promise<Sales[]> {
        const all = await this.findAll()
        return all.filter(s => s.coachId === coachId)
    }

    /**
     * 根據日期範圍查詢銷售記錄
     */
    async findByDateRange(start: string, end: string): Promise<Sales[]> {
        const all = await this.findAll()
        return all.filter(s => s.date >= start && s.date <= end)
    }

    /**
     * 根據教練 ID 和日期範圍查詢銷售記錄
     */
    async findByCoachIdAndDateRange(
        coachId: string,
        start: string,
        end: string
    ): Promise<Sales[]> {
        const all = await this.findAll()
        return all.filter(
            s => s.coachId === coachId && s.date >= start && s.date <= end
        )
    }

    /**
     * 更新銷售記錄
     */
    async update(id: string, data: UpdateSalesDTO): Promise<Sales> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:I`,
        })

        const rows = response.data.values || []
        const rowIndex = rows.findIndex(row => row[0] === id)

        if (rowIndex === -1) {
            throw new Error(`Sales with id ${id} not found`)
        }

        const row = rows[rowIndex]

        let coachName = row[3] || ''
        if (!coachName) {
            const coach = await this.teacherRepo.findById(row[2])
            coachName = coach?.name || ''
        }

        const updatedRow = [
            row[0], // ID
            data.date || row[1],
            row[2], // CoachID (不可更新)
            coachName, // CoachName
            data.productName || row[4],
            data.quantity !== undefined ? data.quantity : row[5],
            data.unitPrice !== undefined ? data.unitPrice : row[6],
            '=INDIRECT("F"&ROW()) * INDIRECT("G"&ROW())', // Total
            data.commission !== undefined ? data.commission : row[8],
            row[9] || new Date().toISOString(), // CreatedAt
        ]

        await sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A${rowIndex + 2}:J${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        })

        return {
            id: updatedRow[0],
            date: updatedRow[1],
            coachId: updatedRow[2],
            productName: updatedRow[4],
            quantity: parseFloat(updatedRow[5]) || 0,
            unitPrice: parseFloat(updatedRow[6]) || 0,
            commission: parseFloat(updatedRow[8]) || 0,
            createdAt: new Date(updatedRow[9]),
        }
    }

    /**
     * 刪除銷售記錄
     */
    async delete(id: string): Promise<void> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:J`,
        })

        const rows = response.data.values || []
        const rowIndex = rows.findIndex(row => row[0] === id)

        if (rowIndex === -1) {
            throw new Error(`Sales with id ${id} not found`)
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 2, // 假設 Sales 是第三個工作表
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
     * 查詢所有銷售記錄
     */
    async findAll(): Promise<Sales[]> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:J`,
        })

        const rows = response.data.values || []

        return rows.map(row => ({
            id: row[0],
            date: row[1],
            coachId: row[2],
            productName: row[4],
            quantity: parseFloat(row[5]) || 0,
            unitPrice: parseFloat(row[6]) || 0,
            commission: parseFloat(row[8]) || 0,
            createdAt: new Date(row[9]),
        }))
    }
}
