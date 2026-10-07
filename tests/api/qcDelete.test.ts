import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/database/prisma.js', () => ({
  prisma: {
    qcInspection: { findUnique: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('../../src/integrations/google-sheets/sheetsClient.js', () => ({
  dbRowSheetKey: vi.fn((r: { id: string }) => `key-${r.id}`),
  removeSheetRowsByKeys: vi.fn(),
}));

import { prisma } from '../../src/database/prisma.js';
import { removeSheetRowsByKeys } from '../../src/integrations/google-sheets/sheetsClient.js';
import { deleteOneHandler, deleteManyHandler } from '../../src/controllers/qcController.js';

function mockRes() {
  const state: { status?: number; body?: unknown } = {};
  const json = vi.fn((body: unknown) => {
    state.body = body;
  });
  const status = vi.fn((code: number) => {
    state.status = code;
    return { json };
  });
  return { status: status as never, json: json as never, code: state };
}

function req(parts: object) {
  return { params: {}, query: {}, header: () => '', ...parts } as never;
}

const OLD_TOKEN = process.env.ADMIN_TOKEN;

describe('delete handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_TOKEN = 'test-token';
  });
  afterEach(() => {
    if (OLD_TOKEN === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = OLD_TOKEN;
  });

  it('rejects without token configured (503) and with wrong token (403)', async () => {
    delete process.env.ADMIN_TOKEN;
    const r1 = mockRes();
    await deleteOneHandler(req({}), r1);
    expect(r1.code.status).toBe(503);
    process.env.ADMIN_TOKEN = 'test-token';
    const r2 = mockRes();
    await deleteOneHandler(req({ params: { id: 'x' }, header: () => 'Bearer nope' }), r2);
    expect(r2.code.status).toBe(403);
  });

  it('returns 404 for unknown id', async () => {
    vi.mocked(prisma.qcInspection.findUnique).mockResolvedValue(null);
    const res = mockRes();
    await deleteOneHandler(req({ params: { id: 'nope' }, header: () => 'Bearer test-token' }), res);
    expect(res.code.status).toBe(404);
  });

  it('deletes one row and its sheet row', async () => {
    vi.mocked(prisma.qcInspection.findUnique).mockResolvedValue({ id: 'abc' } as never);
    vi.mocked(prisma.qcInspection.delete).mockResolvedValue({} as never);
    vi.mocked(removeSheetRowsByKeys).mockResolvedValue(1);
    const res = mockRes();
    await deleteOneHandler(req({ params: { id: 'abc' }, header: () => 'Bearer test-token' }), res);
    expect(res.code.body).toMatchObject({ ok: true, id: 'abc', sheetRemoved: true });
    expect(prisma.qcInspection.delete).toHaveBeenCalledWith({ where: { id: 'abc' } });
  });

  it('bulk delete reports counts and caps at 500', async () => {
    vi.mocked(prisma.qcInspection.findMany).mockResolvedValue([{ id: 'a' }, { id: 'b' }] as never);
    vi.mocked(prisma.qcInspection.deleteMany).mockResolvedValue({ count: 2 } as never);
    vi.mocked(removeSheetRowsByKeys).mockResolvedValue(2);
    const res = mockRes();
    await deleteManyHandler(req({ query: { jobNumber: 'SN-100test' }, header: () => 'Bearer test-token' }), res);
    expect(res.code.body).toMatchObject({ ok: true, deleted: 2, sheetRemoved: 2 });
    expect(prisma.qcInspection.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['a', 'b'] } } });
  });

  it('bulk delete with no matches returns zeros', async () => {
    vi.mocked(prisma.qcInspection.findMany).mockResolvedValue([]);
    const res = mockRes();
    await deleteManyHandler(req({ query: { jobNumber: 'NOPE' }, header: () => 'Bearer test-token' }), res);
    expect(res.code.body).toMatchObject({ ok: true, deleted: 0, sheetRemoved: 0 });
  });
});
