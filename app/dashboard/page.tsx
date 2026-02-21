'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const router = useRouter()
    const [attendances, setAttendances] = useState<any[]>([])
    const [sales, setSales] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // 載入所有資料
    useEffect(() => {
        Promise.all([
            fetch('/api/attendances').then(res => res.json()),
            fetch('/api/sales').then(res => res.json()),
            fetch('/api/teachers').then(res => res.json()),
        ])
            .then(([attendanceData, salesData, teacherData]) => {
                setAttendances(attendanceData)
                setSales(salesData)
                setTeachers(teacherData)
            })
            .catch(err => console.error('Error loading dashboard data:', err))
            .finally(() => setLoading(false))
    }, [])

    // 計算統計資料
    const totalSalary = attendances.reduce((sum, a) => sum + a.calculatedSalary, 0)
    const totalSalesAmount = sales.reduce((sum, s) => sum + s.amount, 0)
    const totalRevenue = totalSalesAmount
    const totalCost = totalSalary
    const totalProfit = totalRevenue - totalCost
    const totalStudents = attendances.reduce((sum, a) => sum + a.studentCount, 0)

    // 依教練分組統計
    const coachStats = teachers.map(teacher => {
        const coachAttendances = attendances.filter(a => a.coachId === teacher.id)
        const coachSales = sales.filter(s => s.coachId === teacher.id)

        return {
            name: teacher.name,
            salary: coachAttendances.reduce((sum, a) => sum + a.calculatedSalary, 0),
            salesAmount: coachSales.reduce((sum, s) => sum + s.amount, 0),
            studentCount: coachAttendances.reduce((sum, a) => sum + a.studentCount, 0),
            classCount: coachAttendances.length,
        }
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">老闆儀表板</h1>
                    <p className="mt-2 text-sm text-gray-600">整體營運概況</p>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500">載入中...</p>
                ) : (
                    <>
                        {/* 總覽統計 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <p className="text-sm text-gray-600 mb-1">總營收</p>
                                <p className="text-3xl font-bold text-green-600">${totalRevenue}</p>
                                <p className="text-xs text-gray-500 mt-1">銷售收入</p>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <p className="text-sm text-gray-600 mb-1">總成本</p>
                                <p className="text-3xl font-bold text-red-600">${totalCost}</p>
                                <p className="text-xs text-gray-500 mt-1">教練薪資</p>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <p className="text-sm text-gray-600 mb-1">淨利潤</p>
                                <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    ${totalProfit}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">營收 - 成本</p>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <p className="text-sm text-gray-600 mb-1">總學員數</p>
                                <p className="text-3xl font-bold text-purple-600">{totalStudents}</p>
                                <p className="text-xs text-gray-500 mt-1">累計上課人次</p>
                            </div>
                        </div>

                        {/* 教練統計 */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">教練統計</h2>
                            </div>

                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    教練
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    上課次數
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    學員人次
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    薪資
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    銷售
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {coachStats.map((coach, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {coach.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {coach.classCount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {coach.studentCount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                                                        ${coach.salary}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                        ${coach.salesAmount}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {coachStats.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">尚無教練資料</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 導航按鈕 */}
                        <div className="mt-8 flex justify-center space-x-4">
                            <button
                                onClick={() => router.push('/admin/teachers')}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                管理教練
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                返回首頁
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
