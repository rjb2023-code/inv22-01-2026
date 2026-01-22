import { Vendor, Invoice, InvoiceStatus, Currency, PaymentSchedule } from '../types';

// 1. Mock Vendors
export const mockVendors: Vendor[] = [
    { 
        id: 'v1', code: 'V-001', name: 'PT. Digital Solusi', npwp: '01.234.567.8-001.000',
        address: 'Jl. Sudirman No. 1', city: 'Jakarta', contact_person: 'Budi', email: 'budi@ds.co.id', phone: '08123456789',
        bank_name: 'BCA', bank_account: '1234567890', payment_term_days: 30, currency: Currency.IDR, is_active: true 
    },
    { 
        id: 'v2', code: 'V-002', name: 'Global Cloud Svc', npwp: '02.345.678.9-002.000',
        address: '100 Tech Park', city: 'Singapore', contact_person: 'Alice', email: 'alice@gcs.com', phone: '+6598765432',
        bank_name: 'Chase', bank_account: '987654321', payment_term_days: 14, currency: Currency.USD, is_active: true 
    },
    { 
        id: 'v3', code: 'V-003', name: 'CV. Makmur Jaya', npwp: '03.456.789.0-003.000',
        address: 'Jl. Gatot Subroto Kav 5', city: 'Bandung', contact_person: 'Charlie', email: 'charlie@mj.com', phone: '08198765432',
        bank_name: 'Mandiri', bank_account: '1122334455', payment_term_days: 45, currency: Currency.IDR, is_active: true 
    },
    { 
        id: 'v4', code: 'V-004', name: 'Office Supplies Co.', npwp: '04.567.890.1-004.000',
        address: 'Ruko Mangga Dua', city: 'Jakarta', contact_person: 'Dewi', email: 'sales@osc.co.id', phone: '0215556677',
        bank_name: 'BNI', bank_account: '5566778899', payment_term_days: 7, currency: Currency.IDR, is_active: true 
    },
];

const addDays = (dateStr: string, days: number): string => {
    const result = new Date(dateStr);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
};

const today = new Date().toISOString().split('T')[0];

export const mockInvoices: Invoice[] = [
    {
        id: 'inv1', vendor_id: 'v1', invoice_number: 'INV/2023/001', po_number: 'PO-001',
        po_date: addDays(today, -25), delivery_date: addDays(today, -22), invoice_date: addDays(today, -20), entry_date: addDays(today, -19),
        faktur_pajak_number: '010.001-23.00000001', faktur_pajak_date: addDays(today, -20),
        due_date: addDays(today, 10),
        amount: 15000000, tax_rate: 0.11, tax_amount: 1650000, currency: Currency.IDR,
        status: InvoiceStatus.APPROVED, created_by: 'Admin',
        attachments: { invoice_doc: 'inv-001.pdf', faktur_pajak: 'fp-001.pdf' }
    },
    {
        id: 'inv2', vendor_id: 'v2', invoice_number: 'GC-9921', po_number: 'PO-INT-99',
        po_date: addDays(today, -10), delivery_date: addDays(today, -6), invoice_date: addDays(today, -5), entry_date: addDays(today, -5),
        due_date: addDays(today, 9),
        amount: 5000, tax_rate: 0, tax_amount: 0, currency: Currency.USD, 
        status: InvoiceStatus.SCHEDULED, created_by: 'Admin',
        attachments: { invoice_doc: 'gc-bill.pdf' }
    },
    {
        id: 'inv3', vendor_id: 'v3', invoice_number: 'MJ-088', po_number: 'PO-088',
        po_date: addDays(today, -45), delivery_date: addDays(today, -41), invoice_date: addDays(today, -40), entry_date: addDays(today, -38),
        faktur_pajak_number: '010.003-23.0000055', faktur_pajak_date: addDays(today, -40),
        due_date: addDays(today, 5), 
        amount: 45000000, tax_rate: 0.11, tax_amount: 4950000, currency: Currency.IDR,
        status: InvoiceStatus.APPROVED, created_by: 'Admin',
        attachments: { invoice_doc: 'mj-88.pdf', bast_surat_jalan: 'sj-88.pdf' }
    },
    {
        id: 'inv4', vendor_id: 'v1', invoice_number: 'INV/2023/005', po_number: 'PO-005',
        po_date: addDays(today, -5), delivery_date: addDays(today, -3), invoice_date: addDays(today, -2), entry_date: addDays(today, -1),
        faktur_pajak_number: '010.001-23.00000020', faktur_pajak_date: addDays(today, -2),
        due_date: addDays(today, 28),
        amount: 8500000, tax_rate: 0.11, tax_amount: 935000, currency: Currency.IDR,
        status: InvoiceStatus.SUBMITTED, created_by: 'Staff',
        attachments: { invoice_doc: 'inv-005.pdf' }
    },
];

export const generatePaymentSchedules = (invoices: Invoice[]): PaymentSchedule[] => {
    return invoices.map(inv => ({
        invoice_id: inv.id,
        planned_payment_date: inv.due_date, 
        payment_status: inv.status === InvoiceStatus.PAID ? 'PAID' : 'PENDING'
    }));
};