'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SalaryManagementPage() {
    const router = useRouter()
    const [selectedMonth, setSelectedMonth] = useState('')
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [calculating, setCalculating] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        // 檢查登入狀態
        const isAuthenticated = sessionStorage.getItem('admin_authenticated')
        if (!isAuthenticated) {
            router.push('/admin')
            return
        }

        // 設定當前月份
        const now = new Date()
        const month = now.toISOString().slice(0, 7)
        setSelectedMonth(month)
        loadSalaryData(month)
    }, [router])

    const loadSalaryData = async (month: string) => {
        try {
            setLoading(true)
            setMessage('')
            const response = await fetch(`/api/admin/salary/monthly?month=${month}`)
            if (response.ok) {
                const data = await response.json()
                setSummary(data)
            } else {
                setSummary(null)
            }
        } catch (error) {
            console.error('載入薪資資料失敗:', error)
            setMessage('載入失敗')
        } finally {
            setLoading(false)
        }
    }

    const handleCalculate = async () => {
        if (!selectedMonth) return

        if (!confirm(`確定要計算 ${selectedMonth} 的薪資嗎?\n這會覆蓋現有的計算結果。`)) {
            return
        }

        try {
            setCalculating(true)
            setMessage('')
            const response = await fetch('/api/admin/salary/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month: selectedMonth }),
            })

            if (response.ok) {
                const data = await response.json()
                setMessage(`✅ 計算完成! 共計算 ${data.calculated} 位教練,總薪資 $${data.totalSalary.toLocaleString()}`)
                // 重新載入資料
                loadSalaryData(selectedMonth)
            } else {
                const error = await response.json()
                setMessage(`❌ 計算失敗: ${error.error}`)
            }
        } catch (error) {
            console.error('計算薪資失敗:', error)
            setMessage('❌ 計算失敗')
        } finally {
            setCalculating(false)
        }
    }

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const month = e.target.value
        setSelectedMonth(month)
        loadSalaryData(month)
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-5xl font-black uppercase text-[#F4E76E] mb-2 title-graffiti" style={{ textShadow: '2px 2px 0px #9B7EDE, 4px 4px 0px #7FDBFF' }}>
                            薪資管理
                        </h1>
                        <p className="text-[#7FDBFF] uppercase tracking-wider font-bold">
                            Salary Management
                        </p>
                    </div>
                    <Link
                        href="/admin/dashboard"
                        className="btn-dex px-6 py-3 rounded-lg"
                    >
                        ← 返回儀表板
                    </Link>
                </div>

                {/* Controls */}
                <div className="card-dex rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                                選擇月份
                            </label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                className="input-dex"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleCalculate}
                                disabled={calculating || !selectedMonth}
                                className="btn-dex w-full px-8 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {calculating ? '計算中...' : '計算薪資'}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`mt-4 p-4 rounded-lg border-2 font-bold ${message.startsWith('✅') ? 'bg-green-900/30 text-green-400 border-green-500' : 'bg-red-900/30 text-red-400 border-red-500'}`}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4 float-animation">⏳</div>
                        <p className="text-gray-400 uppercase tracking-wider">載入中...</p>
                    </div>
                ) : summary && summary.salaries && summary.salaries.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="card-dex rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-4xl">💰</div>
                                    <div className="text-sm text-gray-400 uppercase tracking-wider">總薪資</div>
                                </div>
                                <div className="text-4xl font-black text-[#F4E76E]">
                                    ${summary.totalSalary?.toLocaleString() || 0}
                                </div>
                            </div>

                            <div className="card-dex rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-4xl">📚</div>
                                    <div className="text-sm text-gray-400 uppercase tracking-wider">總課堂</div>
                                </div>
                                <div className="text-4xl font-black text-[#7FDBFF]">
                                    {summary.totalClasses || 0}
                                </div>
                            </div>

                            <div className="card-dex rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-4xl">👥</div>
                                    <div className="text-sm text-gray-400 uppercase tracking-wider">教練數</div>
                                </div>
                                <div className="text-4xl font-black text-[#9B7EDE]">
                                    {summary.totalTeachers || 0}
                                </div>
                            </div>
                        </div>

                        {/* Salary Table */}
                        <div className="card-dex rounded-2xl p-8">
                            <h2 className="text-3xl font-black uppercase text-[#F4E76E] mb-6">
                                教練薪資明細
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="table-dex">
                                    <thead>
                                        <tr>
                                            <th className="text-left py-4 px-4 text-white font-black uppercase">教練</th>
                                            <th className="text-right py-4 px-4 text-white font-black uppercase">課堂數</th>
                                            <th className="text-right py-4 px-4 text-white font-black uppercase">學員數</th>
                                            <th className="text-right py-4 px-4 text-white font-black uppercase">點名薪資</th>
                                            <th className="text-right py-4 px-4 text-white font-black uppercase">銷售薪資</th>
                                            <th className="text-right py-4 px-4 text-white font-black uppercase">總薪資</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.salaries.map((salary: any) => (
                                            <tr key={salary.teacherId}>
                                                <td className="py-3 px-4 font-bold text-white">
                                                    {salary.teacherName}
                                                </td>
                                                <td className="text-right py-3 px-4 text-gray-300">
                                                    {salary.totalClasses}
                                                </td>
                                                <td className="text-right py-3 px-4 text-gray-300">
                                                    {salary.totalStudents}
                                                </td>
                                                <td className="text-right py-3 px-4 text-gray-300">
                                                    ${salary.attendanceSalary.toLocaleString()}
                                                </td>
                                                <td className="text-right py-3 px-4 text-gray-300">
                                                    ${salary.salesSalary.toLocaleString()}
                                                </td>
                                                <td className="text-right py-3 px-4 font-black text-[#F4E76E]">
                                                    ${salary.totalSalary.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="card-dex rounded-2xl p-12 text-center">
                        <div className="text-7xl mb-4 float-animation">📊</div>
                        <h2 className="text-3xl font-black uppercase text-[#F4E76E] mb-2">
                            尚無薪資資料
                        </h2>
                        <p className="text-gray-400 mb-6 uppercase tracking-wider">
                            請先點擊「計算薪資」按鈕來計算 {selectedMonth} 的薪資
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
