import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'DEXsystem - 教練管理系統',
    description: '健身房教練點名、銷售記錄管理系統',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh-TW">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
