'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Teacher {
    id: string
    name: string
}

interface Product {
    id: string
    name: string
    price: number
}

interface SalaryRule {
    bonus5Card: number
    bonus10Card: number
}

type SaleType = 'package' | 'extra'

export default function SalesPage() {
    const router = useRouter()
    const [step, setStep] = useState<'form' | 'confirm'>('form')

    // 表單資料
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [teacherId, setTeacherId] = useState('')
    const [saleType, setSaleType] = useState<SaleType>('package')

    // 課卡模式
    const [packageId, setPackageId] = useState('')
    const [quantity, setQuantity] = useState('')

    // 額外模式
    const [extraQty, setExtraQty] = useState('1')
    const [extraUnitPrice, setExtraUnitPrice] = useState('')
    const [extraCommission, setExtraCommission] = useState('')
    const [note, setNote] = useState('')

    const [isConfirmed, setIsConfirmed] = useState(false)

    // 遠端資料
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [salaryRules, setSalaryRules] = useState<SalaryRule | null>(null)

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    // 載入資料
    useEffect(() => {
        // 載入教練
        fetch('/api/teachers')
            .then(res => res.json())
            .then(data => {
                setTeachers(data)
                if (data.length > 0) setTeacherId(data[0].id)
            })
            .catch(err => console.error('Error loading teachers:', err))

        // 載入產品 (課卡)
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data)
                if (data.length > 0) setPackageId(data[0].id)
            })
            .catch(err => console.error('Error loading products:', err))

        // 載入當前薪資規則（為了計算課卡抽成）
        fetch('/api/salary-rules/current')
            .then(res => res.json())
            .then(data => {
                setSalaryRules(data)
            })
            .catch(err => console.error('Error loading rules:', err))
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

        if (saleType === 'extra' && (!extraUnitPrice || !note || !extraQty)) {
            setMessage('請輸入單價、數量和備註')
            return
        }

        setStep('confirm')
    }

    const calculatePackageCommission = (productName: string, qty: number) => {
        if (!salaryRules) return 0
        let unitCommission = 0
        if (productName.includes('五堂')) {
            unitCommission = salaryRules.bonus5Card || 0
        } else if (productName.includes('十堂')) {
            unitCommission = salaryRules.bonus10Card || 0
        }
        return unitCommission * qty
    }

    const handleSubmit = async () => {
        setLoading(true)
        setMessage('')

        try {
            let productName = ''
            let qty = 1
            let unitPrice = 0
            let commission = 0

            if (saleType === 'package') {
                const selectedPackage = products.find(p => p.id === packageId)
                productName = selectedPackage?.name || ''
                qty = parseInt(quantity) || 1
                unitPrice = selectedPackage?.price || 0
                commission = calculatePackageCommission(productName, qty)
            } else {
                productName = `額外銷售 - ${note}`
                qty = parseInt(extraQty) || 1
                unitPrice = parseFloat(extraUnitPrice) || 0
                commission = parseFloat(extraCommission) || 0
            }

            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    coachId: teacherId,
                    productName,
                    quantity: qty,
                    unitPrice,
                    commission,
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
    const selectedPackage = products.find(p => p.id === packageId)

    const totalAmount = saleType === 'package'
        ? (selectedPackage?.price || 0) * parseInt(quantity || '0')
        : (parseFloat(extraUnitPrice || '0') * parseInt(extraQty || '1'))

    const calculatedCommission = saleType === 'package'
        ? calculatePackageCommission(selectedPackage?.name || '', parseInt(quantity || '0'))
        : parseFloat(extraCommission || '0')

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
                                <span className="text-gray-400">日期</span>
                                <span className="text-lg font-bold text-white">{date}</span>
                            </div>
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
                                <>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                        <span className="text-gray-400">備註</span>
                                        <span className="text-lg font-bold text-white">{note}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                        <span className="text-gray-400">數量</span>
                                        <span className="text-2xl font-black text-[#7FDBFF]">{extraQty}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                        <span className="text-gray-400">單價</span>
                                        <span className="text-lg font-bold text-white">${extraUnitPrice || '0'}</span>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-between items-center py-4 bg-[#2a2a2a] rounded-lg px-4 mb-2 border border-gray-700">
                                <span className="text-lg font-semibold text-gray-300">總金額</span>
                                <span className="text-3xl font-black text-[#F4E76E]">${totalAmount.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-t border-b border-gray-700 bg-[#9B7EDE]/10 px-4 rounded-lg">
                                <span className="text-[#9B7EDE] font-semibold">教練抽成</span>
                                <span className="text-xl font-bold text-[#9B7EDE]">${calculatedCommission.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* 確認勾選 */}
                        <div className="bg-[#2a2a2a] border-2 border-[#F4E76E]/30 rounded-lg p-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="confirm"
                                    checked={isConfirmed}
                                    onChange={(e) => setIsConfirmed(e.target.checked)}
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
                                disabled={loading || !isConfirmed}
                                className="w-full btn-dex py-4 rounded-lg font-bold text-lg uppercase tracking-wider disabled:opacity-50"
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
                        {/* 日期選擇 */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                日期
                            </label>
                            <input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 text-lg font-medium text-white bg-[#2a2a2a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF] appearance-none"
                                style={{ minHeight: '50px', maxHeight: '50px' }}
                                required
                            />
                        </div>

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
                                        {products.length === 0 && <option value="">載入中或無資料...</option>}
                                        {products.map(pkg => (
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
                                        <div className="mt-3 flex justify-between px-2">
                                            <p className="text-sm font-bold text-[#F4E76E]">
                                                總金額: ${(selectedPackage.price * parseInt(quantity)).toLocaleString()}
                                            </p>
                                            {calculatedCommission > 0 && (
                                                <p className="text-sm font-bold text-[#9B7EDE]">
                                                    教練抽成: ${calculatedCommission.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 額外模式 */}
                        {saleType === 'extra' && (
                            <div className="space-y-6">
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
                                <div className="bg-[#2a2a2a] p-4 rounded-xl border border-gray-700">
                                    <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider border-b border-gray-600 pb-2">
                                        售出金額
                                    </label>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">數量</label>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={extraQty}
                                                onChange={(e) => setExtraQty(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="w-full px-3 py-3 text-xl font-bold text-center text-white bg-[#1a1a1a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
                                                placeholder="1"
                                                required
                                            />
                                        </div>
                                        <div className="flex-[2]">
                                            <label className="block text-xs text-gray-500 mb-1">單價</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#F4E76E] text-xl font-bold">
                                                    $
                                                </span>
                                                <input
                                                    type="tel"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    value={extraUnitPrice}
                                                    onChange={(e) => setExtraUnitPrice(e.target.value.replace(/[^0-9]/g, ''))}
                                                    className="w-full pl-8 pr-3 py-3 text-xl font-bold text-[#F4E76E] bg-[#1a1a1a] border-2 border-[#F4E76E]/30 rounded-lg focus:ring-2 focus:ring-[#F4E76E] focus:border-[#F4E76E]"
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {(extraQty && extraUnitPrice) && (
                                        <div className="mt-3 text-right">
                                            <span className="text-xs text-gray-500 mr-2">總額:</span>
                                            <span className="text-lg font-bold text-[#F4E76E]">${totalAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-[#2a2a2a] p-4 rounded-xl border border-[#9B7EDE]/30 shadow-[0_0_15px_rgba(155,126,222,0.1)]">
                                    <div className="flex justify-between items-baseline mb-3 border-b border-gray-600 pb-2">
                                        <label className="text-sm font-bold text-[#9B7EDE] uppercase tracking-wider">
                                            教練抽成
                                        </label>
                                        <span className="text-xs text-gray-400">請先跟老闆確認抽成再來填寫</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9B7EDE] text-2xl font-black">
                                            $
                                        </span>
                                        <input
                                            id="extraCommission"
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={extraCommission}
                                            onChange={(e) => setExtraCommission(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full pl-12 pr-4 py-6 text-4xl font-black text-center text-[#9B7EDE] bg-[#1a1a1a] border-2 border-[#9B7EDE]/50 rounded-lg focus:ring-2 focus:ring-[#9B7EDE] focus:border-[#9B7EDE]"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 下一步按鈕 */}
                        <button
                            onClick={handleNext}
                            disabled={(saleType === 'package' && (!packageId || !quantity)) || (saleType === 'extra' && (!extraUnitPrice || !note || !extraQty))}
                            className="w-full btn-dex py-4 rounded-lg font-bold text-lg uppercase tracking-wider disabled:opacity-50 mt-4"
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
