// ==================== 資料模型 (Data Models) ====================

/**
 * 點名記錄
 */
export interface Attendance {
    id: string
    date: string // ISO 8601 格式: YYYY-MM-DD
    coachId: string
    courseId: string
    studentCount: number
    calculatedSalary: number
    createdAt: Date
    updatedAt?: Date
}

/**
 * 教練資料
 */
export interface Teacher {
    id: string
    name: string
    email: string
    phone: string
    createdAt: Date
    updatedAt?: Date
}

/**
 * 銷售記錄
 */
export interface Sales {
    id: string
    date: string // ISO 8601 格式: YYYY-MM-DD
    coachId: string
    productName: string
    quantity: number
    unitPrice: number
    createdAt: Date
    updatedAt?: Date
}

/**
 * 課程資料
 */
export interface Course {
    id: string
    name: string
    description: string
    createdAt: Date
    updatedAt?: Date
}

// ==================== DTO (Data Transfer Objects) ====================

/**
 * 建立點名記錄 DTO
 */
export interface CreateAttendanceDTO {
    date: string
    coachId: string
    courseId: string
    studentCount: number
}

/**
 * 更新點名記錄 DTO
 */
export interface UpdateAttendanceDTO {
    date?: string
    courseId?: string
    studentCount?: number
}

/**
 * 建立教練 DTO
 */
export interface CreateTeacherDTO {
    name: string
    email: string
    phone: string
}

/**
 * 更新教練 DTO
 */
export interface UpdateTeacherDTO {
    name?: string
    email?: string
    phone?: string
}

/**
 * 建立銷售記錄 DTO
 */
export interface CreateSalesDTO {
    date: string
    coachId: string
    productName: string
    quantity: number
    unitPrice: number
}

/**
 * 更新銷售記錄 DTO
 */
export interface UpdateSalesDTO {
    date?: string
    productName?: string
    quantity?: number
    unitPrice?: number
}

/**
 * 建立課程 DTO
 */
export interface CreateCourseDTO {
    name: string
    description: string
}

/**
 * 更新課程 DTO
 */
export interface UpdateCourseDTO {
    name?: string
    description?: string
}

// ==================== Repository 介面 ====================

/**
 * 點名記錄 Repository 介面
 * 定義所有點名記錄相關的資料存取方法
 */
export interface IAttendanceRepository {
    /**
     * 建立點名記錄
     */
    create(data: CreateAttendanceDTO): Promise<Attendance>

    /**
     * 根據 ID 查詢點名記錄
     */
    findById(id: string): Promise<Attendance | null>

    /**
     * 根據教練 ID 查詢點名記錄
     */
    findByCoachId(coachId: string): Promise<Attendance[]>

    /**
     * 根據日期範圍查詢點名記錄
     */
    findByDateRange(start: string, end: string): Promise<Attendance[]>

    /**
     * 根據教練 ID 和日期範圍查詢點名記錄
     */
    findByCoachIdAndDateRange(coachId: string, start: string, end: string): Promise<Attendance[]>

    /**
     * 更新點名記錄
     */
    update(id: string, data: UpdateAttendanceDTO): Promise<Attendance>

    /**
     * 刪除點名記錄
     */
    delete(id: string): Promise<void>

    /**
     * 查詢所有點名記錄
     */
    findAll(): Promise<Attendance[]>
}

/**
 * 教練 Repository 介面
 */
export interface ITeacherRepository {
    /**
     * 查詢所有教練
     */
    findAll(): Promise<Teacher[]>

    /**
     * 根據 ID 查詢教練
     */
    findById(id: string): Promise<Teacher | null>

    /**
     * 根據 Email 查詢教練
     */
    findByEmail(email: string): Promise<Teacher | null>

    /**
     * 建立教練
     */
    create(data: CreateTeacherDTO): Promise<Teacher>

    /**
     * 更新教練
     */
    update(id: string, data: UpdateTeacherDTO): Promise<Teacher>

    /**
     * 刪除教練
     */
    delete(id: string): Promise<void>
}

/**
 * 銷售記錄 Repository 介面
 */
export interface ISalesRepository {
    /**
     * 建立銷售記錄
     */
    create(data: CreateSalesDTO): Promise<Sales>

    /**
     * 根據 ID 查詢銷售記錄
     */
    findById(id: string): Promise<Sales | null>

    /**
     * 根據教練 ID 查詢銷售記錄
     */
    findByCoachId(coachId: string): Promise<Sales[]>

    /**
     * 根據日期範圍查詢銷售記錄
     */
    findByDateRange(start: string, end: string): Promise<Sales[]>

    /**
     * 根據教練 ID 和日期範圍查詢銷售記錄
     */
    findByCoachIdAndDateRange(coachId: string, start: string, end: string): Promise<Sales[]>

    /**
     * 更新銷售記錄
     */
    update(id: string, data: UpdateSalesDTO): Promise<Sales>

    /**
     * 刪除銷售記錄
     */
    delete(id: string): Promise<void>

    /**
     * 查詢所有銷售記錄
     */
    findAll(): Promise<Sales[]>
}

