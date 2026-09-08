import { afterEach, describe, expect, test, vi } from 'vitest';
import { createRequire } from 'node:module';
import quotationService from './quotationService.js';

const require = createRequire(import.meta.url);
const database = require('../database.js');
const originalGetPool = database.getPool;

function fakeDatabase(row, ownerUserId = 7) {
  const calls = [];
  const query = vi.fn(async (sql, values = []) => {
    const text = String(sql);
    calls.push({ text, values });
    if (text.includes("q.valid_until<CURRENT_DATE FOR UPDATE")) return { rows: [] };
    if (text.includes("q.valid_until=CURRENT_DATE+1")) return { rows: [] };
    if (text.includes('WHERE q.quotation_no=$1')) {
      const ownsQuotation = !text.includes('c.user_id=$2') || Number(values[1]) === ownerUserId;
      return { rows: ownsQuotation && row ? [row] : [] };
    }
    if (text.includes("WHERE u.status='active' AND r.name=ANY")) return { rows: [] };
    return { rows: [] };
  });
  const client = { query, release: vi.fn() };
  return { calls, pool: { query, connect: vi.fn(async () => client) } };
}

const activeQuotation = {
  id: 44,
  quotationNo: 'SB-QUO-2026-000044',
  customerId: 3,
  orderId: 12,
  version: 2,
  lockVersion: 5,
  status: 'viewed',
  validUntil: '2999-01-01',
  orderStatus: 'quotation',
};

afterEach(() => {
  database.getPool = originalGetPool;
  vi.restoreAllMocks();
});

describe('customer quotation transactional actions', () => {
  test('approves only through an ownership-constrained row lock', async () => {
    const fake = fakeDatabase(activeQuotation);
    database.getPool = () => fake.pool;

    const result = await quotationService.customerAction(7, activeQuotation.quotationNo, 'approve', 'Approved');

    expect(result).toEqual({ quotationNo: activeQuotation.quotationNo, status: 'approved', version: 2, idempotent: false });
    const ownershipRead = fake.calls.find((call) => call.text.includes('WHERE q.quotation_no=$1'));
    expect(ownershipRead.text).toContain('c.user_id=$2');
    expect(ownershipRead.text).toContain('FOR UPDATE OF q');
    expect(ownershipRead.values).toEqual([activeQuotation.quotationNo, 7]);
    expect(fake.calls.some((call) => call.text.includes('UPDATE quotations SET status=$2') && call.values[1] === 'approved')).toBe(true);
    expect(fake.calls.some((call) => call.text === 'COMMIT')).toBe(true);
  });

  test('returns ownership-safe 404 and rolls back for another customer', async () => {
    const fake = fakeDatabase(activeQuotation, 99);
    database.getPool = () => fake.pool;

    await expect(quotationService.customerAction(7, activeQuotation.quotationNo, 'approve')).rejects.toMatchObject({
      status: 404,
      errorCode: 'QUOTATION_NOT_FOUND',
    });
    expect(fake.calls.some((call) => call.text.includes('UPDATE quotations SET status=$2'))).toBe(false);
    expect(fake.calls.some((call) => call.text === 'ROLLBACK')).toBe(true);
  });

  test('makes repeated approval idempotent without another status update', async () => {
    const fake = fakeDatabase({ ...activeQuotation, status: 'approved' });
    database.getPool = () => fake.pool;

    const result = await quotationService.customerAction(7, activeQuotation.quotationNo, 'approve');

    expect(result.idempotent).toBe(true);
    expect(result.status).toBe('approved');
    expect(fake.calls.some((call) => call.text.includes('UPDATE quotations SET status=$2'))).toBe(false);
  });

  test.each([
    ['request_changes', 'change_requested', 'Please revise the installation charge.'],
    ['reject', 'rejected', 'The amount is outside our budget.'],
  ])('persists %s with the customer comment and audit history', async (action, status, comment) => {
    const fake = fakeDatabase(activeQuotation);
    database.getPool = () => fake.pool;

    const result = await quotationService.customerAction(7, activeQuotation.quotationNo, action, comment);

    expect(result.status).toBe(status);
    const update = fake.calls.find((call) => call.text.includes('UPDATE quotations SET status=$2'));
    expect(update.values).toEqual([activeQuotation.id, status, comment]);
    expect(fake.calls.some((call) => call.text.includes('INSERT INTO quotation_status_history'))).toBe(true);
    expect(fake.calls.some((call) => call.text.includes('INSERT INTO audit_logs'))).toBe(true);
  });
});
