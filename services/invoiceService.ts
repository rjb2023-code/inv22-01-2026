import { Invoice, InvoiceStatus, Vendor, Currency } from '../types';

export const InvoiceService = {
    /**
     * Calculate Due Date based on Business Rules
     * Rule: 
     * If Term = 30, 60, or 90:
     *   - If Entry Date 1-25: Due Date = 25th of Month + (Term/30)
     *   - If Entry Date > 25: Rollover to next cycle (Month + (Term/30) + 1)
     * Else:
     *   - Standard Invoice Date + Term Days
     */
    calculateDueDate: (entryDateStr: string, invoiceDateStr: string, paymentTermDays: number): string => {
        // Fallback checks
        if (!entryDateStr && !invoiceDateStr) return '';
        
        // Standard Term calculation (for terms like 7, 14, 45, etc that don't fit the N-30/60/90 pattern)
        const isStandardTerm = ![30, 60, 90].includes(paymentTermDays);
        
        if (isStandardTerm) {
            // Use Invoice Date for standard terms
            const basisDate = invoiceDateStr || entryDateStr;
            const parts = basisDate.split('-');
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            date.setDate(date.getDate() + paymentTermDays);
            return date.toISOString().split('T')[0];
        }

        // Specific TOP N-30, N-60, N-90 Logic (Based on Entry/Received Date)
        const parts = entryDateStr.split('-');
        const entryDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dayOfMonth = entryDate.getDate();

        let monthsToAdd = paymentTermDays / 30; // 1, 2, or 3

        // Logic: Jika diterima tanggal 1-25 -> Due Date tanggal 25 bulan berikutnya (N-30)
        // If received after 25th, it usually falls into the next processing batch (add 1 extra month)
        if (dayOfMonth > 25) {
            monthsToAdd += 1;
        }

        // Set to target month, fixed date 25
        const targetDate = new Date(entryDate.getFullYear(), entryDate.getMonth() + monthsToAdd, 25);
        
        return targetDate.toISOString().split('T')[0];
    },

    createInvoice: (
        data: Partial<Invoice>, 
        vendor: Vendor, 
        initialStatus: InvoiceStatus = InvoiceStatus.DRAFT
    ): Invoice => {
        const local = new Date();
        local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
        const today = local.toISOString().split('T')[0];
        
        const invDate = data.invoice_date || today;
        const entDate = data.entry_date || today;

        // Auto-calculate due date if not provided
        const dueDate = data.due_date || InvoiceService.calculateDueDate(entDate, invDate, vendor.payment_term_days);

        return {
            id: `inv-${Date.now()}`,
            vendor_id: vendor.id,
            invoice_number: data.invoice_number || '',
            po_number: data.po_number,
            po_date: data.po_date,
            delivery_date: data.delivery_date,
            invoice_date: invDate,
            entry_date: entDate,
            faktur_pajak_number: data.faktur_pajak_number,
            faktur_pajak_date: data.faktur_pajak_date,
            due_date: dueDate,
            amount: Number(data.amount) || 0,
            tax_rate: Number(data.tax_rate) || 0,
            tax_amount: Number(data.tax_amount) || 0,
            currency: data.currency || vendor.currency,
            status: initialStatus,
            attachments: data.attachments || {},
            created_by: 'Current User',
        };
    }
};