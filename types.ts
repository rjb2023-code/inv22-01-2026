// Enums for Status Management
export enum InvoiceStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    SCHEDULED = 'SCHEDULED',
    PAID = 'PAID',
    REJECTED = 'REJECTED'
}

export enum Currency {
    IDR = 'IDR',
    USD = 'USD',
    SGD = 'SGD'
}

// Entity Interfaces
export interface VendorLegality {
    npwp?: string;
    nib?: string;
    sppkp?: string;
    sk_kemenkumham?: string;
}

export interface Vendor {
    id: string;
    code: string;
    name: string;
    npwp: string; // New: Unique
    address: string;
    city: string;
    contact_person: string;
    email: string;
    phone: string;
    bank_name: string;
    bank_account: string;
    payment_term_days: number;
    currency: Currency;
    legality_docs?: VendorLegality;
    is_active: boolean;
}

export interface InvoiceAttachments {
    invoice_doc?: string;
    faktur_pajak?: string;
    bast_surat_jalan?: string;
    attendance_list?: string;
    other_evidence?: string;
}

export interface Invoice {
    id: string;
    vendor_id: string;
    invoice_number: string;
    po_number?: string;
    po_date?: string; // New
    delivery_date?: string; // New: Surat Jalan/BAST Date
    invoice_date: string;
    entry_date: string; // New: Date data was entered
    faktur_pajak_number?: string; // New
    faktur_pajak_date?: string; // New
    due_date: string;
    amount: number;
    tax_rate: number;
    tax_amount: number;
    currency: Currency;
    status: InvoiceStatus;
    attachments: InvoiceAttachments;
    created_by: string;
}

export interface PaymentSchedule {
    invoice_id: string;
    planned_payment_date: string;
    actual_payment_date?: string; // Used for aging stop
    payment_status: 'PENDING' | 'PAID';
    remarks?: string;
}

// For Forecast Aggregation
export interface ForecastBucket {
    date: string;
    amount: number;
    invoice_count: number;
    currency: Currency;
    vendors: string[]; 
}

export interface ScenarioConfig {
    delayDays: number;
    accelerateDays: number;
    filterVendorId?: string;
}