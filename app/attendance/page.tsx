'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Course {
    id: string
    name: string
}

interface Teacher {
    id: string
    name: string
}

export default function AttendancePage() {
    const router = useRouter()
    const [step, setStep] = useState<'form' | 'confirm'>('form')

    // 表單資料
    const [teacherId, setTeacherId] = useState('')
    const [courseId, setCourseId] = useState('')
    const [studentCount, setStudentCount] = useState('')

    // 選項資料
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [courses, setCourses] = useState<Course[]>([])

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    // 載入教練和課程列表
    useEffect(() => {
        Promise.all([
            fetch('/api/teachers').then(res => res.json()),
            fetch('/api/courses').then(res => res.json())
        ]).then(([teachersData, coursesData]) => {
            setTeachers(teachersData)
            setCourses(coursesData)
            if (teachersData.length > 0) setTeacherId(teachersData[0].id)
            if (coursesData.length > 0) setCourseId(coursesData[0].id)
        }).catch(err => console.error('Error loading data:', err))
    }, [])

    const handleNext = () => {
        if (!teacherId || !courseId || !studentCount) {
            setMessage('請填寫所有欄位')
            return
        }
        setStep('confirm')
    }

    const handleSubmit = async () => {
        setLoading(true)
        setMessage('')

        try {
            const response = await fetch('/api/attendances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString().split('T')[0],
                    coachId: teacherId,
                    courseId,
                    studentCount: parseInt(studentCount),
                }),
            })

            if (!response.ok) throw new Error('提交失敗')

            const data = await response.json()

            // 成功後跳轉到成功頁面
            router.push(`/attendance/success?salary=${data.calculatedSalary}`)
        } catch (error) {
            setMessage('❌ 提交失敗,請稍後再試')
            setLoading(false)
        }
    }

    const selectedTeacher = teachers.find(t => t.id === teacherId)
    const selectedCourse = courses.find(c => c.id === courseId)

    if (step === 'confirm') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">確認點名資訊</h1>
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
                                <span className="text-gray-600">課程</span>
                                <span className="text-lg font-bold text-gray-900">{selectedCourse?.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">上課人數</span>
                                <span className="text-2xl font-bold text-blue-600">{studentCount} 人</span>
                            </div>
                        </div>

                        {/* 確認勾選 */}
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="confirm"
                                    className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
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
                                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
        <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
            <div className="container mx-auto max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">點名記錄</h1>
                    <p className="mt-2 text-sm text-gray-600">記錄今日上課人數</p>
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
                                className="w-full px-4 py-3 text-lg font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 課程選擇 */}
                        <div>
                            <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                                課程
                            </label>
                            <select
                                id="course"
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                                className="w-full px-4 py-3 text-lg font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 上課人數 */}
                        <div>
                            <label htmlFor="studentCount" className="block text-sm font-medium text-gray-700 mb-2">
                                上課人數
                            </label>
                            <input
                                id="studentCount"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={studentCount}
                                onChange={(e) => setStudentCount(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full px-4 py-6 text-4xl font-bold text-center text-gray-900 bg-white border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0"
                                required
                            />
                        </div>

                        {/* 下一步按鈕 */}
                        <button
                            onClick={handleNext}
                            disabled={!studentCount}
                            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

                {/* 薪資規則 */}
                <div className="mt-6 bg-white rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">薪資計算規則</h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• 1-5 人: $500</li>
                        <li>• 6-10 人: $800</li>
                        <li>• 11-15 人: $1,200</li>
                        <li>• 16 人以上: $1,500</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
