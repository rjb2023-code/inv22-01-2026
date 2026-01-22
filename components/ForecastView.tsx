import React, { useState, useMemo } from 'react';
import { Invoice, PaymentSchedule, InvoiceStatus, Vendor, Currency } from '../types';
import { Calendar, Sliders, RefreshCw, Download, BarChart2, TrendingUp } from 'lucide-react';

interface ForecastViewProps {
    invoices: Invoice[];
    vendors: Vendor[];
    schedules: PaymentSchedule[];
}

interface MonthlyProjection {
    label: string;
    amount: number;
    count: number;
    color: string;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ invoices, vendors, schedules }) => {
    // Scenario State
    const [scenarioDelay, setScenarioDelay] = useState<number>(0);
    
    const addDays = (dateStr: string, days: number): string => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    // Prepare Date & Amount helpers
    const getMonthKey = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const getMonthLabel = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Main Calculations
    const { forecastData, monthlyProjections } = useMemo(() => {
        const buckets: Record<string, { date: string, amount: number, count: number, details: any[] }> = {};
        
        // Define Monthly Projection Buckets
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const monthPlus2 = new Date(today.getFullYear(), today.getMonth() + 2, 1);
        const monthPlus3 = new Date(today.getFullYear(), today.getMonth() + 3, 1);
        
        const monthlyGroups: Record<string, MonthlyProjection> = {
            [getMonthKey(nextMonth.toISOString())]: { label: getMonthLabel(nextMonth), amount: 0, count: 0, color: 'bg-blue-50 border-blue-200 text-blue-700' },
            [getMonthKey(monthPlus2.toISOString())]: { label: getMonthLabel(monthPlus2), amount: 0, count: 0, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
            [getMonthKey(monthPlus3.toISOString())]: { label: getMonthLabel(monthPlus3), amount: 0, count: 0, color: 'bg-purple-50 border-purple-200 text-purple-700' },
        };

        invoices.forEach(inv => {
            if ((inv.status === InvoiceStatus.APPROVED || inv.status === InvoiceStatus.SCHEDULED)) {
                const schedule = schedules.find(s => s.invoice_id === inv.id);
                let baseDate = schedule ? schedule.planned_payment_date : inv.due_date;
                const adjustedDate = addDays(baseDate, scenarioDelay);
                
                // Value Calculation
                let amount = inv.amount + inv.tax_amount;
                if (inv.currency === Currency.USD) amount *= 15000;

                // 1. Daily Forecast Table
                if (!buckets[adjustedDate]) {
                    buckets[adjustedDate] = { date: adjustedDate, amount: 0, count: 0, details: [] };
                }
                buckets[adjustedDate].amount += amount;
                buckets[adjustedDate].count += 1;
                buckets[adjustedDate].details.push({
                    invNo: inv.invoice_number,
                    vendor: vendors.find(v => v.id === inv.vendor_id)?.name,
                    origAmount: inv.amount,
                    currency: inv.currency
                });

                // 2. Monthly Grouping
                const mKey = getMonthKey(adjustedDate);
                if (monthlyGroups[mKey]) {
                    monthlyGroups[mKey].amount += amount;
                    monthlyGroups[mKey].count += 1;
                }
            }
        });

        return {
            forecastData: Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date)),
            monthlyProjections: Object.values(monthlyGroups)
        };
    }, [invoices, schedules, vendors, scenarioDelay]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Cash Flow Forecasting</h2>
                    <p className="text-slate-500">Projected outgoing payments based on approved invoices.</p>
                </div>
                <button className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                    <Download size={16} />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Scenario Simulation Control */}
            <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sliders size={120} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                        <RefreshCw size={18} />
                        <span>Scenario Simulator</span>
                    </h3>
                    <p className="text-indigo-200 text-sm mt-1 mb-4 max-w-xl">
                        Adjust payment schedules globally to see the impact on daily cash flow without modifying actual invoice data.
                    </p>
                    
                    <div className="flex items-center space-x-6">
                        <div className="flex flex-col space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Global Payment Delay</label>
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={() => setScenarioDelay(prev => prev - 7)}
                                    className="w-8 h-8 rounded-full bg-indigo-700 hover:bg-indigo-600 flex items-center justify-center font-bold"
                                >-</button>
                                <span className="text-xl font-mono min-w-[3rem] text-center">
                                    {scenarioDelay > 0 ? `+${scenarioDelay}` : scenarioDelay} d
                                </span>
                                <button 
                                    onClick={() => setScenarioDelay(prev => prev + 7)}
                                    className="w-8 h-8 rounded-full bg-indigo-700 hover:bg-indigo-600 flex items-center justify-center font-bold"
                                >+</button>
                            </div>
                        </div>
                        
                        {scenarioDelay !== 0 && (
                            <div className="bg-indigo-800/50 px-4 py-2 rounded-lg border border-indigo-500/30 text-sm text-indigo-200">
                                ⚠️ Simulation Mode Active: All payments shifted by {scenarioDelay} days.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly Projections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {monthlyProjections.map((month, idx) => (
                    <div key={idx} className={`p-6 rounded-xl border ${month.color} shadow-sm flex flex-col justify-between`}>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-lg">{month.label}</h4>
                                <Calendar size={20} className="opacity-50" />
                            </div>
                            <p className="text-sm opacity-80 mb-4">{month.count} Scheduled Payments</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase opacity-70 mb-1">Projected Outflow</p>
                            <p className="text-2xl font-bold">{formatCurrency(month.amount)}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Forecast Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        Detailed Daily Forecast
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Projected Date</th>
                                <th className="px-6 py-4 font-semibold">Day</th>
                                <th className="px-6 py-4 font-semibold">Vendor Count</th>
                                <th className="px-6 py-4 font-semibold">Total Projected Outflow (IDR Eq)</th>
                                <th className="px-6 py-4 font-semibold">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {forecastData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        <div className="flex items-center space-x-2">
                                            <Calendar size={16} className="text-slate-400" />
                                            <span>{new Date(row.date).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {row.count} Invoices
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-800">
                                        {formatCurrency(row.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {row.details.slice(0, 2).map((d: any, i: number) => (
                                            <div key={i}>{d.vendor} ({d.currency} {d.origAmount.toLocaleString()})</div>
                                        ))}
                                        {row.details.length > 2 && <span className="text-slate-400 italic">+{row.details.length - 2} more...</span>}
                                    </td>
                                </tr>
                            ))}
                            {forecastData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No upcoming payments found for the current criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};