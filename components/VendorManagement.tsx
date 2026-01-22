import React, { useState } from 'react';
import { Vendor, Currency, VendorLegality } from '../types';
import { Plus, X, Building2, Search, Pencil, Trash2, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface VendorManagementProps {
    vendors: Vendor[];
    onAddVendor: (vendor: Vendor) => void;
    onUpdateVendor: (vendor: Vendor) => void;
    onDeleteVendor: (id: string) => void;
}

export const VendorManagement: React.FC<VendorManagementProps> = ({ vendors, onAddVendor, onUpdateVendor, onDeleteVendor }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    
    // Form State
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [formData, setFormData] = useState<Partial<Vendor>>({
        code: '', name: '', npwp: '', address: '', city: '',
        contact_person: '', email: '', phone: '',
        bank_name: '', bank_account: '', payment_term_days: 30, currency: Currency.IDR, is_active: true
    });
    const [legalityData, setLegalityData] = useState<VendorLegality>({});

    const openModal = (vendor?: Vendor) => {
        setErrorMsg('');
        if (vendor) {
            setEditingVendor(vendor);
            setFormData({
                code: vendor.code, name: vendor.name, npwp: vendor.npwp, address: vendor.address, city: vendor.city,
                contact_person: vendor.contact_person, email: vendor.email, phone: vendor.phone,
                bank_name: vendor.bank_name, bank_account: vendor.bank_account, payment_term_days: vendor.payment_term_days,
                currency: vendor.currency, is_active: vendor.is_active
            });
            setLegalityData(vendor.legality_docs || {});
        } else {
            setEditingVendor(null);
            setFormData({
                code: '', name: '', npwp: '', address: '', city: '',
                contact_person: '', email: '', phone: '',
                bank_name: '', bank_account: '', payment_term_days: 30, currency: Currency.IDR, is_active: true
            });
            setLegalityData({});
        }
        setIsModalOpen(true);
    };

    const validateNPWP = (npwp: string, currentId?: string) => {
        const exists = vendors.some(v => v.npwp === npwp && v.id !== currentId);
        return !exists;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!validateNPWP(formData.npwp!, editingVendor?.id)) {
            setErrorMsg('NPWP already exists for another vendor.');
            return;
        }

        const baseVendor: Vendor = {
            id: editingVendor?.id || `v-${Date.now()}`,
            code: formData.code!,
            name: formData.name!,
            npwp: formData.npwp!,
            address: formData.address!,
            city: formData.city!,
            contact_person: formData.contact_person!,
            email: formData.email!,
            phone: formData.phone!,
            bank_name: formData.bank_name!,
            bank_account: formData.bank_account!,
            payment_term_days: Number(formData.payment_term_days) || 30,
            currency: formData.currency as Currency,
            is_active: true,
            legality_docs: legalityData
        };

        if (editingVendor) {
            onUpdateVendor(baseVendor);
        } else {
            onAddVendor(baseVendor);
        }
        
        setIsModalOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (field: keyof VendorLegality, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLegalityData(prev => ({ ...prev, [field]: e.target.files![0].name }));
        }
    };
    
    const filteredVendors = vendors.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Vendor Management</h2>
                    <p className="text-slate-500">Manage vendor details and payment terms.</p>
                </div>
                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input 
                            type="text"
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                         />
                    </div>
                    <button 
                        onClick={() => openModal()}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span>Add Vendor</span>
                    </button>
                </div>
            </div>

            {/* Vendor List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Code</th>
                                <th className="px-6 py-4 font-semibold">Vendor Name</th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                <th className="px-6 py-4 font-semibold">Term</th>
                                <th className="px-6 py-4 font-semibold">NPWP</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredVendors.map((vendor) => (
                                <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-600">{vendor.code}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{vendor.name}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{vendor.contact_person}</span>
                                            <span className="text-xs text-slate-400">{vendor.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{vendor.payment_term_days} Days</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{vendor.npwp}</td>
                                    <td className="px-6 py-4">
                                        {vendor.is_active ? (
                                            <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">Active</span>
                                        ) : (
                                            <span className="text-slate-400 text-xs font-medium bg-slate-100 px-2 py-1 rounded-full">Inactive</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => openModal(vendor)} className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-md transition-colors">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => onDeleteVendor(vendor.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                             {filteredVendors.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        No vendors found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Vendor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            {errorMsg && (
                                <div className="px-6 pt-4">
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                        <AlertCircle size={18} />
                                        <span className="text-sm font-medium">{errorMsg}</span>
                                    </div>
                                </div>
                            )}
                            <div className="p-6 space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Company Information</h4>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-600">Vendor Code</label>
                                            <input name="code" required value={formData.code} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-600">Company Name</label>
                                            <input name="name" required value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-600">NPWP (Required & Unique)</label>
                                            <input name="npwp" required value={formData.npwp} onChange={handleChange} placeholder="00.000.000.0-000.000" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Contact & Address</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-600">Contact Person</label>
                                                <input name="contact_person" required value={formData.contact_person} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-600">Phone</label>
                                                <input name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-600">Email</label>
                                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2 space-y-2">
                                                <label className="text-sm font-medium text-slate-600">Address</label>
                                                <input name="address" required value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-600">City</label>
                                                <input name="city" required value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financials & Legal */}
                                <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                     <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Financial Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-600">Bank Name</label>
                                                <input name="bank_name" required value={formData.bank_name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-600">Account Number</label>
                                                <input name="bank_account" required value={formData.bank_account} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-600">Term (Days)</label>
                                                <input name="payment_term_days" type="number" required min="0" value={formData.payment_term_days} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-600">Currency</label>
                                                <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                                    <option value={Currency.IDR}>IDR</option>
                                                    <option value={Currency.USD}>USD</option>
                                                    <option value={Currency.SGD}>SGD</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Legality Documents</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['npwp', 'nib', 'sppkp', 'sk_kemenkumham'].map((doc) => (
                                                <div key={doc} className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase">{doc.replace('_', ' ')}</label>
                                                    <div className="flex items-center space-x-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
                                                        <div className={`p-1.5 rounded-full ${legalityData[doc as keyof VendorLegality] ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                                            <FileText size={16} />
                                                        </div>
                                                        <label className="cursor-pointer text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 ml-auto">
                                                            Upload
                                                            <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(doc as keyof VendorLegality, e)} />
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex space-x-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm">{editingVendor ? 'Update Vendor' : 'Save Vendor'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};