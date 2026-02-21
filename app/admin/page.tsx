'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/admin/settings')
            if (res.ok) {
                const data = await res.json()
                const adminPassword = data.settings?.AdminPassword || 'admin123'
                if (password === adminPassword) {
                    sessionStorage.setItem('admin_authenticated', 'true')
                    router.push('/admin/dashboard')
                } else {
                    setError('密碼錯誤!')
                }
            } else {
                // API 失敗時 fallback
                if (password === 'admin123') {
                    sessionStorage.setItem('admin_authenticated', 'true')
                    router.push('/admin/dashboard')
                } else {
                    setError('密碼錯誤!')
                }
            }
        } catch {
            setError('驗證失敗，請稍後再試')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4 relative overflow-hidden">
            {/* 背景裝飾 */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-10 w-64 h-64 bg-[#9B7EDE] rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#7FDBFF] rounded-full blur-3xl"></div>
            </div>

            <div className="card-dex rounded-2xl p-8 max-w-md w-full relative z-10">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4 float-animation">🔐</div>
                    <h1 className="text-4xl font-black uppercase text-[#F4E76E] mb-2 title-graffiti" style={{ textShadow: '2px 2px 0px #9B7EDE, 4px 4px 0px #7FDBFF' }}>
                        老闆頁面
                    </h1>
                    <p className="text-gray-400 uppercase tracking-wider text-sm">
                        Admin Access Only
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-[#7FDBFF] mb-2 uppercase tracking-wider">
                            密碼
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-dex"
                            placeholder="請輸入密碼"
                            required
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-400 font-bold">{error}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-dex w-full py-4 rounded-lg text-lg"
                    >
                        登入
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-[#7FDBFF] hover:text-[#F4E76E] transition-colors font-bold uppercase text-sm tracking-wider">
                        ← 返回首頁
                    </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-[#9B7EDE]">
                    <p className="text-xs text-gray-500 text-center uppercase tracking-wide">
                        預設密碼: admin123
                    </p>
                </div>
            </div>
        </div>
    )
}
