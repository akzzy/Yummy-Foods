import { NextResponse } from 'next/server';
import { addRow } from '@/lib/googleSheets';
import { z } from 'zod';

// Validation Schema
const expenseSchema = z.object({
    date: z.string(),
    category: z.string(),
    description: z.string().optional(),
    amount: z.coerce.number().positive(),
});

const salesSchema = z.object({
    date: z.string(),
    customer: z.string(),
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().positive(),
    totalAmount: z.coerce.number().positive(),
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { type, data } = body;

        let sheetName = "";
        let rowData = {};

        if (type === 'expense') {
            const result = expenseSchema.safeParse(data);
            if (!result.success) {
                return NextResponse.json({ error: "Validation Error", details: result.error.flatten() }, { status: 400 });
            }

            sheetName = "Expenses";
            rowData = {
                Date: result.data.date,
                Category: result.data.category,
                Description: result.data.description || "",
                Amount: result.data.amount
            };
        } else if (type === 'sales') {
            const result = salesSchema.safeParse(data);
            if (!result.success) {
                return NextResponse.json({ error: "Validation Error", details: result.error.flatten() }, { status: 400 });
            }

            sheetName = "Sales";
            rowData = {
                Date: result.data.date,
                Customer: result.data.customer,
                Quantity: result.data.quantity,
                "Unit Price": result.data.unitPrice,
                "Total Amount": result.data.totalAmount
            };
        } else {
            return NextResponse.json({ error: 'Invalid submission type' }, { status: 400 });
        }

        // Append to Google Sheet
        const sheetResult = await addRow(sheetName, rowData);

        if (!sheetResult.success) {
            throw new Error(sheetResult.error);
        }

        return NextResponse.json({ message: 'Entry added successfully!' }, { status: 200 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save entry.' },
            { status: 500 }
        );
    }
}
