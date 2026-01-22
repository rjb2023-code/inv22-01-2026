import React, { useState, useEffect } from 'react';
import { Vendor, Invoice, InvoiceStatus, Currency, InvoiceAttachments } from '../types';
import { InvoiceService } from '../services/invoiceService';
import { X, Upload, Calendar, Calculator, DollarSign, Save, Send, FileCheck, Paperclip, Eye, ArrowLeft, CheckCircle, AlertTriangle, AlertCircle, Search } from 'lucide-react';

interface InvoiceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendors: Vendor[];
    onSubmit: (invoice: Invoice) => void;
    editingInvoice?: Invoice;
    existingInvoices?: Invoice[];
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({ isOpen, onClose, vendors, onSubmit, editingInvoice, existingInvoices = [] }) => {
    // UI State
    const [viewMode, setViewMode] = useState<'FORM' | 'PREVIEW'>('FORM');
    const [validationError, setValidationError] = useState('');
    const [submittedId, setSubmittedId] = useState<string | null>(null); // State for success popup

    // Form State
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [vendorSearch, setVendorSearch] = useState(''); // Autocomplete search
    const [showVendorDropdown, setShowVendorDropdown] = useState(false);

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [poNumber, setPoNumber] = useState(''); 
    
    // Dates
    const [entryDate, setEntryDate] = useState(''); // New: Date Received
    const [invoiceDate, setInvoiceDate] = useState('');
    const [poDate, setPoDate] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [fakturPajakDate, setFakturPajakDate] = useState('');
    const [fakturPajakNo, setFakturPajakNo] = useState('');
    
    const [dueDate, setDueDate] = useState('');
    
    // Financials
    const [currency, setCurrency] = useState<Currency>(Currency.IDR);
    const [amountStr, setAmountStr] = useState<string>(''); 
    const [taxRate, setTaxRate] = useState<number>(0.11);
    const [taxAmountStr, setTaxAmountStr] = useState<string>(''); 
    
    // Attachments
    const [attachments, setAttachments] = useState<InvoiceAttachments>({});

    // Checklist State (Preview)
    const [checklist, setChecklist] = useState({
        materai: false,
        signature: false,
        priceMatch: false,
        qtyMatch: false,
        glAccount: false,
        gr: false
    });

    // Initialize Form
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        // Reset success state when modal opens
        if (isOpen) {
            setSubmittedId(null);
        }

        if (isOpen && editingInvoice) {
            setSelectedVendorId(editingInvoice.vendor_id);
            // Pre-fill search term for autocomplete
            const currentVendor = vendors.find(v => v.id === editingInvoice.vendor_id);
            if (currentVendor) setVendorSearch(currentVendor.name);

            setInvoiceNumber(editingInvoice.invoice_number);
            setPoNumber(editingInvoice.po_number || '');
            
            setEntryDate(editingInvoice.entry_date || today);
            setInvoiceDate(editingInvoice.invoice_date);
            setPoDate(editingInvoice.po_date || '');
            setDeliveryDate(editingInvoice.delivery_date || '');
            setFakturPajakNo(editingInvoice.faktur_pajak_number || '');
            setFakturPajakDate(editingInvoice.faktur_pajak_date || '');

            setDueDate(editingInvoice.due_date);
            setCurrency(editingInvoice.currency);
            setAmountStr(formatNumber(editingInvoice.amount));
            setTaxRate(editingInvoice.tax_rate);
            setTaxAmountStr(formatNumber(editingInvoice.tax_amount));
            setAttachments(editingInvoice.attachments || {});
        } else if (isOpen && !editingInvoice) {
            handleReset();
            setEntryDate(today);
            setInvoiceDate(today);
        }
    }, [isOpen, editingInvoice]);

    // Derived State
    const selectedVendor = vendors.find(v => v.id === selectedVendorId);

    // Filtered Vendors for Autocomplete
    const filteredVendors = vendors.filter(v => 
        v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || 
        v.code.toLowerCase().includes(vendorSearch.toLowerCase())
    );

    // Formatter Helpers
    const formatNumber = (val: string | number) => {
        if (val === undefined || val === null) return '';
        const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('en-US').format(num); 
    };

    const parseNumber = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/,/g, ''));
    };

    // Auto-calculate Due Date based on Entry Date (Received Date) & Vendor Terms
    useEffect(() => {
        if (selectedVendorId && entryDate && !editingInvoice) {
             const vendor = vendors.find(v => v.id === selectedVendorId);
             if (vendor) {
                 const calculatedDueDate = InvoiceService.calculateDueDate(entryDate, invoiceDate, vendor.payment_term_days);
                 setDueDate(calculatedDueDate);
                 setCurrency(vendor.currency); 
             }
        }
    }, [selectedVendorId, entryDate, invoiceDate, vendors, editingInvoice]);

    // Auto-calculate Tax Amount
    useEffect(() => {
        const numericAmount = parseNumber(amountStr);
        const calculatedTax = numericAmount * taxRate;
        setTaxAmountStr(formatNumber(calculatedTax));
    }, [amountStr, taxRate]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '');
        if (!isNaN(Number(raw))) {
            setAmountStr(formatNumber(raw));
        }
    };

    const handleFileChange = (field: keyof InvoiceAttachments, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachments(prev => ({
                ...prev,
                [field]: e.target.files![0].name
            }));
        }
    };

    const handlePreview = () => {
        // Validate Invoice Uniqueness
        const isDuplicate = existingInvoices.some(inv => 
            inv.invoice_number === invoiceNumber && inv.id !== editingInvoice?.id
        );
        if (isDuplicate) {
            setValidationError('Invoice Number already exists!');
            return;
        }
        setValidationError('');
        
        // Reset checklist
        setChecklist({
            materai: false, signature: false, priceMatch: false, qtyMatch: false, glAccount: false, gr: false
        });

        setViewMode('PREVIEW');
    };

    const handleSubmit = (action: 'DRAFT' | 'SUBMIT') => {
        if (!selectedVendor) return;
        const status = action === 'SUBMIT' ? InvoiceStatus.SUBMITTED : InvoiceStatus.DRAFT;
        const numericAmount = parseNumber(amountStr);
        const numericTax = parseNumber(taxAmountStr);

        const newId = editingInvoice ? editingInvoice.id : `inv-${Date.now()}`;

        const payload: Invoice = {
            id: newId,
            vendor_id: selectedVendorId,
            invoice_number: invoiceNumber,
            po_number: poNumber,
            po_date: poDate,
            delivery_date: deliveryDate,
            invoice_date: invoiceDate,
            entry_date: entryDate,
            faktur_pajak_number: fakturPajakNo,
            faktur_pajak_date: fakturPajakDate,
            due_date: dueDate,
            amount: numericAmount,
            tax_rate: taxRate,
            tax_amount: numericTax,
            currency: currency,
            status: status,
            attachments: attachments,
            created_by: 'Current User'
        };

        onSubmit(payload);
        
        // Show Success Popup logic
        setSubmittedId(newId);
    };

    const handleSuccessClose = () => {
        setSubmittedId(null);
        onClose();
    };

    const handleReset = () => {
        setViewMode('FORM');
        setSelectedVendorId('');
        setVendorSearch('');
        setShowVendorDropdown(false);
        setInvoiceNumber('');
        setPoNumber('');
        setPoDate('');
        setDeliveryDate('');
        setFakturPajakNo('');
        setFakturPajakDate('');
        setAmountStr('');
        setTaxRate(0.11);
        setTaxAmountStr('');
        setAttachments({});
        setValidationError('');
        const local = new Date();
        local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
        const todayStr = local.toISOString().split('T')[0];
        setEntryDate(todayStr);
        setInvoiceDate(todayStr);
    };

    const handleCancel = () => {
        if (viewMode === 'PREVIEW') {
            setViewMode('FORM');
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    // Render Success Popup
    if (submittedId) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 transform transition-all scale-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={36} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Success!
                    </h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        Selamat invoice telah terdaftar di sistem dengan nomor entry <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{submittedId}</span>
                    </p>
                    <button 
                        onClick={handleSuccessClose} 
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                    >
                        OK, Close
                    </button>
                </div>
            </div>
        );
    }

    // Validation
    const isVendorSelected = !!selectedVendorId;
    const isAmountValid = parseNumber(amountStr) > 0;
    const isNumberValid = invoiceNumber.trim().length > 0;
    const canPreview = isVendorSelected && isAmountValid && isNumberValid;

    // Checklist Logic
    const numericAmount = parseNumber(amountStr);
    const requiresMaterai = numericAmount > 5000000;
    
    // Logic Checks
    const dateCheck1 = poDate && deliveryDate ? poDate <= deliveryDate : true;
    const dateCheck2 = deliveryDate && invoiceDate ? deliveryDate <= invoiceDate : true;
    const dateCheck3 = fakturPajakDate && invoiceDate ? fakturPajakDate === invoiceDate : true;
    
    const allLogicChecksPass = dateCheck1 && dateCheck2 && dateCheck3;
    const allManualChecksPass = checklist.signature && checklist.priceMatch && checklist.qtyMatch && checklist.glAccount && checklist.gr && (!requiresMaterai || checklist.materai);
    const canSubmit = allLogicChecksPass && allManualChecksPass;

    // Attachment Definitions (As requested)
    const attachmentFields = [
        { key: 'invoice_doc', label: 'Invoice (Tagihan)', required: true },
        { key: 'faktur_pajak', label: 'Faktur Pajak', required: taxRate > 0 },
        { key: 'bast_surat_jalan', label: 'Surat Jalan / BAST', required: true }, 
        { key: 'attendance_list', label: 'Daftar Hadir', required: false }, // Optional
        { key: 'other_evidence', label: 'Evidence Lainnya', required: false }, // Optional
    ];

    const renderPreview = () => (
        <div className="p-8 flex-1 overflow-y-auto space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Mandatory Verification Checklist</h4>
                <div className="space-y-4">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Checks</h5>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span>PO Date &le; DO/BAST Date</span>
                                {dateCheck1 ? <CheckCircle size={16} className="text-green-500" /> : <span className="text-red-500 flex items-center text-xs font-bold"><X size={14} /> Invalid</span>}
                            </div>
                            <div className="flex items-center justify-between">
                                <span>DO/BAST Date &le; Invoice Date</span>
                                {dateCheck2 ? <CheckCircle size={16} className="text-green-500" /> : <span className="text-red-500 flex items-center text-xs font-bold"><X size={14} /> Invalid</span>}
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Invoice Date == Faktur Pajak Date</span>
                                {dateCheck3 ? <CheckCircle size={16} className="text-green-500" /> : <span className="text-red-500 flex items-center text-xs font-bold"><X size={14} /> Invalid</span>}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Manual Verification</h5>
                        <div className="space-y-2">
                            {requiresMaterai && (
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={checklist.materai} onChange={e => setChecklist({...checklist, materai: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                                    <span className="text-sm">Materai (Invoice &gt; 5jt)</span>
                                </label>
                            )}
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={checklist.signature} onChange={e => setChecklist({...checklist, signature: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm">Tanda Tangan & Stempel Lengkap</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={checklist.priceMatch} onChange={e => setChecklist({...checklist, priceMatch: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm">Kesesuaian Harga Barang</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={checklist.qtyMatch} onChange={e => setChecklist({...checklist, qtyMatch: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm">Kesesuaian Jumlah Barang</span>
                            </label>
                             <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={checklist.glAccount} onChange={e => setChecklist({...checklist, glAccount: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm">G/L Account Valid</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={checklist.gr} onChange={e => setChecklist({...checklist, gr: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm">Goods Receipt (GR) Created</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
             <div className="border rounded-xl overflow-hidden text-sm opacity-75">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                         <tr><th className="px-4 py-2 text-left">Field</th><th className="px-4 py-2 text-right">Value</th></tr>
                    </thead>
                    <tbody>
                         <tr><td className="px-4 py-2">Invoice No</td><td className="px-4 py-2 text-right">{invoiceNumber}</td></tr>
                         <tr><td className="px-4 py-2">Amount</td><td className="px-4 py-2 text-right">{amountStr}</td></tr>
                         <tr><td className="px-4 py-2">Received Date</td><td className="px-4 py-2 text-right">{entryDate}</td></tr>
                         <tr><td className="px-4 py-2">Due Date</td><td className="px-4 py-2 text-right font-bold text-blue-600">{dueDate}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center space-x-3">
                        {viewMode === 'PREVIEW' && (
                            <button onClick={() => setViewMode('FORM')} className="mr-2 text-slate-400 hover:text-slate-600">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h3 className="font-bold text-xl text-slate-800">
                                {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {viewMode === 'PREVIEW' ? 'Verify and Submit' : 'Enter invoice details'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {viewMode === 'PREVIEW' ? renderPreview() : (
                    <form className="flex flex-col flex-1 overflow-hidden">
                        <div className="p-8 overflow-y-auto space-y-8 flex-1">
                            {validationError && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center text-sm font-medium">
                                    <AlertCircle size={16} className="mr-2" />
                                    {validationError}
                                </div>
                            )}

                            {/* Section 1: Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Vendor <span className="text-red-500">*</span></label>
                                    {editingInvoice ? (
                                        <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 font-medium">
                                            {vendors.find(v => v.id === selectedVendorId)?.name || 'Unknown Vendor'}
                                        </div>
                                    ) : (
                                        <div className="relative">
                                             <div className="relative">
                                                <input 
                                                    type="text" 
                                                    placeholder="Search vendor by name or code..."
                                                    className="w-full px-3 py-2.5 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow"
                                                    value={vendorSearch}
                                                    onChange={(e) => {
                                                        setVendorSearch(e.target.value);
                                                        setSelectedVendorId(''); // Clear selection on type
                                                        setShowVendorDropdown(true);
                                                    }}
                                                    onFocus={() => setShowVendorDropdown(true)}
                                                    onBlur={() => setShowVendorDropdown(false)}
                                                />
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                             </div>
                                             
                                             {showVendorDropdown && (filteredVendors.length > 0 || vendorSearch) && (
                                                 <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                                                     {filteredVendors.length > 0 ? (
                                                         filteredVendors.map(v => (
                                                             <div 
                                                                key={v.id}
                                                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 group"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault(); // Prevent blur
                                                                    setSelectedVendorId(v.id);
                                                                    setVendorSearch(v.name);
                                                                    setShowVendorDropdown(false);
                                                                }}
                                                             >
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium text-slate-800 group-hover:text-blue-700">{v.name}</span>
                                                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">{v.code}</span>
                                                                </div>
                                                             </div>
                                                         ))
                                                     ) : (
                                                         <div className="px-4 py-8 text-center text-slate-400">
                                                             <p className="text-sm">No vendors found matching "{vendorSearch}"</p>
                                                         </div>
                                                     )}
                                                 </div>
                                             )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Invoice Number <span className="text-red-500">*</span></label>
                                    <input type="text" placeholder="Unique Invoice No" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">PO Number</label>
                                    <input type="text" placeholder="PO-2024-XXX" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
                                </div>
                            </div>

                            {/* Section 2: Dates - Expanded */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                                        Date Received (Entry)
                                        <span className="text-xs text-blue-600 font-normal">Base for Due Date</span>
                                    </label>
                                    <input type="date" className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-blue-50" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Invoice Date</label>
                                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Due Date (Auto)</label>
                                    <input type="date" disabled className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-200 font-semibold text-slate-700" value={dueDate} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">PO Date</label>
                                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">DO / BAST Date</label>
                                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Faktur Pajak Date</label>
                                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" value={fakturPajakDate} onChange={(e) => setFakturPajakDate(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Faktur Pajak No.</label>
                                    <input type="text" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg" placeholder="010.000-00.00000000" value={fakturPajakNo} onChange={(e) => setFakturPajakNo(e.target.value)} />
                                </div>
                            </div>

                            {/* Section 3: Financials */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-600">Currency</label>
                                    <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                                        {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-600">Amount (DPP) <span className="text-red-500">*</span></label>
                                    <input type="text" placeholder="0" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg font-medium" value={amountStr} onChange={handleAmountChange} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-600">PPN Rate</label>
                                    <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value))}>
                                        <option value={0.11}>11% (Default)</option>
                                        <option value={0.05}>5%</option>
                                        <option value={0.01}>1%</option>
                                        <option value={0}>0% (Non-PKP)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-600">Tax Amount</label>
                                    <input type="text" readOnly className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 font-medium" value={taxAmountStr} />
                                </div>
                            </div>
                            
                            {/* Section 4: Attachments */}
                            <div className="space-y-4 border-t border-slate-100 pt-6">
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
                                    <Paperclip size={16} className="mr-1" /> Supporting Documents
                                </h4>
                                
                                <div className="grid grid-cols-1 gap-3">
                                    {attachmentFields.map((field) => (
                                        <div key={field.key} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                                            <div className="flex items-center space-x-3 flex-1">
                                                <div className={`p-2 rounded-full ${attachments[field.key as keyof InvoiceAttachments] ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <FileCheck size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">
                                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                                    </p>
                                                    {attachments[field.key as keyof InvoiceAttachments] && (
                                                        <p className="text-xs text-blue-600 truncate max-w-[200px]">
                                                            {attachments[field.key as keyof InvoiceAttachments]}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <label className="cursor-pointer">
                                                <span className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 transition-colors">
                                                    {attachments[field.key as keyof InvoiceAttachments] ? 'Replace' : 'Upload'}
                                                </span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept=".pdf,.jpg,.png"
                                                    onChange={(e) => handleFileChange(field.key as keyof InvoiceAttachments, e)}
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                    <button type="button" onClick={handleCancel} className="px-5 py-2.5 text-slate-600 font-medium text-sm">
                        {viewMode === 'PREVIEW' ? 'Back to Edit' : 'Cancel'}
                    </button>
                    {viewMode === 'FORM' ? (
                        <button type="button" onClick={handlePreview} disabled={!canPreview} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm disabled:opacity-50">Preview Checklist</button>
                    ) : (
                        <button type="button" onClick={() => handleSubmit('SUBMIT')} disabled={!canSubmit} className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm shadow-md disabled:opacity-50 flex items-center space-x-2">
                            <Send size={16} /> <span>Submit Invoice</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};