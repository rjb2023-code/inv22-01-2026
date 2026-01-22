import React from 'react';
import { Vendor } from '../types';
import { X, Building2, MapPin, Mail, Phone, User, FileText } from 'lucide-react';

interface VendorDetailModalProps {
    vendor: Vendor | null;
    onClose: () => void;
}

export const VendorDetailModal: React.FC<VendorDetailModalProps> = ({ vendor, onClose }) => {
    if (!vendor) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Vendor Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Building2 size={32} className="text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{vendor.name}</h2>
                        <p className="text-sm text-slate-500 font-mono">{vendor.code}</p>
                        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {vendor.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    <div className="space-y-4">
                         <div className="flex items-start space-x-3">
                            <MapPin size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-slate-700">Address</p>
                                <p className="text-sm text-slate-600">{vendor.address}, {vendor.city}</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <FileText size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-slate-700">NPWP</p>
                                <p className="text-sm text-slate-600 font-mono">{vendor.npwp}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="flex items-start space-x-3">
                                <User size={18} className="text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Contact</p>
                                    <p className="text-sm text-slate-600">{vendor.contact_person}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Phone size={18} className="text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Phone</p>
                                    <p className="text-sm text-slate-600">{vendor.phone}</p>
                                </div>
                            </div>
                        </div>
                         <div className="flex items-start space-x-3">
                            <Mail size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-slate-700">Email</p>
                                <p className="text-sm text-blue-600 underline">{vendor.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Details</h4>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Bank</span>
                            <span className="font-medium text-slate-800">{vendor.bank_name}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Account</span>
                            <span className="font-medium text-slate-800">{vendor.bank_account}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Term</span>
                            <span className="font-medium text-slate-800">{vendor.payment_term_days} Days</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};