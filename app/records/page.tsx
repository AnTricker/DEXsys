'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export default function RecordsPage() {
    const router = useRouter()
    const [attendances, setAttendances] = useState<any[]>([])
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'attendance' | 'sales'>('attendance')

    // 暫時使用固定的教練 ID
    const coachId = 'coach-1'

    // 載入資料
    useEffect(() => {
        Promise.all([
            fetch(`/api/attendances?coachId=${coachId}`).then(res => res.json()),
            fetch(`/api/sales?coachId=${coachId}`).then(res => res.json()),
        ])
            .then(([attendanceData, salesData]) => {
                setAttendances(attendanceData)
                setSales(salesData)
            })
            .catch(err => console.error('Error loading records:', err))
            .finally(() => setLoading(false))
    }, [])

    // 計算統計資料
    const totalSalary = attendances.reduce((sum, a) => sum + a.calculatedSalary, 0)
    const totalSalesAmount = sales.reduce((sum, s) => sum + s.amount, 0)
    const totalStudents = attendances.reduce((sum, a) => sum + a.studentCount, 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">我的記錄</h1>
                    <p className="mt-2 text-sm text-gray-600">查看點名與銷售記錄</p>
                </div>

                {/* 統計卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">總薪資</p>
                        <p className="text-3xl font-bold text-blue-600">${totalSalary}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">總銷售</p>
                        <p className="text-3xl font-bold text-green-600">${totalSalesAmount}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">總學員數</p>
                        <p className="text-3xl font-bold text-purple-600">{totalStudents}</p>
                    </div>
                </div>

                {/* 分頁標籤 */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('attendance')}
                                className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'attendance'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                點名記錄 ({attendances.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('sales')}
                                className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'sales'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                銷售記錄 ({sales.length})
                            </button>
                        </nav>
                    </div>

                    {/* 內容區域 */}
                    <div className="p-6">
                        {loading ? (
                            <p className="text-center text-gray-500">載入中...</p>
                        ) : activeTab === 'attendance' ? (
                            <div className="space-y-4">
                                {attendances.length === 0 ? (
                                    <p className="text-center text-gray-500">尚無點名記錄</p>
                                ) : (
                                    attendances.map(attendance => (
                                        <div key={attendance.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">{attendance.date}</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        上課人數: {attendance.studentCount} 人
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        ${attendance.calculatedSalary}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sales.length === 0 ? (
                                    <p className="text-center text-gray-500">尚無銷售記錄</p>
                                ) : (
                                    sales.map(sale => (
                                        <div key={sale.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">{sale.productName}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{sale.date}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-green-600">
                                                        ${sale.amount}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 導航按鈕 */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                        ← 返回首頁
                    </button>
                </div>
            </div>
        </div>
    )
}
