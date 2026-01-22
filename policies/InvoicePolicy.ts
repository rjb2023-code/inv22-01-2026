import { Invoice, InvoiceStatus } from '../types';

/**
 * Policy Layer: Handles Authorization and Rules
 * Similar to Laravel Policies
 */

export const InvoicePolicy = {
    /**
     * Determine if a user can edit an invoice
     */
    canEdit: (invoice: Invoice): boolean => {
        // Rule: Can edit UNLESS it is fully approved, scheduled for payment, or paid.
        // This implies SUBMITTED, DRAFT, and REJECTED can be edited.
        const lockedStatuses = [InvoiceStatus.APPROVED, InvoiceStatus.SCHEDULED, InvoiceStatus.PAID];
        return !lockedStatuses.includes(invoice.status);
    },

    /**
     * Determine if a user can approve an invoice
     */
    canApprove: (invoice: Invoice, userRole: string = 'FINANCE_MANAGER'): boolean => {
        // Rule: Must be Submitted and User must be Finance Manager
        return invoice.status === InvoiceStatus.SUBMITTED && userRole === 'FINANCE_MANAGER';
    },

    /**
     * Determine valid status transitions
     */
    getAvailableActions: (invoice: Invoice) => {
        switch (invoice.status) {
            case InvoiceStatus.DRAFT:
                return ['SUBMIT', 'DELETE'];
            case InvoiceStatus.SUBMITTED:
                return ['APPROVE', 'REJECT'];
            case InvoiceStatus.APPROVED:
                return ['SCHEDULE'];
            case InvoiceStatus.SCHEDULED:
                return ['PAY'];
            default:
                return [];
        }
    }
};