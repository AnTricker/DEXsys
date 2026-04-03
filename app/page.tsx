import Link from 'next/link'

export default function Home() {
    return (
        <div className="min-h-screen bg-[#1a1a1a] relative overflow-hidden">
            {/* 背景裝飾 */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-10 w-64 h-64 bg-[#9B7EDE] rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#7FDBFF] rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-[#F4E76E] rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 py-16 relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-6xl md:text-8xl font-black uppercase mb-6 title-graffiti float-animation">
                        DEX
                    </h1>
                    <p className="text-2xl md:text-3xl font-bold text-[#7FDBFF] neon-glow uppercase tracking-wider">
                        教練管理系統
                    </p>
                    <p className="text-lg text-gray-400 mt-4 uppercase tracking-wide">
                        dance extreme 2025
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {/* 點名 */}
                    <Link
                        href="/attendance"
                        className="card-dex rounded-2xl p-8 hover:scale-105 transition-all duration-300 group"
                    >
                        <div className="flex flex-col items-center">
                            <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">✅</div>
                            <h2 className="text-3xl font-black uppercase text-[#F4E76E] mb-3 group-hover:text-[#7FDBFF] transition-colors">
                                點名
                            </h2>
                            <p className="text-gray-400 text-center uppercase text-sm tracking-wider">
                                Record Attendance
                            </p>
                        </div>
                    </Link>

                    {/* 銷售 */}
                    <Link
                        href="/sales"
                        className="card-dex rounded-2xl p-8 hover:scale-105 transition-all duration-300 group pulse-glow"
                    >
                        <div className="flex flex-col items-center">
                            <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">💰</div>
                            <h2 className="text-3xl font-black uppercase text-[#F4E76E] mb-3 group-hover:text-[#7FDBFF] transition-colors">
                                銷售
                            </h2>
                            <p className="text-gray-400 text-center uppercase text-sm tracking-wider">
                                Sales Record
                            </p>
                        </div>
                    </Link>

                    {/* 查詢 */}
                    <Link
                        href="/search"
                        className="card-dex rounded-2xl p-8 hover:scale-105 transition-all duration-300 group"
                        style={{ borderColor: '#9B7EDE', boxShadow: '6px 6px 0px #F4E76E' }}
                    >
                        <div className="flex flex-col items-center">
                            <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">🔍</div>
                            <h2 className="text-3xl font-black uppercase text-[#9B7EDE] mb-3 group-hover:text-[#F4E76E] transition-colors">
                                查詢
                            </h2>
                            <p className="text-gray-400 text-center uppercase text-sm tracking-wider">
                                Search Records
                            </p>
                        </div>
                    </Link>
                </div>

                {/* 底部裝飾 */}
                <div className="mt-20 text-center">
                    <div className="inline-block px-8 py-3 border-2 border-[#9B7EDE] rounded-full">
                        <p className="text-[#9B7EDE] font-bold uppercase tracking-widest text-sm">
                            powered by An
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
