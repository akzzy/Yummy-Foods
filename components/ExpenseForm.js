"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { getLocalDate } from "@/lib/utils";

const EXPENSE_CATEGORIES = [
    "Gas",
    "Groceries",
    "Packaging",
    "Wages",
    "Rice Mill",
    "Miscellaneous"
];

export function ExpenseForm({ onSubmit, loading }) {
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            date: getLocalDate(),
            category: EXPENSE_CATEGORIES[0]
        }
    });

    const handleLocalSubmit = async (data) => {
        const success = await onSubmit(data);
        if (success) {
            setValue("category", EXPENSE_CATEGORIES[0]);
            setValue("description", "");
            setValue("amount", "");
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

            {/* Category */}
            <div className="space-y-1.5">
                <label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Category
                </label>
                <select
                    id="category"
                    className="w-full px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all text-sm appearance-none"
                    {...register("category", { required: true })}
                >
                    {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-white dark:bg-black">
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Description
                </label>
                <input
                    id="description"
                    placeholder="Optional details"
                    className="w-full px-3 py-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all text-sm"
                    {...register("description")}
                />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
                <label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Amount
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">₹</span>
                    <input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 bg-transparent border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 transition-all text-sm"
                        {...register("amount", { required: true, min: 0.01 })}
                    />
                </div>
                {errors.amount && <p className="text-xs text-red-500">Invalid amount</p>}
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
