'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RulesManagementPage() {
    const router = useRouter()
    const [currentRules, setCurrentRules] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [editable, setEditable] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [showHistory, setShowHistory] = useState(false)

    // 表單狀態
    const [formData, setFormData] = useState({
        effectiveMonth: '',
        rule1to5: 500,
        rule6to10: 800,
        rule11to15: 1200,
        rule16Plus: 1500,
        salesBonus: 10,
    })

    useEffect(() => {
        // 檢查登入狀態
        const isAuthenticated = sessionStorage.getItem('admin_authenticated')
        if (!isAuthenticated) {
            router.push('/admin')
            return
        }

        loadCurrentRules()
        loadHistory()
    }, [router])

    const loadCurrentRules = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/rules')
            if (response.ok) {
                const data = await response.json()
                setCurrentRules(data.rule)
                setEditable(data.editable)

                if (data.rule) {
                    setFormData({
                        effectiveMonth: data.rule.effectiveMonth,
                        rule1to5: data.rule.rule1to5,
                        rule6to10: data.rule.rule6to10,
                        rule11to15: data.rule.rule11to15,
                        rule16Plus: data.rule.rule16Plus,
                        salesBonus: data.rule.salesBonus,
                    })
                }
            }
        } catch (error) {
            console.error('載入規則失敗:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadHistory = async () => {
        try {
            const response = await fetch('/api/admin/rules?history=true')
            if (response.ok) {
                const data = await response.json()
                const currentMonth = new Date().toISOString().slice(0, 7)
                // 過濾掉當月規則,只顯示歷史
                const historicalRules = (data.rules || []).filter(
                    (rule: any) => rule.effectiveMonth !== currentMonth
                )
                setHistory(historicalRules)
            }
        } catch (error) {
            console.error('載入歷史失敗:', error)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!confirm('確定要更新薪資規則嗎?')) {
            return
        }

        try {
            setSaving(true)
            setMessage('')
            const response = await fetch('/api/admin/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setMessage('✅ 規則已更新')
                loadCurrentRules()
                loadHistory()
            } else {
                const error = await response.json()
                setMessage(`❌ 更新失敗: ${error.error}`)
            }
        } catch (error) {
            console.error('更新規則失敗:', error)
            setMessage('❌ 更新失敗')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-5xl font-black uppercase text-[#F4E76E] mb-2 title-graffiti" style={{ textShadow: '2px 2px 0px #9B7EDE, 4px 4px 0px #7FDBFF' }}>
                            規則管理
                        </h1>
                        <p className="text-[#7FDBFF] uppercase tracking-wider font-bold">
                            Rules Management
                        </p>
                    </div>
                    <Link
                        href="/admin/dashboard"
                        className="btn-dex px-6 py-3 rounded-lg"
                    >
                        ← 返回儀表板
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4 float-animation">⏳</div>
                        <p className="text-gray-400 uppercase tracking-wider">載入中...</p>
                    </div>
                ) : (
                    <>
                        {/* Current Rules Form */}
                        <div className="card-dex rounded-2xl p-8 mb-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-black uppercase text-[#F4E76E]">
                                    當前規則
                                </h2>
                                {!editable && (
                                    <span className="bg-red-900/30 text-red-400 border-2 border-red-500 px-4 py-2 rounded-lg text-sm font-bold uppercase">
                                        🔒 已鎖定
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                                            生效月份
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.effectiveMonth}
                                            disabled
                                            className="input-dex bg-[#0f0f0f] opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                                            銷售獎金 ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.salesBonus}
                                            onChange={(e) => setFormData({ ...formData, salesBonus: parseFloat(e.target.value) })}
                                            disabled={!editable}
                                            className="input-dex disabled:opacity-60"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-xl font-black uppercase text-[#9B7EDE] mb-4">
                                        點名薪資規則
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                                                1-5 人薪資 ($)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.rule1to5}
                                                onChange={(e) => setFormData({ ...formData, rule1to5: parseFloat(e.target.value) })}
                                                disabled={!editable}
                                                className="input-dex disabled:opacity-60"
                                                min="0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                                                6-10 人薪資 ($)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.rule6to10}
                                                onChange={(e) => setFormData({ ...formData, rule6to10: parseFloat(e.target.value) })}
                                                disabled={!editable}
                                                className="input-dex disabled:opacity-60"
                                                min="0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                                                11-15 人薪資 ($)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.rule11to15}
                                                onChange={(e) => setFormData({ ...formData, rule11to15: parseFloat(e.target.value) })}
                                                disabled={!editable}
                                                className="input-dex disabled:opacity-60"
                                                min="0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                                                16 人以上薪資 ($)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.rule16Plus}
                                                onChange={(e) => setFormData({ ...formData, rule16Plus: parseFloat(e.target.value) })}
                                                disabled={!editable}
                                                className="input-dex disabled:opacity-60"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {editable && (
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn-dex w-full py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? '儲存中...' : '儲存規則'}
                                    </button>
                                )}

                                {message && (
                                    <div className={`p-4 rounded-lg border-2 font-bold ${message.startsWith('✅') ? 'bg-green-900/30 text-green-400 border-green-500' : 'bg-red-900/30 text-red-400 border-red-500'}`}>
                                        {message}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* History */}
                        <div className="card-dex rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-black uppercase text-[#F4E76E]">
                                    規則歷史
                                </h2>
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="text-[#7FDBFF] hover:text-[#F4E76E] transition-colors font-bold uppercase text-sm tracking-wider"
                                >
                                    {showHistory ? '隱藏' : '顯示'}
                                </button>
                            </div>

                            {showHistory && history.length > 0 && (
                                <div className="space-y-3">
                                    {history.map((rule: any) => (
                                        <div key={rule.id} className="border border-[#9B7EDE]/40 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[#F4E76E] font-black text-lg">{rule.effectiveMonth}</span>
                                                {rule.isLocked ? (
                                                    <span className="bg-red-900/30 text-red-400 border border-red-500 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                                                        🔒 已鎖定
                                                    </span>
                                                ) : (
                                                    <span className="bg-green-900/30 text-green-400 border border-green-500 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                                                        ✏️ 可編輯
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">1-5人</span>
                                                    <span className="text-white font-bold">${rule.rule1to5}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">6-10人</span>
                                                    <span className="text-white font-bold">${rule.rule6to10}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">11-15人</span>
                                                    <span className="text-white font-bold">${rule.rule11to15}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">16+人</span>
                                                    <span className="text-white font-bold">${rule.rule16Plus}</span>
                                                </div>
                                                <div className="flex justify-between col-span-2 border-t border-[#9B7EDE]/30 pt-2 mt-1">
                                                    <span className="text-gray-400">銷售獎金</span>
                                                    <span className="text-[#7FDBFF] font-bold">${rule.salesBonus}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showHistory && history.length === 0 && (
                                <p className="text-gray-400 text-center py-4">尚無歷史資料</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
