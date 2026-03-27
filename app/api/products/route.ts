import { NextResponse } from 'next/server'
import { getDAL } from '@/lib/dal'

/**
 * GET /api/products
 * 查詢所有商品
 */
export async function GET() {
    try {
        const dal = getDAL()
        const products = await dal.products.findAll()

        return NextResponse.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json(
            { error: '查詢商品失敗' },
            { status: 500 }
        )
    }
}
