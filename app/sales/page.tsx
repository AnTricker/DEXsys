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
            <div className="min-h-screen bg-[#1a1a1a] py-12 px-4">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black uppercase text-[#F4E76E]" style={{ textShadow: '1px 1px 0px #9B7EDE' }}>確認銷售資訊</h1>
                        <p className="mt-2 text-sm text-gray-400 uppercase tracking-wider">請確認以下資訊無誤</p>
                    </div>

                    <div className="card-dex rounded-2xl p-8 space-y-6">
                        {/* 資訊顯示 */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                <span className="text-gray-400">教練</span>
                                <span className="text-lg font-bold text-white">{selectedTeacher?.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                <span className="text-gray-400">類型</span>
                                <span className="text-lg font-bold text-white">
                                    {saleType === 'package' ? '課卡' : '額外銷售'}
                                </span>
                            </div>

                            {saleType === 'package' ? (
                                <>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                        <span className="text-gray-400">方案</span>
                                        <span className="text-lg font-bold text-white">{selectedPackage?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                        <span className="text-gray-400">數量</span>
                                        <span className="text-2xl font-black text-[#7FDBFF]">{quantity} 張</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                        <span className="text-gray-400">單價</span>
                                        <span className="text-lg font-bold text-white">${selectedPackage?.price}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                    <span className="text-gray-400">備註</span>
                                    <span className="text-lg font-bold text-white">{note}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center py-4 bg-[#2a2a2a] rounded-lg px-4">
                                <span className="text-lg font-semibold text-gray-300">總金額</span>
                                <span className="text-3xl font-black text-[#F4E76E]">${totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* 確認勾選 */}
                        <div className="bg-[#2a2a2a] border-2 border-[#F4E76E]/30 rounded-lg p-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="confirm"
                                    className="w-6 h-6 text-[#F4E76E] rounded focus:ring-2 focus:ring-[#F4E76E]"
                                    required
                                />
                                <span className="ml-3 text-white font-medium">
                                    我確認以上資訊正確無誤
                                </span>
                            </label>
                        </div>

                        {/* 按鈕 */}
                        <div className="space-y-3">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full btn-dex py-4 rounded-lg font-bold text-lg uppercase tracking-wider"
                            >
                                {loading ? '提交中...' : '✓ 確認提交'}
                            </button>
                            <button
                                onClick={() => setStep('form')}
                                disabled={loading}
                                className="w-full bg-[#2a2a2a] text-gray-300 py-3 rounded-lg font-medium hover:bg-[#333] transition-colors border border-gray-600"
                            >
                                ← 返回修改
                            </button>
                        </div>

                        {/* 訊息 */}
                        {message && (
                            <div className="p-4 rounded-lg bg-red-900/50 text-red-300 border border-red-700">
                                <p className="text-center font-medium">{message}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] py-12 px-4">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black uppercase text-[#F4E76E]" style={{ textShadow: '1px 1px 0px #9B7EDE' }}>銷售記錄</h1>
                    <p className="mt-2 text-sm text-gray-400 uppercase tracking-wider">記錄今日銷售資料</p>
                </div>

                <div className="card-dex rounded-2xl p-8">
                    <div className="space-y-6">
                        {/* 教練選擇 */}
                        <div>
                            <label htmlFor="teacher" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                教練
                            </label>
                            <select
                                id="teacher"
                                value={teacherId}
                                onChange={(e) => setTeacherId(e.target.value)}
                                className="w-full px-4 py-3 text-lg font-medium text-white bg-[#2a2a2a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
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
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                銷售類型
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSaleType('package')}
                                    className={`py-4 rounded-lg font-bold text-lg transition-all ${saleType === 'package'
                                        ? 'bg-[#F4E76E] text-[#1a1a1a] shadow-lg shadow-[#F4E76E]/20'
                                        : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333] border border-gray-600'
                                        }`}
                                >
                                    課卡
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSaleType('extra')}
                                    className={`py-4 rounded-lg font-bold text-lg transition-all ${saleType === 'extra'
                                        ? 'bg-[#F4E76E] text-[#1a1a1a] shadow-lg shadow-[#F4E76E]/20'
                                        : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333] border border-gray-600'
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
                                    <label htmlFor="package" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                        課卡方案
                                    </label>
                                    <select
                                        id="package"
                                        value={packageId}
                                        onChange={(e) => setPackageId(e.target.value)}
                                        className="w-full px-4 py-3 text-lg font-medium text-white bg-[#2a2a2a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
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
                                    <label htmlFor="quantity" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                        數量
                                    </label>
                                    <input
                                        id="quantity"
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full px-4 py-6 text-4xl font-black text-center text-[#7FDBFF] bg-[#2a2a2a] border-2 border-[#7FDBFF]/30 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
                                        placeholder="0"
                                        required
                                    />
                                    {quantity && selectedPackage && (
                                        <p className="mt-3 text-center text-lg font-bold text-[#F4E76E]">
                                            總金額: ${(selectedPackage.price * parseInt(quantity)).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 額外模式 */}
                        {saleType === 'extra' && (
                            <>
                                <div>
                                    <label htmlFor="note" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                        備註
                                    </label>
                                    <input
                                        id="note"
                                        type="text"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full px-4 py-3 text-lg font-medium text-white bg-[#2a2a2a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
                                        placeholder="輸入商品或服務名稱"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="extraAmount" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                        金額
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#F4E76E] text-2xl font-black">
                                            $
                                        </span>
                                        <input
                                            id="extraAmount"
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={extraAmount}
                                            onChange={(e) => setExtraAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full pl-12 pr-4 py-6 text-4xl font-black text-center text-[#7FDBFF] bg-[#2a2a2a] border-2 border-[#7FDBFF]/30 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
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
                            className="w-full btn-dex py-4 rounded-lg font-bold text-lg uppercase tracking-wider disabled:opacity-50"
                        >
                            下一步 →
                        </button>
                    </div>

                    {/* 導航 */}
                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full text-gray-500 hover:text-gray-300 py-2 text-sm transition-colors"
                        >
                            返回首頁
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
