"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { SalesForm } from "@/components/SalesForm";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ReportsView } from "@/components/ReportsView";

export default function Home() {
  const [mode, setMode] = useState("sales"); // 'sales' | 'expense' | 'reports'
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          data: data
        }),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Failed to submit");
      }

      setStatus("success");
      // Forms handle their own reset ideally, or we can force remount
      // For simplicity, we can just show success message for a bit
      setTimeout(() => setStatus(null), 3000);
      return true;

    } catch (error) {
      console.error(error);
      setStatus("error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-24 sm:pt-32 p-6 bg-white dark:bg-black transition-colors duration-300">

      {/* Top Right Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Yummy Foods
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg mb-8">
          <button
            onClick={() => setMode("sales")}
            className={`py-2 text-sm font-medium rounded-md transition-all ${mode === "sales" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Sales
          </button>
          <button
            onClick={() => setMode("expense")}
            className={`py-2 text-sm font-medium rounded-md transition-all ${mode === "expense" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Expenses
          </button>
          <button
            onClick={() => setMode("reports")}
            className={`py-2 text-sm font-medium rounded-md transition-all ${mode === "reports" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            Reports
          </button>
        </div>

        {/* Status Messages */}
        {status === "success" && (
          <div className="mb-6 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300 animate-in fade-in slide-in-from-top-1">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <p className="font-medium">Saved successfully.</p>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>Something went wrong.</p>
          </div>
        )}

        {/* Dynamic Form */}
        {mode === "sales" ? (
          <SalesForm key="sales-form" onSubmit={onSubmit} loading={loading} />
        ) : mode === "expense" ? (
          <ExpenseForm key="expense-form" onSubmit={onSubmit} loading={loading} />
        ) : (
          <ReportsView />
        )}

      </div>
    </main>
  );
}