/**
 * 課程 Repository 介面
 */
export interface ICourseRepository {
    /**
     * 查詢所有課程
     */
    findAll(): Promise<Course[]>

    /**
     * 根據 ID 查詢課程
     */
    findById(id: string): Promise<Course | null>

    /**
     * 建立課程
     */
    create(data: CreateCourseDTO): Promise<Course>

    /**
     * 更新課程
     */
    update(id: string, data: UpdateCourseDTO): Promise<Course>

    /**
     * 刪除課程
     */
    delete(id: string): Promise<void>
}

// ==================== 統一資料存取層介面 ====================

/**
 * 資料存取層統一介面
 * 提供所有資料存取的入口點
 * 
 * 使用方式:
 * ```typescript
 * import { getDAL } from '@/lib/dal'
 * 
 * const dal = getDAL()
 * const attendances = await dal.attendances.findByCoachId('coach-1')
 * ```
 */
export interface IDataAccessLayer {
    attendances: IAttendanceRepository
    teachers: ITeacherRepository
    sales: ISalesRepository
    courses: ICourseRepository
    monthlySalary: IMonthlySalaryRepository
    salaryRules: ISalaryRulesRepository
    settings: ISettingsRepository
}

// ==================== 老闆頁面相關型別 ====================

/**
 * 月薪資記錄
 */
export interface MonthlySalary {
    id: string
    month: string // 格式: YYYY-MM (例如: 2026-02)
    teacherId: string
    teacherName: string
    totalClasses: number
    totalStudents: number
    attendanceSalary: number
    salesSalary: number
    totalSalary: number
    createdAt: Date
    updatedAt: Date
}

/**
 * 薪資規則
 */
export interface SalaryRule {
    id: string
    effectiveMonth: string // 生效月份: YYYY-MM
    rule1to5: number // 1-5人薪資
    rule6to10: number // 6-10人薪資
    rule11to15: number // 11-15人薪資
    rule16Plus: number // 16人以上薪資
    salesBonus: number // 銷售獎金 (每筆固定金額)
    isLocked: boolean // 是否鎖定
    lockedAt: Date | null // 鎖定時間
    createdAt: Date
}

/**
 * 系統設定
 */
export interface Setting {
    key: string
    value: string
    description: string
    updatedAt: Date
}

// ==================== 老闆頁面 DTO ====================

/**
 * 建立/更新月薪資記錄 DTO
 */
export interface UpsertMonthlySalaryDTO {
    month: string
    teacherId: string
    teacherName: string
    totalClasses: number
    totalStudents: number
    attendanceSalary: number
    salesSalary: number
    totalSalary: number
}

/**
 * 建立/更新薪資規則 DTO
 */
export interface UpsertSalaryRuleDTO {
    effectiveMonth: string
    rule1to5: number
    rule6to10: number
    rule11to15: number
    rule16Plus: number
    salesBonus: number
}

/**
 * 更新設定 DTO
 */
export interface UpdateSettingDTO {
    key: string
    value: string
}

// ==================== 老闆頁面 Repository 介面 ====================

/**
 * 月薪資 Repository 介面
 */
export interface IMonthlySalaryRepository {
    /**
     * 查詢指定月份的所有薪資記錄
     */
    findByMonth(month: string): Promise<MonthlySalary[]>

    /**
     * 查詢指定教練的月薪資
     */
    findByTeacherAndMonth(teacherId: string, month: string): Promise<MonthlySalary | null>

    /**
     * 新增或更新薪資記錄
     */
    upsert(data: UpsertMonthlySalaryDTO): Promise<MonthlySalary>

    /**
     * 查詢所有有記錄的月份
     */
    getAvailableMonths(): Promise<string[]>

    /**
     * 刪除指定月份的所有記錄
     */
    deleteByMonth(month: string): Promise<void>

    /**
     * 查詢所有記錄
     */
    findAll(): Promise<MonthlySalary[]>
}

/**
 * 薪資規則 Repository 介面
 */
export interface ISalaryRulesRepository {
    /**
     * 查詢指定月份的規則
     */
    findByMonth(month: string): Promise<SalaryRule | null>

    /**
     * 查詢當前月份的規則
     */
    getCurrent(): Promise<SalaryRule | null>

    /**
     * 新增或更新規則
     */
    upsert(data: UpsertSalaryRuleDTO): Promise<SalaryRule>

    /**
     * 鎖定規則
     */
    lock(month: string): Promise<void>

    /**
     * 查詢所有規則
     */
    findAll(): Promise<SalaryRule[]>

    /**
     * 檢查規則是否可編輯
     */
    canEdit(month: string): Promise<boolean>
}

/**
 * 系統設定 Repository 介面
 */
export interface ISettingsRepository {
    /**
     * 取得單一設定值
     */
    get(key: string): Promise<string | null>

    /**
     * 取得所有設定
     */
    getAll(): Promise<Record<string, string>>

    /**
     * 更新設定值
     */
    set(key: string, value: string): Promise<void>

    /**
     * 批次更新設定
     */
    setMany(settings: Record<string, string>): Promise<void>
}
