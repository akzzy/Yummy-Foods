
import { NextResponse } from 'next/server';
import { getExpenseCategories } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic'; // Ensure it's not cached at build time

export async function GET() {
    try {
        const categories = await getExpenseCategories();
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}
