'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
    const router = useRouter()
    const [currentMonth, setCurrentMonth] = useState('')
    const [summary, setSummary] = useState<any>(null)
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [loading, setLoading] = useState(true)

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
        setCurrentMonth(month)

        // 載入資料
        loadSalaryData(month)
        loadSalesData(month)
    }, [router])

    const loadSalaryData = async (month: string) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/salary/monthly?month=${month}`)
            if (response.ok) {
                const data = await response.json()
                setSummary(data)
            }
        } catch (error) {
            console.error('載入薪資資料失敗:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadSalesData = async (month: string) => {
        try {
            const start = `${month}-01`
            const [year, monthNum] = month.split('-').map(Number)
            const lastDay = new Date(year, monthNum, 0).getDate()
            const end = `${month}-${String(lastDay).padStart(2, '0')}`
            const response = await fetch(`/api/sales?start=${start}&end=${end}`)
            if (response.ok) {
                const sales = await response.json()
                const revenue = sales.reduce((sum: number, s: any) => sum + (s.quantity || 0) * (s.unitPrice || 0), 0)
                setTotalRevenue(revenue)
            }
        } catch (error) {
            console.error('載入銷售資料失敗:', error)
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem('admin_authenticated')
        router.push('/admin')
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-5xl font-black uppercase text-[#F4E76E] mb-2 title-graffiti" style={{ textShadow: '2px 2px 0px #9B7EDE, 4px 4px 0px #7FDBFF' }}>
                            儀表板
                        </h1>
                        <p className="text-[#7FDBFF] uppercase tracking-wider font-bold">
                            {currentMonth} 月份統計
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/"
                            className="btn-dex px-6 py-3 rounded-lg"
                        >
                            返回首頁
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider bg-red-600 text-white border-3 border-red-800 hover:bg-red-700 transition-colors"
                        >
                            登出
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4 float-animation">⏳</div>
                        <p className="text-gray-400 uppercase tracking-wider">載入中...</p>
                    </div>
                ) : summary ? (
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="card-dex rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-4xl">💰</div>
                                <div className="text-sm text-gray-400 uppercase tracking-wider">總收入</div>
                            </div>
                            <div className="text-3xl md:text-4xl font-black text-[#7FDBFF]">
                                ${totalRevenue.toLocaleString()}
                            </div>
                        </div>

                        <div className="card-dex rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-4xl">💵</div>
                                <div className="text-sm text-gray-400 uppercase tracking-wider">總薪資</div>
                            </div>
                            <div className="text-3xl md:text-4xl font-black text-[#F4E76E]">
                                ${summary?.totalSalary?.toLocaleString() || 0}
                            </div>
                        </div>

                        <div className="card-dex rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-4xl">📚</div>
                                <div className="text-sm text-gray-400 uppercase tracking-wider">總課堂</div>
                            </div>
                            <div className="text-3xl md:text-4xl font-black text-[#7FDBFF]">
                                {summary?.totalClasses || 0}
                            </div>
                        </div>

                        <div className="card-dex rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-4xl">👥</div>
                                <div className="text-sm text-gray-400 uppercase tracking-wider">已結算教練</div>
                            </div>
                            <div className="text-3xl md:text-4xl font-black text-[#9B7EDE]">
                                {summary?.totalTeachers || 0}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card-dex rounded-2xl p-8 mb-8 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-gray-400 uppercase tracking-wider">本月尚無薪資資料</p>
                    </div>
                )}

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        href="/admin/dashboard/salary"
                        className="card-dex rounded-2xl p-8 hover:scale-105 transition-all duration-300 group"
                    >
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">💵</div>
                        <h2 className="text-3xl font-black uppercase text-[#F4E76E] mb-2 group-hover:text-[#7FDBFF] transition-colors">
                            薪資管理
                        </h2>
                        <p className="text-gray-400 uppercase text-sm tracking-wider">
                            Salary Management
                        </p>
                    </Link>

                    <Link
                        href="/admin/dashboard/rules"
                        className="card-dex rounded-2xl p-8 hover:scale-105 transition-all duration-300 group pulse-glow"
                    >
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
                        <h2 className="text-3xl font-black uppercase text-[#F4E76E] mb-2 group-hover:text-[#7FDBFF] transition-colors">
                            規則管理
                        </h2>
                        <p className="text-gray-400 uppercase text-sm tracking-wider">
                            Rules Management
                        </p>
                    </Link>

                    <Link
                        href="/admin/dashboard/settings"
                        className="card-dex rounded-2xl p-8 hover:scale-105 transition-all duration-300 group"
                    >
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🔧</div>
                        <h2 className="text-3xl font-black uppercase text-[#F4E76E] mb-2 group-hover:text-[#7FDBFF] transition-colors">
                            系統設定
                        </h2>
                        <p className="text-gray-400 uppercase text-sm tracking-wider">
                            System Settings
                        </p>
                    </Link>
                </div>

            </div>
        </div>
    )
}
