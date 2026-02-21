'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Teacher {
    id: string
    name: string
}

interface PackageOption {
    id: string
    name: string
    price: number
}

type SaleType = 'package' | 'extra'

export default function SalesPage() {
    const router = useRouter()
    const [step, setStep] = useState<'form' | 'confirm'>('form')

    // 表單資料
    const [teacherId, setTeacherId] = useState('')
    const [saleType, setSaleType] = useState<SaleType>('package')

    // 課卡模式
    const [packageId, setPackageId] = useState('')
    const [quantity, setQuantity] = useState('')

    // 額外模式
    const [extraAmount, setExtraAmount] = useState('')
    const [note, setNote] = useState('')

    // 選項資料
    const [teachers, setTeachers] = useState<Teacher[]>([])

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    // 課卡方案 (3種)
    const packageOptions: PackageOption[] = [
        { id: 'pkg-single', name: '單堂卡', price: 500 },
        { id: 'pkg-five', name: '五堂卡', price: 2000 },
        { id: 'pkg-ten', name: '十堂卡', price: 3500 },
    ]

    // 載入教練列表
    useEffect(() => {
        fetch('/api/teachers')
            .then(res => res.json())
            .then(data => {
                setTeachers(data)
                if (data.length > 0) setTeacherId(data[0].id)
            })
            .catch(err => console.error('Error loading teachers:', err))

        // 預設選擇第一個課卡方案
        setPackageId(packageOptions[0].id)
    }, [])

    const handleNext = () => {
        if (!teacherId) {
            setMessage('請選擇教練')
            return
        }

        if (saleType === 'package' && (!packageId || !quantity)) {
            setMessage('請選擇課卡方案並輸入數量')
            return
        }

        if (saleType === 'extra' && (!extraAmount || !note)) {
            setMessage('請輸入金額和備註')
            return
        }

        setStep('confirm')
    }

    const handleSubmit = async () => {
        setLoading(true)
        setMessage('')

        try {
            let productName = ''
            let qty = 1
            let unitPrice = 0

            if (saleType === 'package') {
                const selectedPackage = packageOptions.find(p => p.id === packageId)
                productName = selectedPackage?.name || ''
                qty = parseInt(quantity) || 1
                unitPrice = selectedPackage?.price || 0
            } else {
                productName = `額外銷售 - ${note}`
                qty = 1
                unitPrice = parseFloat(extraAmount) || 0
            }

            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString().split('T')[0],
                    coachId: teacherId,
                    productName,
                    quantity: qty,
                    unitPrice,
                }),
            })

            if (!response.ok) throw new Error('提交失敗')

            const totalAmount = qty * unitPrice
            router.push(`/sales/success?amount=${totalAmount}&product=${encodeURIComponent(productName)}`)
        } catch (error) {
            setMessage('❌ 提交失敗，請稍後再試')
            setLoading(false)
        }
    }

    const selectedTeacher = teachers.find(t => t.id === teacherId)
    const selectedPackage = packageOptions.find(p => p.id === packageId)

    const totalAmount = saleType === 'package'
        ? (selectedPackage?.price || 0) * parseInt(quantity || '0')
        : parseFloat(extraAmount || '0')

    if (step === 'confirm') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">確認銷售資訊</h1>
                        <p className="mt-2 text-sm text-gray-600">請確認以下資訊無誤</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
                        {/* 資訊顯示 */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">教練</span>
                                <span className="text-lg font-bold text-gray-900">{selectedTeacher?.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">類型</span>
                                <span className="text-lg font-bold text-gray-900">
                                    {saleType === 'package' ? '課卡' : '額外銷售'}
                                </span>
                            </div>

                            {saleType === 'package' ? (
                                <>
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <span className="text-gray-600">方案</span>
                                        <span className="text-lg font-bold text-gray-900">{selectedPackage?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <span className="text-gray-600">數量</span>
                                        <span className="text-2xl font-bold text-green-600">{quantity} 張</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <span className="text-gray-600">單價</span>
                                        <span className="text-lg font-bold text-gray-900">${selectedPackage?.price}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between items-center py-3 border-b">
                                    <span className="text-gray-600">備註</span>
                                    <span className="text-lg font-bold text-gray-900">{note}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center py-4 bg-green-50 rounded-lg px-4">
                                <span className="text-lg font-semibold text-gray-700">總金額</span>
                                <span className="text-3xl font-bold text-green-600">${totalAmount}</span>
                            </div>
                        </div>

                        {/* 確認勾選 */}
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="confirm"
                                    className="w-6 h-6 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                    required
                                />
                                <span className="ml-3 text-gray-900 font-medium">
                                    我確認以上資訊正確無誤
                                </span>
                            </label>
                        </div>

                        {/* 按鈕 */}
                        <div className="space-y-3">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? '提交中...' : '✓ 確認提交'}
                            </button>
                            <button
                                onClick={() => setStep('form')}
                                disabled={loading}
                                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                ← 返回修改
                            </button>
                        </div>

                        {/* 訊息 */}
                        {message && (
                            <div className={`p-4 rounded-lg ${message.includes('✅')
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                <p className="text-center font-medium">{message}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">銷售記錄</h1>
                    <p className="mt-2 text-sm text-gray-600">記錄今日銷售資料</p>
                </div>

                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="space-y-6">
                        {/* 教練選擇 */}
                        <div>
                            <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-2">
                                教練
                            </label>
                            <select
                                id="teacher"
                                value={teacherId}
                                onChange={(e) => setTeacherId(e.target.value)}
                                className="w-full px-4 py-3 text-lg font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required
                            >
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 銷售類型選擇 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                銷售類型
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSaleType('package')}
                                    className={`py-4 rounded-lg font-bold text-lg transition-all ${saleType === 'package'
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    課卡
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSaleType('extra')}
                                    className={`py-4 rounded-lg font-bold text-lg transition-all ${saleType === 'extra'
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    額外
                                </button>
                            </div>
                        </div>

                        {/* 課卡模式 */}
                        {saleType === 'package' && (
                            <>
                                <div>
                                    <label htmlFor="package" className="block text-sm font-medium text-gray-700 mb-2">
                                        課卡方案
                                    </label>
                                    <select
                                        id="package"
                                        value={packageId}
                                        onChange={(e) => setPackageId(e.target.value)}
                                        className="w-full px-4 py-3 text-lg font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        required
                                    >
                                        {packageOptions.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.name} - ${pkg.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                                        數量
                                    </label>
                                    <input
                                        id="quantity"
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full px-4 py-6 text-4xl font-bold text-center text-gray-900 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="0"
                                        required
                                    />
                                    {quantity && selectedPackage && (
                                        <p className="mt-3 text-center text-lg font-semibold text-green-600">
                                            總金額: ${selectedPackage.price * parseInt(quantity)}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 額外模式 */}
                        {saleType === 'extra' && (
                            <>
                                <div>
                                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                                        備註
                                    </label>
                                    <input
                                        id="note"
                                        type="text"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full px-4 py-3 text-lg font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="輸入商品或服務名稱"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="extraAmount" className="block text-sm font-medium text-gray-700 mb-2">
                                        金額
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-2xl font-bold">
                                            $
                                        </span>
                                        <input
                                            id="extraAmount"
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={extraAmount}
                                            onChange={(e) => setExtraAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full pl-12 pr-4 py-6 text-4xl font-bold text-center text-gray-900 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 下一步按鈕 */}
                        <button
                            onClick={handleNext}
                            disabled={(saleType === 'package' && (!packageId || !quantity)) || (saleType === 'extra' && (!extraAmount || !note))}
                            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            下一步 →
                        </button>
                    </div>

                    {/* 導航 */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm"
                        >
                            返回首頁
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
