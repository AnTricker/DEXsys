'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Teacher {
    id: string
    name: string
}

type AttendanceRecord = {
    type: 'attendance'
    date: string
    courseName: string
    studentCount: number
}

type SalesRecord = {
    type: 'sales'
    date: string
    productName: string
    quantity: number
    totalAmount: number
}

type SearchRecord = AttendanceRecord | SalesRecord

type Stage = 'password' | 'form' | 'results'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const YEARS = Array.from({ length: 3 }, (_, i) => currentYear - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function SearchPage() {
    const router = useRouter()
    const [stage, setStage] = useState<Stage>('password')

    // 密碼
    const [password, setPassword] = useState('')
    const [pwdError, setPwdError] = useState('')
    const [pwdLoading, setPwdLoading] = useState(false)

    // 查詢條件
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [teacherId, setTeacherId] = useState('')
    const [year, setYear] = useState(currentYear)
    const [month, setMonth] = useState(currentMonth)

    // 查詢結果
    const [records, setRecords] = useState<SearchRecord[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState('')
    const [searched, setSearched] = useState(false)

    // 載入教練列表
    useEffect(() => {
        fetch('/api/teachers')
            .then((r) => r.json())
            .then((data: Teacher[]) => {
                setTeachers(data)
                if (data.length > 0) setTeacherId(data[0].id)
            })
            .catch(console.error)
    }, [])

    // ── 密碼驗證（先打 search API，讓後端驗） ──
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return
        setPwdLoading(true)
        setPwdError('')

        // 用假參數試查，只驗密碼
        const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, teacherId: 'dummy', year, month }),
        })

        if (res.status === 401) {
            setPwdError('密碼錯誤，請重新輸入')
            setPwdLoading(false)
            return
        }

        // 密碼正確（其他錯誤也算通過密碼驗證）
        setPwdLoading(false)
        setStage('form')
    }

    // ── 查詢 ──
    const handleSearch = async () => {
        if (!teacherId) return
        setSearchLoading(true)
        setSearchError('')
        setSearched(false)

        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, teacherId, year, month }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? '查詢失敗')
            setRecords(data.records)
            setSearched(true)
            setStage('results')
        } catch (err: unknown) {
            setSearchError(err instanceof Error ? err.message : '查詢失敗')
        } finally {
            setSearchLoading(false)
        }
    }

    const selectedTeacher = teachers.find((t) => t.id === teacherId)

    // ═══════════════════ RENDER ═══════════════════

    // ── 密碼輸入 ──
    if (stage === 'password') {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🔍</div>
                        <h1
                            className="text-3xl font-black uppercase text-[#F4E76E]"
                            style={{ textShadow: '2px 2px 0px #9B7EDE' }}
                        >
                            查詢紀錄
                        </h1>
                        <p className="mt-2 text-sm text-gray-400 uppercase tracking-wider">
                            請輸入查詢密碼
                        </p>
                    </div>

                    <div className="card-dex rounded-2xl p-8">
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="search-pwd"
                                    className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider"
                                >
                                    密碼
                                </label>
                                <input
                                    id="search-pwd"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-4 text-xl font-bold text-center text-white bg-[#2a2a2a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF] tracking-widest"
                                    placeholder="••••••"
                                    autoFocus
                                    required
                                />
                                {pwdError && (
                                    <p className="mt-2 text-red-400 text-sm text-center font-medium">
                                        {pwdError}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={pwdLoading || !password}
                                className="w-full btn-dex py-4 rounded-lg font-bold text-lg uppercase tracking-wider disabled:opacity-50"
                            >
                                {pwdLoading ? '驗證中...' : '確認 →'}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-700">
                            <button
                                onClick={() => router.push('/')}
                                className="w-full text-gray-500 hover:text-gray-300 py-2 text-sm transition-colors"
                            >
                                返回首頁
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── 查詢輸入 & 結果（共用頁面） ──
    return (
        <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1
                        className="text-3xl font-black uppercase text-[#F4E76E]"
                        style={{ textShadow: '2px 2px 0px #9B7EDE' }}
                    >
                        查詢紀錄
                    </h1>
                    <p className="mt-2 text-sm text-gray-400 uppercase tracking-wider">
                        Search Records
                    </p>
                </div>

                {/* 查詢表單 */}
                <div className="card-dex rounded-2xl p-6 mb-6">
                    <div className="space-y-4">
                        {/* 年月選擇 */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    年份
                                </label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="w-full px-3 py-3 text-base font-medium text-white bg-[#2a2a2a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
                                >
                                    {YEARS.map((y) => (
                                        <option key={y} value={y}>
                                            {y} 年
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    月份
                                </label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="w-full px-3 py-3 text-base font-medium text-white bg-[#2a2a2a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
                                >
                                    {MONTHS.map((m) => (
                                        <option key={m} value={m}>
                                            {m} 月
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 教練選擇 */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                                教練
                            </label>
                            <select
                                value={teacherId}
                                onChange={(e) => setTeacherId(e.target.value)}
                                className="w-full px-3 py-3 text-base font-medium text-white bg-[#2a2a2a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
                            >
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 查詢按鈕 */}
                        <button
                            onClick={handleSearch}
                            disabled={searchLoading || !teacherId}
                            className="w-full btn-dex py-4 rounded-lg font-bold text-lg uppercase tracking-wider disabled:opacity-50"
                        >
                            {searchLoading ? '查詢中...' : '🔍 查詢'}
                        </button>

                        {searchError && (
                            <p className="text-red-400 text-sm text-center">{searchError}</p>
                        )}
                    </div>
                </div>

                {/* 結果區 */}
                {searched && (
                    <div>
                        {/* 標題列 */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-base font-bold text-[#9B7EDE] uppercase tracking-wider">
                                {selectedTeacher?.name} ／ {year} 年 {month} 月
                            </h2>
                            <span className="text-xs text-gray-500 font-medium">
                                共 {records.length} 筆
                            </span>
                        </div>

                        {records.length === 0 ? (
                            <div className="card-dex rounded-2xl p-12 text-center">
                                <div className="text-4xl mb-4">📭</div>
                                <p className="text-gray-400 font-medium">本月尚無紀錄</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {records.map((rec, idx) =>
                                    rec.type === 'attendance' ? (
                                        <div
                                            key={`att-${idx}`}
                                            className="rounded-xl p-4 border-2 border-[#7FDBFF]/40 bg-[#0f1f24]"
                                            style={{ boxShadow: '3px 3px 0px rgba(127,219,255,0.2)' }}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7FDBFF]/20 text-[#7FDBFF]">
                                                    點名
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {rec.date}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-white font-bold">
                                                    {rec.courseName}
                                                </span>
                                                <span className="text-[#7FDBFF] font-black text-lg">
                                                    {rec.studentCount} 人
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            key={`sale-${idx}`}
                                            className="rounded-xl p-4 border-2 border-[#F4E76E]/40 bg-[#1f1c0a]"
                                            style={{ boxShadow: '3px 3px 0px rgba(244,231,110,0.2)' }}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F4E76E]/20 text-[#F4E76E]">
                                                    銷售
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {rec.date}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-white font-bold">
                                                        {rec.productName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        x {rec.quantity}
                                                    </p>
                                                </div>
                                                <span className="text-[#F4E76E] font-black text-lg">
                                                    ${rec.totalAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 底部返回 */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-500 hover:text-gray-300 py-2 text-sm transition-colors"
                    >
                        ← 返回首頁
                    </button>
                </div>
            </div>
        </div>
    )
}
