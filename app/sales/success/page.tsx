'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const amount = searchParams.get('amount')
    const product = searchParams.get('product')

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* 成功圖示 */}
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    {/* 標題 */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        提交成功!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        銷售記錄已成功儲存
                    </p>

                    {/* 銷售資訊 */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 space-y-3">
                        {product && (
                            <div>
                                <p className="text-sm text-green-700 mb-1">商品</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {decodeURIComponent(product)}
                                </p>
                            </div>
                        )}
                        {amount && (
                            <div>
                                <p className="text-sm text-green-700 mb-1">金額</p>
                                <p className="text-4xl font-bold text-green-600">
                                    ${amount}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 按鈕 */}
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/sales')}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            繼續記錄銷售
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            返回首頁
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SalesSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="text-gray-600">載入中...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}
