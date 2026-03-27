import { google } from 'googleapis'
import type { Product, IProductsRepository } from '../types'

/**
 * Google Sheets 商品 Repository 實作
 *
 * Products 表欄位:
 *   A: ID
 *   B: Name
 *   C: Price
 *   D: CommissionPerUnit
 *   E: CreatedAt
 */
export class SheetsProductsRepository implements IProductsRepository {
    private spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!
    private sheetName = 'Products'

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

    async findAll(): Promise<Product[]> {
        const auth = await this.getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A2:E`,
        })

        const rows = response.data.values || []

        return rows
            .filter(row => row[0] && row[1])
            .map(row => ({
                id: row[0],
                name: row[1],
                price: parseFloat(row[2]) || 0,
                createdAt: row[3] ? new Date(row[3]) : new Date(),
            }))
    }
}
