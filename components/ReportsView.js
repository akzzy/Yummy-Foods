import { useEffect, useState, Fragment, useMemo } from "react";
import { Loader2, ChevronDown, ChevronRight, Calendar, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ReportsView() {
    const [data, setData] = useState({ sales: [], expenses: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [expandedMonths, setExpandedMonths] = useState({});
    const [isSalesOpen, setIsSalesOpen] = useState(false);
    const [isExpensesOpen, setIsExpensesOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});

    useEffect(() => {
        fetch("/api/reports")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load reports");
                return res.json();
            })
            .then((data) => {
                setData(data);

                // Set default month to current month if available, else first available
                const today = new Date();
                const currentMonthName = today.toLocaleString('default', { month: 'short', year: 'numeric' });

                const availableMonths = new Set([
                    ...data.sales.map(s => s.month),
                    ...data.expenses.map(e => e.month)
                ]);

                if (availableMonths.has(currentMonthName)) {
                    setSelectedMonth(currentMonthName);
                } else if (availableMonths.size > 0) {
                    const sortedMonths = Array.from(availableMonths).sort((a, b) => new Date(a) - new Date(b));
                    setSelectedMonth(sortedMonths[sortedMonths.length - 1]);
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    const uniqueMonths = useMemo(() => {
        const months = new Set([
            ...data.sales.map(s => s.month),
            ...data.expenses.map(e => e.month)
        ]);
        return Array.from(months).sort((a, b) => new Date(b) - new Date(a));
    }, [data]);

    const profitData = useMemo(() => {
        if (data.sales.length === 0 && data.expenses.length === 0) return [];

        const months = new Set([
            ...data.sales.map(s => s.month),
            ...data.expenses.map(e => e.month)
        ]);

        return Array.from(months).map(month => {
            const sale = data.sales.find(s => s.month === month);
            const expense = data.expenses.find(e => e.month === month);

            const salesTotal = sale ? sale.total : 0;
            const expenseTotal = expense ? expense.total : 0;

            return {
                month,
                profit: salesTotal - expenseTotal
            };
        }).sort((a, b) => new Date(a.month) - new Date(b.month));

    }, [data]);

    // Filtered Data for Selected Month
    const currentMonthData = useMemo(() => {
        if (!selectedMonth) return null;

        const sale = data.sales.find(s => s.month === selectedMonth);
        const expense = data.expenses.find(e => e.month === selectedMonth);

        return {
            month: selectedMonth,
            salesTotal: sale ? sale.total : 0,
            expenseTotal: expense ? expense.total : 0,
            profit: (sale ? sale.total : 0) - (expense ? expense.total : 0),
            expenseCategories: expense ? expense.categories : {},
            customers: sale ? sale.customers : {}
        };
    }, [data, selectedMonth]);


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p>Loading reports...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* 1. Profit Trend Chart */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                    Profit Trend
                </h2>

                <div className="h-64 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-zinc-900">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={profitData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                            <XAxis
                                dataKey="month"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6B7280' }}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6B7280' }}
                                tickFormatter={(value) => `₹${value.toLocaleString('en-IN', { notation: 'compact' })}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.96)' }}
                                cursor={{ fill: 'transparent' }}
                                formatter={(value) => [`₹ ${value.toLocaleString('en-IN')}`, "Profit"]}
                            />
                            <Bar dataKey="profit" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Month Selector & Summary */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        Monthly Breakdown
                    </h2>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="block w-40 rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-black sm:text-sm sm:leading-6 dark:bg-zinc-900 dark:ring-zinc-700 dark:text-white"
                    >
                        {uniqueMonths.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* Summary Cards */}
                {currentMonthData ? (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl">
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wider">Sales</p>
                            <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
                                ₹ {currentMonthData.salesTotal.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
                            <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wider">Expense</p>
                            <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">
                                ₹ {currentMonthData.expenseTotal.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Net Profit</p>
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                                ₹ {currentMonthData.profit.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">No data for selected month</div>
                )}
            </div>

            {/* 3. Detailed Lists (Collapsible) */}
            {currentMonthData && (
                <div className="grid md:grid-cols-2 gap-8">

                    {/* Sales Report (Collapsible) */}
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden h-fit">
                        <button
                            onClick={() => setIsSalesOpen(!isSalesOpen)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales</h3>
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 ml-2">
                                    {selectedMonth}
                                </span>
                            </div>
                            {isSalesOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                        </button>

                        {isSalesOpen && (
                            <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
                                {(!currentMonthData.customers || Object.keys(currentMonthData.customers).length === 0) ? (
                                    <div className="p-8 text-center text-sm text-gray-400">
                                        No sales data found for this month
                                    </div>
                                ) : (
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
                                            <tr>
                                                <th className="px-4 py-3">Customer Name</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {Object.entries(currentMonthData.customers)
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([name, amount]) => (
                                                    <tr key={name} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">
                                                            {name}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                                            ₹ {amount.toLocaleString('en-IN')}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800 font-semibold">
                                            <tr>
                                                <td className="px-4 py-3 text-gray-900 dark:text-white">Total</td>
                                                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                                                    ₹ {currentMonthData.salesTotal.toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Expense Report (Collapsible & Nested) */}
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden h-fit">
                        <button
                            onClick={() => setIsExpensesOpen(!isExpensesOpen)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-6 bg-red-500 rounded-full"></span>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense</h3>
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 ml-2">
                                    {selectedMonth}
                                </span>
                            </div>
                            {isExpensesOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                        </button>

                        {isExpensesOpen && (
                            <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
                                {Object.keys(currentMonthData.expenseCategories).length === 0 ? (
                                    <div className="p-8 text-center text-sm text-gray-400">
                                        No expense data found for this month
                                    </div>
                                ) : (
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
                                            <tr>
                                                <th className="px-4 py-3">Category</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {Object.entries(currentMonthData.expenseCategories)
                                                .sort(([, a], [, b]) => b.total - a.total)
                                                .map(([cat, data]) => (
                                                    <Fragment key={cat}>
                                                        {/* Parent Row */}
                                                        <tr
                                                            onClick={() => toggleCategory(cat)}
                                                            className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer group"
                                                        >
                                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
                                                                {expandedCategories[cat] ?
                                                                    <ChevronDown className="w-4 h-4 text-gray-400" /> :
                                                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                                }
                                                                {cat}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                                                                ₹ {data.total.toLocaleString('en-IN')}
                                                            </td>
                                                        </tr>

                                                        {/* Child Rows (Items) */}
                                                        {expandedCategories[cat] && Object.entries(data.items).map(([desc, amount]) => (
                                                            <tr key={cat + desc} className="bg-gray-50/50 dark:bg-gray-900/20">
                                                                <td className="px-4 py-2 pl-10 text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                                                                    {desc}
                                                                </td>
                                                                <td className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">
                                                                    ₹ {amount.toLocaleString('en-IN')}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </Fragment>
                                                ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800 font-semibold">
                                            <tr>
                                                <td className="px-4 py-3 text-gray-900 dark:text-white">Total</td>
                                                <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                                                    ₹ {currentMonthData.expenseTotal.toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
