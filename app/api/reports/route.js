import { NextResponse } from 'next/server';
import { getRows, ensureReportSheets } from '@/lib/googleSheets';

export async function GET() {
    try {
        // Fetch raw data from the main storage sheets
        const [salesRows, expenseRows] = await Promise.all([
            getRows("Sales"),
            getRows("Expenses")
        ]);

        // Helper to get "Jan 2026" from "2026-01-25"
        const getMonthKey = (dateStr) => {
            if (!dateStr) return null;
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return null;
                return date.toLocaleString('default', { month: 'short', year: 'numeric' });
            } catch (e) {
                return null;
            }
        };

        // 1. Process Sales: Group by Month -> Customer
        const salesAgg = {};

        salesRows.forEach(row => {
            const dateStr = row["Date"];
            const customer = row["Customer"] || "Unknown";
            const amount = parseFloat(row["Total Amount"]?.replace(/[^\d.-]/g, '') || 0);

            const month = getMonthKey(dateStr);
            if (!month) return;

            if (!salesAgg[month]) {
                salesAgg[month] = {
                    key: month,
                    month: month,
                    total: 0,
                    customers: {}
                };
            }

            salesAgg[month].total += amount;
            salesAgg[month].customers[customer] = (salesAgg[month].customers[customer] || 0) + amount;
        });

        // 2. Process Expenses: Group by Month -> Category
        const expenseAgg = {};

        expenseRows.forEach(row => {
            const dateStr = row["Date"];
            const category = row["Category"] || "Uncategorized";
            // Normalize description: lowercase and default to "General" if empty
            const description = (row["Description"] || "General").toLowerCase().trim();
            const amount = parseFloat(row["Amount"]?.replace(/[^\d.-]/g, '') || 0);

            const month = getMonthKey(dateStr);
            if (!month) return;

            if (!expenseAgg[month]) {
                expenseAgg[month] = {
                    key: month,
                    month: month,
                    total: 0,
                    categories: {}
                };
            }

            expenseAgg[month].total += amount;

            // Initialize Category if not exists
            if (!expenseAgg[month].categories[category]) {
                expenseAgg[month].categories[category] = {
                    total: 0,
                    items: {}
                };
            }

            // Update Category Total
            expenseAgg[month].categories[category].total += amount;

            // Update Description Total
            expenseAgg[month].categories[category].items[description] =
                (expenseAgg[month].categories[category].items[description] || 0) + amount;
        });

        const salesReport = Object.values(salesAgg);
        const expenseReport = Object.values(expenseAgg);

        return NextResponse.json({ sales: salesReport, expenses: expenseReport }, { status: 200 });

    } catch (error) {
        console.error('Reports API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
