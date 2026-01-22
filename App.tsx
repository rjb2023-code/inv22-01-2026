import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { ForecastView } from './components/ForecastView';
import { VendorManagement } from './components/VendorManagement';
import { InvoiceFormModal } from './components/InvoiceFormModal'; 
import { VendorDetailModal } from './components/VendorDetailModal';
import { mockVendors, mockInvoices, generatePaymentSchedules } from './services/mockData';
import { Vendor, Invoice, PaymentSchedule } from './types';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('dashboard');
    
    // Application State
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);
    
    // View Vendor Detail State
    const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);

    // Initial Load
    useEffect(() => {
        // Simulate API fetch delay
        setTimeout(() => {
            setVendors(mockVendors);
            setInvoices(mockInvoices);
            setSchedules(generatePaymentSchedules(mockInvoices));
            setLoading(false);
        }, 800);
    }, []);

    // --- Vendor Handlers ---
    const handleAddVendor = (newVendor: Vendor) => {
        setVendors(prev => [...prev, newVendor]);
    };

    const handleUpdateVendor = (updatedVendor: Vendor) => {
        setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
    };

    const handleDeleteVendor = (vendorId: string) => {
        if(window.confirm('Are you sure you want to delete this vendor?')) {
            setVendors(prev => prev.filter(v => v.id !== vendorId));
        }
    };

    // --- Invoice Handlers ---
    const handleSaveInvoice = (invoice: Invoice) => {
        if (editingInvoice) {
            // Update Existing
            setInvoices(prev => prev.map(inv => inv.id === invoice.id ? invoice : inv));
            // Update Schedule (Recalculate due date logic implies schedule update)
            setSchedules(prev => prev.map(s => s.invoice_id === invoice.id ? { ...s, planned_payment_date: invoice.due_date } : s));
        } else {
            // Add New
            setInvoices(prev => [invoice, ...prev]);
            const newSchedule: PaymentSchedule = {
                invoice_id: invoice.id,
                planned_payment_date: invoice.due_date,
                payment_status: 'PENDING'
            };
            setSchedules(prev => [...prev, newSchedule]);
        }
        
        // Reset Edit State
        setEditingInvoice(undefined);
        // Switch to Invoices tab to see the result
        setActiveTab('invoices');
    };

    const handleImportInvoices = (newInvoices: Invoice[]) => {
        setInvoices(prev => [...prev, ...newInvoices]);
        const newSchedules = generatePaymentSchedules(newInvoices);
        setSchedules(prev => [...prev, ...newSchedules]);
    };

    const handleEditInvoiceClick = (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setIsInvoiceModalOpen(true);
    };

    const handleDeleteInvoice = (id: string) => {
        if (window.confirm("Are you sure you want to delete this invoice?")) {
            setInvoices(prev => prev.filter(i => i.id !== id));
            setSchedules(prev => prev.filter(s => s.invoice_id !== id));
        }
    };

    const handleNewInvoiceClick = () => {
        setEditingInvoice(undefined);
        setIsInvoiceModalOpen(true);
    }
    
    const handleViewVendor = (vendorId: string) => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (vendor) setViewingVendor(vendor);
    }

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        switch (activeTab) {
            case 'dashboard':
                return <Dashboard invoices={invoices} schedules={schedules} />;
            case 'invoices':
                return (
                    <InvoiceList 
                        invoices={invoices} 
                        vendors={vendors} 
                        schedules={schedules}
                        onEdit={handleEditInvoiceClick}
                        onDelete={handleDeleteInvoice}
                        onViewVendor={handleViewVendor}
                        onImport={handleImportInvoices}
                    />
                );
            case 'vendors':
                return (
                    <VendorManagement 
                        vendors={vendors} 
                        onAddVendor={handleAddVendor} 
                        onUpdateVendor={handleUpdateVendor}
                        onDeleteVendor={handleDeleteVendor}
                    />
                );
            case 'forecast':
                return <ForecastView invoices={invoices} vendors={vendors} schedules={schedules} />;
            default:
                return <div>Coming Soon</div>;
        }
    };

    return (
        <Layout 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            onNewInvoice={handleNewInvoiceClick}
        >
            {renderContent()}
            
            <InvoiceFormModal 
                isOpen={isInvoiceModalOpen}
                onClose={() => { setIsInvoiceModalOpen(false); setEditingInvoice(undefined); }}
                vendors={vendors}
                existingInvoices={invoices}
                onSubmit={handleSaveInvoice}
                editingInvoice={editingInvoice}
            />
            
            <VendorDetailModal 
                vendor={viewingVendor}
                onClose={() => setViewingVendor(null)}
            />
        </Layout>
    );
};

export default App;