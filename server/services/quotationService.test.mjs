import { describe, expect, test } from 'vitest';
import quotationService from './quotationService.js';
import pdf from '../utils/pdf.js';

const policy = {
  gstEnabled: true,
  defaultGstPercentage: 18,
  allowDiscounts: true,
  maximumDiscountPercentage: 25,
};

describe('quotation authoritative pricing', () => {
  test('calculates line discount, fixed quotation discount, GST and final amount', () => {
    const result = quotationService.calculateQuotation({
      items: [{ description: 'ACP fascia', quantity: 2, unitPrice: 100, discountType: 'percentage', discountValue: 10, taxPercentage: 18 }],
      installation: 50,
      discountType: 'fixed',
      discountValue: 20,
      gstPercentage: 18,
    }, policy);

    expect(result).toMatchObject({
      subtotal: 200,
      itemDiscountAmount: 20,
      quoteDiscountAmount: 20,
      discountAmount: 40,
      taxableAmount: 210,
      gstAmount: 37.8,
      finalAmount: 247.8,
    });
  });

  test('uses decimal-safe rounding for percentage discounts', () => {
    const result = quotationService.calculateQuotation({
      items: [{ description: 'LED letters', quantity: 3, unitPrice: 99.99, taxPercentage: 18 }],
      discountType: 'percentage',
      discountValue: 12.5,
      gstPercentage: 18,
    }, policy);

    expect(result.subtotal).toBe(299.97);
    expect(result.discountAmount).toBe(37.5);
    expect(result.taxableAmount).toBe(262.47);
    expect(result.gstAmount).toBe(47.24);
    expect(result.finalAmount).toBe(309.71);
  });

  test('ignores manipulated frontend totals', () => {
    const result = quotationService.calculateQuotation({
      items: [{ description: 'Authoritative item', quantity: 2, unitPrice: 500, taxPercentage: 18, amount: 1, lineTotal: 1 }],
      subtotal: 1,
      discountAmount: 999999,
      gstAmount: 0,
      finalAmount: 1,
      discountType: 'none',
      gstPercentage: 18,
    }, policy);

    expect(result.subtotal).toBe(1000);
    expect(result.gstAmount).toBe(180);
    expect(result.finalAmount).toBe(1180);
  });

  test('enforces configured discount and validity bounds', () => {
    expect(() => quotationService.calculateQuotation({
      items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
      discountType: 'percentage',
      discountValue: 26,
    }, policy)).toThrow('Percentage discount cannot exceed 25%');

    expect(() => quotationService.calculateQuotation({
      items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
      discountType: 'fixed',
      discountValue: 1,
    }, { ...policy, allowDiscounts: false })).toThrow('Discounts are disabled');
  });
});

describe('quotation state actions', () => {
  test('returns only status-appropriate admin actions', () => {
    expect(quotationService.adminActions('draft')).toEqual(expect.arrayContaining(['edit', 'send', 'download', 'cancel']));
    expect(quotationService.adminActions('approved')).toEqual(['view', 'download']);
    expect(quotationService.adminActions('change_requested')).toContain('create_revision');
    expect(quotationService.adminActions('viewed')).not.toContain('resend');
  });

  test('blocks customer decisions after validity and in terminal states', () => {
    expect(quotationService.customerActions('sent', '2999-01-01')).toEqual(['approve', 'request_changes', 'reject', 'download']);
    expect(quotationService.customerActions('sent', '2000-01-01')).toEqual([]);
    expect(quotationService.customerActions('approved', '2999-01-01')).toEqual([]);
  });

  test('customer serializer removes private and mutable fields', () => {
    const dto = quotationService.serializeCustomerQuotation({
      quotationNo: 'SB-QUO-2026-000002',
      orderNo: 'SB-ORD-2026-000002',
      version: 1,
      status: 'sent',
      validUntil: '2999-01-01',
      orderSpecifications: { product: 'LED letters', quantity: 2 },
      internalNotes: 'private margin',
      createdBy: 'Admin User',
      auditTrail: [{ action: 'private' }],
      customerPaymentsEnabled: false,
    }, [{ id: 1, description: 'LED letters', lineTotal: 100, metadata: { margin: 40 } }]);

    expect(dto).not.toHaveProperty('internalNotes');
    expect(dto).not.toHaveProperty('createdBy');
    expect(dto).not.toHaveProperty('auditTrail');
    expect(dto.items[0]).not.toHaveProperty('metadata');
    expect(dto.items[0].amount).toBe(100);
    expect(dto.productDetails.product).toBe('LED letters');
  });
});

describe('quotation PDF privacy', () => {
  test('creates a PDF from stored values without internal notes', async () => {
    const buffer = await pdf.createQuotationPdf({
      quotationNo: 'SB-QUO-2026-000001',
      version: 2,
      status: 'sent',
      issueDate: '2026-09-08',
      validUntil: '2026-09-30',
      orderNo: 'SB-ORD-2026-000001',
      customer: { name: 'Demo Customer', email: 'customer@signfix.in' },
      items: [{ description: 'ACP LED sign board', quantity: 1, unit: 'sqft', unitPrice: 1000, taxPercentage: 18, lineTotal: 1180 }],
      subtotal: 1000,
      discountAmount: 0,
      taxableAmount: 1000,
      gstPercentage: 18,
      gstAmount: 180,
      finalAmount: 1180,
      terms: 'Payment due within seven days.',
      customerNotes: 'Customer-visible note.',
      internalNotes: 'INTERNAL-SECRET-MARGIN',
    }, { name: 'SignFix', email: 'admin@signfix.in' });

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1500);
    expect(buffer.toString('latin1')).not.toContain('INTERNAL-SECRET-MARGIN');
  });
});
