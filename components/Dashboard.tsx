import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Invoice, PaymentSchedule, InvoiceStatus } from '../types';
import { ArrowUpRight, AlertCircle, CheckCircle, Wallet } from 'lucide-react';

interface DashboardProps {
    invoices: Invoice[];
    schedules: PaymentSchedule[];
}

export const Dashboard: React.FC<DashboardProps> = ({ invoices, schedules }) => {

    const metrics = useMemo(() => {
        const totalOutstanding = invoices
            .filter(i => i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.REJECTED && i.status !== InvoiceStatus.DRAFT)
            .reduce((sum, inv) => sum + inv.amount, 0);

        const overdueCount = invoices.filter(i => {
            const dueDate = new Date(i.due_date);
            const today = new Date();
            return dueDate < today && i.status !== InvoiceStatus.PAID;
        }).length;

        const scheduledAmount = invoices
            .filter(i => i.status === InvoiceStatus.SCHEDULED)
            .reduce((sum, inv) => sum + inv.amount, 0);

        return { totalOutstanding, overdueCount, scheduledAmount };
    }, [invoices]);

    // Prepare chart data (Next 30 days cash flow)
    const chartData = useMemo(() => {
        const today = new Date();
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        const dataMap = new Map<string, number>();

        // Initialize next 7 intervals (approx weeks or specific days)
        // Simple daily aggregation for the next 14 days
        for(let i=0; i<14; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            dataMap.set(d.toISOString().split('T')[0], 0);
        }

        schedules.forEach(sch => {
            if (sch.payment_status === 'PENDING') {
                const dateKey = sch.planned_payment_date;
                if (dataMap.has(dateKey)) {
                    const inv = invoices.find(i => i.id === sch.invoice_id);
                    if (inv) {
                         // Simplify currency conversion for chart demo (assume 1 USD = 15000 IDR)
                         let amount = inv.amount + inv.tax_amount;
                         if (inv.currency === 'USD') amount = amount * 15000;
                         
                         dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + amount);
                    }
                }
            }
        });

        return Array.from(dataMap.entries())
            .map(([date, amount]) => ({
                date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                amount: amount,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [invoices, schedules]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Outstanding</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(metrics.totalOutstanding)}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Wallet className="text-blue-600" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 font-medium flex items-center">
                            <ArrowUpRight size={16} className="mr-1" />
                            12%
                        </span>
                        <span className="text-slate-400 ml-2">vs last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Overdue Invoices</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-2">{metrics.overdueCount}</h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-red-600">
                        Needs immediate attention
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Scheduled for Payment</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(metrics.scheduledAmount)}</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <CheckCircle className="text-emerald-600" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-slate-500">
                        Ready for disbursement
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Cash Flow Forecast (14 Days)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${val / 1000000}M`} />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val: number) => formatCurrency(val)}
                                />
                                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions / Recent Activity */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Pending Approval</h3>
                    <div className="space-y-4">
                        {invoices.filter(i => i.status === InvoiceStatus.SUBMITTED).map(inv => (
                            <div key={inv.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-300 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start">
                                    <span className="font-medium text-slate-800 group-hover:text-blue-600">{inv.invoice_number}</span>
                                    <span className="text-xs text-slate-500">{new Date(inv.invoice_date).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-1 flex justify-between items-center">
                                    <span className="text-sm text-slate-600">{formatCurrency(inv.amount)}</span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Submitted</span>
                                </div>
                            </div>
                        ))}
                        {invoices.filter(i => i.status === InvoiceStatus.SUBMITTED).length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">No pending approvals</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};