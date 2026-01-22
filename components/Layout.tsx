import React, { ReactNode } from 'react';
import { LayoutDashboard, FileText, Users, TrendingUp, Settings, Menu, Bell } from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onNewInvoice: () => void;
}

const SidebarItem = ({ icon: Icon, label, id, active, onClick }: any) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
            active 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
    >
        <Icon size={18} />
        <span>{label}</span>
    </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onNewInvoice }) => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
                <div className="p-6 border-b border-slate-800 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">VendorFlow</h1>
                        <p className="text-xs text-slate-500">Finance & Forecast</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" id="dashboard" active={activeTab === 'dashboard'} onClick={onTabChange} />
                    <SidebarItem icon={FileText} label="Invoices" id="invoices" active={activeTab === 'invoices'} onClick={onTabChange} />
                    <SidebarItem icon={Users} label="Vendors" id="vendors" active={activeTab === 'vendors'} onClick={onTabChange} />
                    <SidebarItem icon={TrendingUp} label="Forecasting" id="forecast" active={activeTab === 'forecast'} onClick={onTabChange} />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <SidebarItem icon={Settings} label="Settings" id="settings" active={activeTab === 'settings'} onClick={onTabChange} />
                    <div className="mt-4 flex items-center space-x-3 px-4">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                            JD
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">John Doe</p>
                            <p className="text-xs text-slate-500">Finance Manager</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
                    <h2 className="text-xl font-semibold text-slate-800 capitalize">
                        {activeTab} Overview
                    </h2>
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <button 
                            onClick={onNewInvoice}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                        >
                            + New Invoice
                        </button>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};