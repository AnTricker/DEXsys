import { IDataAccessLayer } from './types'
import { SheetsAttendanceRepository } from './sheets/attendances'
import { SheetsTeacherRepository } from './sheets/teachers'
import { SheetsSalesRepository } from './sheets/sales'
import { SheetsCourseRepository } from './sheets/courses'
import { SheetsMonthlySalaryRepository } from './sheets/monthly-salary'
import { SheetsSalaryRulesRepository } from './sheets/salary-rules'
import { SheetsSettingsRepository } from './sheets/settings'

/**
 * 環境變數控制使用哪個實作
 * Phase 1: NEXT_PUBLIC_USE_SUPABASE=false (使用 Google Sheets)
 * Phase 2: NEXT_PUBLIC_USE_SUPABASE=true (使用 Supabase)
 */
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'

/**
 * DAL 工廠函數
 * 根據環境變數建立對應的 DAL 實作
 */
export function createDAL(): IDataAccessLayer {
    if (USE_SUPABASE) {
        // Phase 2: 使用 Supabase (未來實作)
        throw new Error('Supabase implementation not yet available. Please set NEXT_PUBLIC_USE_SUPABASE=false')

        // 未來實作:
        // return {
        //   attendances: new SupabaseAttendanceRepository(),
        //   teachers: new SupabaseTeacherRepository(),
        //   sales: new SupabaseSalesRepository(),
        //   courses: new SupabaseCourseRepository(),
        //   monthlySalary: new SupabaseMonthlySalaryRepository(),
        //   salaryRules: new SupabaseSalaryRulesRepository(),
        //   settings: new SupabaseSettingsRepository(),
        // }
    } else {
        // Phase 1: 使用 Google Sheets
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || ''

        return {
            attendances: new SheetsAttendanceRepository(),
            teachers: new SheetsTeacherRepository(),
            sales: new SheetsSalesRepository(),
            courses: new SheetsCourseRepository(),
            monthlySalary: new SheetsMonthlySalaryRepository(spreadsheetId),
            salaryRules: new SheetsSalaryRulesRepository(spreadsheetId),
            settings: new SheetsSettingsRepository(spreadsheetId),
        }
    }
}

/**
 * DAL 單例
 * 確保整個應用程式使用同一個 DAL 實例
 */
let dalInstance: IDataAccessLayer | null = null

/**
 * 取得 DAL 實例
 * 
 * 使用方式:
 * ```typescript
 * import { getDAL } from '@/lib/dal'
 * 
 * const dal = getDAL()
 * const attendances = await dal.attendances.findByCoachId('coach-1')
 * ```
 */
export function getDAL(): IDataAccessLayer {
    if (!dalInstance) {
        dalInstance = createDAL()
    }
    return dalInstance
}

/**
 * 重置 DAL 實例 (主要用於測試)
 */
export function resetDAL(): void {
    dalInstance = null
}

// 匯出所有型別
export * from './types'
