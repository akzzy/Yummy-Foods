"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getLocalDate } from "@/lib/utils";

export function SalesForm({ onSubmit, loading }) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            date: getLocalDate(),
            quantity: 1
        }
    });

    const quantity = watch("quantity");
    const unitPrice = watch("unitPrice");
    const [total, setTotal] = useState(0);

    // Auto-calculate total
    useEffect(() => {
        const q = parseFloat(quantity) || 0;
        const p = parseFloat(unitPrice) || 0;
        const t = q * p;
        setTotal(t);
        setValue("totalAmount", t);
    }, [quantity, unitPrice, setValue]);

    const handleLocalSubmit = async (data) => {
        const success = await onSubmit(data);
        if (success) {
            // Reset fields but keep date
            setValue("customer", "");
            setValue("unitPrice", "");
            setValue("quantity", 1);
            setTotal(0); // Reset total state
            // We don't touch date, so it stays as current selection
        }
    };

    return (
        <form onSubmit={handleSubmit(handleLocalSubmit)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Date */}
            <div className="space-y-1.5">
                <label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Date
                </label>
                <input
                    id="date"
                    type="date"
                    className="w-full px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all text-sm [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
                    {...register("date", { required: true })}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                />
                {errors.date && <p className="text-xs text-red-500">Date is required</p>}
            </div>

            {/* Customer Name */}
            <div className="space-y-1.5">
                <label htmlFor="customer" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Customer Name
                </label>
                <input
                    id="customer"
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all text-sm"
                    {...register("customer", {
                        required: true,
                    })}
                />
                {errors.customer && <p className="text-xs text-red-500">Customer name is required</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div className="space-y-1.5">
                    <label htmlFor="quantity" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Quantity
                    </label>
                    <input
                        id="quantity"
                        type="number"
                        min="1"
                        step="any"
                        placeholder="0"
                        className="w-full px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all text-sm"
                        {...register("quantity", { required: true, min: 1 })}
                    />
                    {errors.quantity && <p className="text-xs text-red-500">Invalid qty</p>}
                </div>

                {/* Unit Price */}
                <div className="space-y-1.5">
                    <label htmlFor="unitPrice" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Unit Price
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">₹</span>
                        <input
                            id="unitPrice"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all text-sm"
                            {...register("unitPrice", { required: true, min: 0.01 })}
                        />
                    </div>
                    {errors.unitPrice && <p className="text-xs text-red-500">Invalid price</p>}
                </div>
            </div>

            {/* Total Amount (Read Only) */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between items-center border border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-black dark:bg-white text-white dark:text-black font-medium text-sm rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
            </button>
        </form>
    );
}
