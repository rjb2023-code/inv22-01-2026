import React, { useState, useMemo, useRef } from 'react';
import { Invoice, Vendor, InvoiceStatus, PaymentSchedule, Currency } from '../types';
import { InvoicePolicy } from '../policies/InvoicePolicy';
import { MoreHorizontal, FileText, Clock, Pencil, Trash2, Filter, X, ExternalLink, AlertCircle, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { InvoiceService } from '../services/invoiceService';

interface InvoiceListProps {
    invoices: Invoice[];
    vendors: Vendor[];
    schedules: PaymentSchedule[];
    onEdit: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onViewVendor: (vendorId: string) => void;
    onImport: (invoices: Invoice[]) => void;
}

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
    const styles = {
        [InvoiceStatus.DRAFT]: 'bg-slate-100 text-slate-600',
        [InvoiceStatus.SUBMITTED]: 'bg-yellow-100 text-yellow-700',
        [InvoiceStatus.APPROVED]: 'bg-blue-100 text-blue-700',
        [InvoiceStatus.SCHEDULED]: 'bg-purple-100 text-purple-700',
        [InvoiceStatus.PAID]: 'bg-green-100 text-green-700',
        [InvoiceStatus.REJECTED]: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
            {status}
        </span>
    );
};

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, vendors, schedules, onEdit, onDelete, onViewVendor, onImport }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVendorSearch, setFilterVendorSearch] = useState(''); // Text for autocomplete
    const [filterVendorId, setFilterVendorId] = useState(''); // Selected ID
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Autocomplete Logic
    const vendorSuggestions = useMemo(() => {
        if (!filterVendorSearch) return [];
        return vendors.filter(v => v.name.toLowerCase().includes(filterVendorSearch.toLowerCase()));
    }, [vendors, filterVendorSearch]);

    const getVendorName = (id: string) => vendors.find(v => v.id === id)?.name || 'Unknown Vendor';

    // Revised Aging Calculation: Entry Date to Paid Date (or Today)
    const getAging = (invoice: Invoice) => {
        const entry = new Date(invoice.entry_date);
        const schedule = schedules.find(s => s.invoice_id === invoice.id);
        
        let endDate = new Date();
        if (invoice.status === InvoiceStatus.PAID && schedule?.actual_payment_date) {
            endDate = new Date(schedule.actual_payment_date);
        } else if (invoice.status === InvoiceStatus.PAID) {
            endDate = new Date(); 
        }

        // Reset time
        entry.setHours(0,0,0,0);
        endDate.setHours(0,0,0,0);

        const diffTime = endDate.getTime() - entry.getTime();
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (invoice.status === InvoiceStatus.PAID) {
             return { text: `${days} Days (Closed)`, color: 'text-green-600' };
        }
        
        // Active Aging
        let color = 'text-slate-600';
        if (days > 30) color = 'text-orange-600';
        if (days > 60) color = 'text-red-600';
        
        return { text: `${days} Days Active`, color: color };
    };

    const handleVendorSelect = (v: Vendor) => {
        setFilterVendorId(v.id);
        setFilterVendorSearch(v.name);
    }

    const resetFilters = () => {
        setSearchTerm('');
        setFilterVendorId('');
        setFilterVendorSearch('');
        setFilterStatus('');
        setFilterDateStart('');
        setFilterDateEnd('');
    };
    
    // Link Handler
    const handleInvoiceClick = (e: React.MouseEvent, docName: string) => {
        e.preventDefault();
        e.stopPropagation();
        alert(`Opening Invoice Document: ${docName}\n\n(In a real implementation, this would open the PDF viewer)`);
    }

    // --- Export Logic ---
    const handleExport = () => {
        const headers = ['Invoice Number', 'PO Number', 'Vendor Name', 'Entry Date', 'Due Date', 'Amount', 'Currency', 'Status', 'Aging'];
        
        const csvContent = filteredInvoices.map(inv => {
            const vendorName = getVendorName(inv.vendor_id).replace(/,/g, ''); // Remove commas to prevent CSV breakage
            const aging = getAging(inv).text;
            return [
                inv.invoice_number,
                inv.po_number || '',
                vendorName,
                inv.entry_date,
                inv.due_date,
                inv.amount,
                inv.currency,
                inv.status,
                aging
            ].join(',');
        });

        const csvString = [headers.join(','), ...csvContent].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Import Logic ---
    const triggerImport = () => fileInputRef.current?.click();

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            if (!text) return;

            // Simple CSV Parse (Assumes standard CSV format)
            const lines = text.split('\n');
            const newInvoices: Invoice[] = [];
            
            // Skip Header (row 0)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Expected Order: Invoice No, PO, Vendor Name, Entry Date, Due Date, Amount, Currency, Status...
                const cols = line.split(',');
                if (cols.length < 6) continue;

                const invNo = cols[0];
                const poNo = cols[1];
                const vendorName = cols[2];
                const entryDate = cols[3];
                // cols[4] due date is auto-calced if missing usually, but lets take it
                const amount = parseFloat(cols[5]);
                const currency = (cols[6] as Currency) || Currency.IDR;
                
                // Find Vendor ID by Name Match
                const vendor = vendors.find(v => v.name.toLowerCase() === vendorName.toLowerCase()) || vendors[0]; // Fallback to first vendor if not found (demo purposes)
                
                if (vendor) {
                    const newInv = InvoiceService.createInvoice({
                        invoice_number: invNo,
                        po_number: poNo,
                        entry_date: entryDate,
                        amount: amount,
                        currency: currency,
                        invoice_date: entryDate, // Fallback
                    }, vendor, InvoiceStatus.DRAFT);
                    
                    newInvoices.push(newInv);
                }
            }
            
            if (newInvoices.length > 0) {
                onImport(newInvoices);
                alert(`Successfully imported ${newInvoices.length} invoices.`);
            } else {
                alert("Failed to import. Please check CSV format.");
            }
            
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchSearch = 
                inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (inv.po_number || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchVendor = filterVendorId ? inv.vendor_id === filterVendorId : true;
            const matchStatus = filterStatus ? inv.status === filterStatus : true;
            
            const invDate = new Date(inv.invoice_date);
            const start = filterDateStart ? new Date(filterDateStart) : null;
            const end = filterDateEnd ? new Date(filterDateEnd) : null;
            
            const matchDate = (!start || invDate >= start) && (!end || invDate <= end);

            return matchSearch && matchVendor && matchStatus && matchDate;
        });
    }, [invoices, searchTerm, filterVendorId, filterStatus, filterDateStart, filterDateEnd]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                {/* Actions Toolbar */}
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                    >
                        <Download size={16} />
                        <span>Export CSV</span>
                    </button>
                    <button 
                        onClick={triggerImport}
                        className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                    >
                        <Upload size={16} />
                        <span>Import CSV</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileImport} 
                        accept=".csv" 
                        className="hidden" 
                    />
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative z-10">
                <div className="flex flex-wrap gap-4 items-end">
                     <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Search Invoice / PO</label>
                        <input 
                            type="text" 
                            placeholder="Type to search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Vendor Autocomplete */}
                    <div className="w-64 relative">
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Vendor (Autocomplete)</label>
                         <input 
                            type="text"
                            placeholder="Type vendor name..."
                            value={filterVendorSearch}
                            onChange={(e) => { setFilterVendorSearch(e.target.value); setFilterVendorId(''); }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {filterVendorSearch && !filterVendorId && vendorSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-20">
                                {vendorSuggestions.map(v => (
                                    <div 
                                        key={v.id} 
                                        onClick={() => handleVendorSelect(v)}
                                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
                                    >
                                        {v.name}
                                    </div>
                                ))}
                            </div>
                        )}
                        {filterVendorId && (
                            <button onClick={() => {setFilterVendorId(''); setFilterVendorSearch('');}} className="absolute right-2 top-8 text-slate-400 hover:text-red-500">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="w-40">
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">Status</label>
                         <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">All Statuses</option>
                            {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="text-xs font-semibold text-slate-500 mb-1 block">Date Range</label>
                         <div className="flex items-center space-x-2">
                             <input 
                                type="date" 
                                value={filterDateStart}
                                onChange={(e) => setFilterDateStart(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                            <span className="text-slate-400">-</span>
                            <input 
                                type="date" 
                                value={filterDateEnd}
                                onChange={(e) => setFilterDateEnd(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                         </div>
                    </div>
                    <button 
                        onClick={resetFilters}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reset Filters"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden z-0">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">All Invoices ({filteredInvoices.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Invoice Details</th>
                                <th className="px-6 py-4 font-semibold">Vendor</th>
                                <th className="px-6 py-4 font-semibold">Aging (Entry Date)</th>
                                <th className="px-6 py-4 font-semibold">Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.map((inv) => {
                                const aging = getAging(inv);
                                const hasDoc = inv.attachments && !!inv.attachments.invoice_doc;
                                return (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 group">
                                                <FileText size={16} className={hasDoc ? "text-blue-500" : "text-slate-300"} />
                                                {hasDoc ? (
                                                    <a 
                                                        href="#"
                                                        onClick={(e) => handleInvoiceClick(e, inv.attachments.invoice_doc!)}
                                                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-left"
                                                        title={`Open ${inv.attachments.invoice_doc}`}
                                                    >
                                                        {inv.invoice_number}
                                                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </a>
                                                ) : (
                                                    <span className="font-medium text-slate-500 cursor-default" title="No Invoice Document Attached">
                                                        {inv.invoice_number}
                                                    </span>
                                                )}
                                            </div>
                                            {inv.po_number && (
                                                <div className="text-xs text-slate-500 mt-1 pl-6">
                                                    PO: {inv.po_number}
                                                </div>
                                            )}
                                             <div className="text-xs text-slate-400 mt-0.5 pl-6">
                                                Entry: {new Date(inv.entry_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => onViewVendor(inv.vendor_id)}
                                                className="text-slate-600 hover:text-blue-600 font-medium hover:underline text-left"
                                            >
                                                {getVendorName(inv.vendor_id)}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`text-xs font-semibold ${aging.color}`}>
                                                {aging.text}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                Due: {new Date(inv.due_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {inv.currency} {(inv.amount + inv.tax_amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={inv.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {InvoicePolicy.canEdit(inv) && (
                                                    <>
                                                        <button 
                                                            onClick={() => onEdit(inv)}
                                                            className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-md transition-colors" 
                                                            title="Edit Invoice"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => onDelete(inv.id)}
                                                            className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition-colors" 
                                                            title="Delete Invoice"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};