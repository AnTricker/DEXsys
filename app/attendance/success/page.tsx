'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="card-dex rounded-2xl p-8 text-center">
                    {/* 成功圖示 */}
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-[#F4E76E]/20 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-12 h-12 text-[#F4E76E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    {/* 標題 */}
                    <h1 className="text-3xl font-black text-[#F4E76E] mb-2" style={{ textShadow: '1px 1px 0px #9B7EDE' }}>
                        提交成功!
                    </h1>
                    <p className="text-gray-400 mb-6">
                        點名記錄已成功儲存
                    </p>

                    {/* 按鈕 */}
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/attendance')}
                            className="w-full btn-dex py-3 rounded-lg font-bold uppercase tracking-wider"
                        >
                            繼續點名
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-[#2a2a2a] text-gray-300 py-3 rounded-lg font-medium hover:bg-[#333] transition-colors border border-gray-600"
                        >
                            返回首頁
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AttendanceSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
                <div className="text-gray-400">載入中...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}
