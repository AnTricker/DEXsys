'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
    const router = useRouter()
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        // 檢查登入狀態
        const isAuthenticated = sessionStorage.getItem('admin_authenticated')
        if (!isAuthenticated) {
            router.push('/admin')
            return
        }

        loadSettings()
    }, [router])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/settings')
            if (response.ok) {
                const data = await response.json()
                setSettings(data.settings || {})
            }
        } catch (error) {
            console.error('載入設定失敗:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!confirm('確定要更新系統設定嗎?')) {
            return
        }

        try {
            setSaving(true)
            setMessage('')
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })

            if (response.ok) {
                setMessage('✅ 設定已更新')
            } else {
                setMessage('❌ 更新失敗')
            }
        } catch (error) {
            console.error('更新設定失敗:', error)
            setMessage('❌ 更新失敗')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (key: string, value: string) => {
        setSettings({ ...settings, [key]: value })
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
            <div className="container mx-auto max-w-3xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-5xl font-black uppercase text-[#F4E76E] mb-2 title-graffiti" style={{ textShadow: '2px 2px 0px #9B7EDE, 4px 4px 0px #7FDBFF' }}>
                            系統設定
                        </h1>
                        <p className="text-[#7FDBFF] uppercase tracking-wider font-bold">
                            System Settings
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
                    <div className="card-dex rounded-2xl p-8">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                                    每月發薪日 (1-31)
                                </label>
                                <input
                                    type="number"
                                    value={settings.PaymentDay || '5'}
                                    onChange={(e) => handleChange('PaymentDay', e.target.value)}
                                    className="input-dex"
                                    min="1"
                                    max="31"
                                />
                                <p className="mt-2 text-sm text-gray-400">
                                    發薪日當天會自動鎖定上個月的薪資規則
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                                    老闆頁面密碼
                                </label>
                                <input
                                    type="text"
                                    value={settings.AdminPassword || 'admin123'}
                                    onChange={(e) => handleChange('AdminPassword', e.target.value)}
                                    className="input-dex"
                                />
                                <p className="mt-2 text-sm text-gray-400">
                                    修改後需要重新登入
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-dex w-full py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? '儲存中...' : '儲存設定'}
                            </button>

                            {message && (
                                <div className={`p-4 rounded-lg border-2 font-bold ${message.startsWith('✅') ? 'bg-green-900/30 text-green-400 border-green-500' : 'bg-red-900/30 text-red-400 border-red-500'}`}>
                                    {message}
                                </div>
                            )}
                        </form>

                        <div className="mt-8 pt-6 border-t border-[#9B7EDE]">
                            <h3 className="text-xl font-black uppercase text-[#9B7EDE] mb-4">
                                注意事項
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>發薪日設定會影響薪資規則的鎖定時間</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>密碼修改後請妥善保管,遺失無法找回</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>建議定期備份 Google Sheets 資料</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
