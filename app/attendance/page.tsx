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
            setMessage('❌ 提交失敗，請稍後再試')
            setLoading(false)
        }
    }

    const selectedTeacher = teachers.find(t => t.id === teacherId)
    const selectedCourse = courses.find(c => c.id === courseId)

    if (step === 'confirm') {
        return (
            <div className="min-h-screen bg-[#1a1a1a] py-12 px-4">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black uppercase text-[#F4E76E]" style={{ textShadow: '1px 1px 0px #9B7EDE' }}>確認點名資訊</h1>
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
                                <span className="text-gray-400">課程</span>
                                <span className="text-lg font-bold text-white">{selectedCourse?.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-700">
                                <span className="text-gray-400">上課人數</span>
                                <span className="text-2xl font-black text-[#7FDBFF]">{studentCount} 人</span>
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
        <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
            <div className="container mx-auto max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black uppercase text-[#F4E76E]" style={{ textShadow: '1px 1px 0px #9B7EDE' }}>點名記錄</h1>
                    <p className="mt-2 text-sm text-gray-400 uppercase tracking-wider">記錄今日上課人數</p>
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

                        {/* 課程選擇 */}
                        <div>
                            <label htmlFor="course" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                課程
                            </label>
                            <select
                                id="course"
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                                className="w-full px-4 py-3 text-lg font-medium text-white bg-[#2a2a2a] border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
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
                            <label htmlFor="studentCount" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                上課人數
                            </label>
                            <input
                                id="studentCount"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={studentCount}
                                onChange={(e) => setStudentCount(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full px-4 py-6 text-4xl font-black text-center text-[#7FDBFF] bg-[#2a2a2a] border-2 border-[#7FDBFF]/30 rounded-lg focus:ring-2 focus:ring-[#7FDBFF] focus:border-[#7FDBFF]"
                                placeholder="0"
                                required
                            />
                        </div>

                        {/* 下一步按鈕 */}
                        <button
                            onClick={handleNext}
                            disabled={!studentCount}
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
