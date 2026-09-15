import { describe, expect, it } from 'vitest';
import { parseQCMessage } from '../../src/parsers/qcParser.js';

const SAMPLE = `IPQC Random Inspection 15/09/2026
Factory 2 Row hole
Job Number: TD-HM-014
Number: 4
Machine No: 23
⏰Time: 15:03
📌QC check 100%=1pc.
✅QC check Ok.
❌unfinished`;

describe('qcParser', () => {
  it('1. parses the exact sample message', () => {
    const r = parseQCMessage(SAMPLE);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.inspectionDate).toBe('2026-09-15');
    expect(r.data.inspectionType).toBe('IPQC Random Inspection');
    expect(r.data.factory).toBe('Factory 2');
    expect(r.data.process).toBe('Row hole');
    expect(r.data.jobNumber).toBe('TD-HM-014');
    expect(r.data.number).toBe(4);
    expect(r.data.machineNumber).toBe('23');
    expect(r.data.inspectionTime).toBe('15:03');
    expect(r.data.qcCheck).toBe('100%=1pc.');
    expect(r.data.qcResult).toBe('OK');
    expect(r.data.status).toBe('Unfinished');
  });

  it('2. handles different capitalization', () => {
    const msg = SAMPLE.toLowerCase().replace('⏰', '').replace('📌', '').replace('✅', '').replace('❌', '');
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.factory).toBe('Factory 2');
    expect(r.data.jobNumber.toUpperCase()).toBe('TD-HM-014');
    expect(r.data.qcResult).toBe('OK');
    expect(r.data.status).toBe('Unfinished');
  });

  it('3. works without emoji markers', () => {
    const msg = `IPQC Random Inspection 15/09/2026
Factory 2 Row hole
Job Number: TD-HM-014
Number: 4
Machine No: 23
Time: 15:03
QC check 100%=1pc.
QC check Ok.
unfinished`;
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.inspectionTime).toBe('15:03');
    expect(r.data.qcResult).toBe('OK');
    expect(r.data.status).toBe('Unfinished');
  });

  it('4. tolerates extra spaces', () => {
    const msg = `  IPQC   Random   Inspection   15/09/2026
Factory    2    Row hole
Job Number:    TD-HM-014
Number:    4
Machine No:    23
⏰Time:    15:03
📌QC check   100%=1pc.
✅QC check   Ok.
❌   unfinished`;
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.jobNumber).toBe('TD-HM-014');
    expect(r.data.machineNumber).toBe('23');
  });

  it('5. supports different date formats', () => {
    for (const [input, iso] of [
      ['IPQC Random Inspection 15-09-2026', '2026-09-15'],
      ['IPQC Random Inspection 2026-09-15', '2026-09-15'],
      ['IPQC Random Inspection 01/02/2026', '2026-02-01'],
    ] as const) {
      const r = parseQCMessage(`${input}\nFactory 2 Row hole\nJob Number: TD-HM-014\nMachine No: 23\nQC check Ok.`);
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.inspectionDate).toBe(iso);
    }
  });

  it('6. supports different machine number formats', () => {
    for (const line of ['Machine No.: 23', 'Machine Number: 23', 'Machine: 23', 'machine no: 24']) {
      const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\n${line}\nQC check Ok.`);
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.machineNumber).toMatch(/23|24/);
    }
  });

  it('7. supports different factories/processes', () => {
    for (const [line, factory, process] of [
      ['Factory 1 Assembly', 'Factory 1', 'Assembly'],
      ['Factory 3 Sanding', 'Factory 3', 'Sanding'],
      ['Factory 2 Drilling', 'Factory 2', 'Drilling'],
    ] as const) {
      const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\n${line}\nJob Number: TD-HM-014\nMachine No: 23\nQC check Ok.`);
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.factory).toBe(factory);
        expect(r.data.process).toBe(process);
      }
    }
  });

  it('8. supports different job numbers', () => {
    for (const j of ['TD-HM-014', 'AB-123', 'JOB_2026/09', 'X1-2-3']) {
      const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: ${j}\nMachine No: 23\nQC check Ok.`);
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.jobNumber).toBe(j);
    }
  });

  it('9. fails gracefully when Machine No and Number are missing', () => {
    const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\nQC check Ok.`);
    // Machine No missing AND Number missing → not enough identity → failure mentioning machine
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.join(' ').toLowerCase()).toContain('machine');
  });

  it('10. fails gracefully when Job Number is missing', () => {
    const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nMachine No: 23\nQC check Ok.`);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.join(' ').toLowerCase()).toContain('job');
  });

  it('11. ignores unrelated messages', () => {
    for (const m of ['Good morning', 'Machine 23 repaired', 'Where is the QC team?']) {
      const r = parseQCMessage(m);
      expect(r.success).toBe(false);
    }
  });

  it('12. duplicate payload parses deterministically (idempotency is enforced at DB layer)', () => {
    const a = parseQCMessage(SAMPLE);
    const b = parseQCMessage(SAMPLE);
    expect(a).toEqual(b);
  });

  it('13. parses consecutive distinct reports independently', () => {
    const r1 = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\nMachine: 23\nQC check Ok.`);
    const r2 = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-015\nMachine: 24\nQC check Ok.`);
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect(r1.data.jobNumber).toBe('TD-HM-014');
      expect(r2.data.jobNumber).toBe('TD-HM-015');
      expect(r1.data.machineNumber).toBe('23');
      expect(r2.data.machineNumber).toBe('24');
    }
  });

  it('14. parses Status = NG', () => {
    const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\nMachine No: 23\nQC check NG.\n❌NG`);
    expect(r.success).toBe(true);
    if (!r.success) return;
    // NG may appear as qcResult and/or status depending on lines; at least one must be NG
    expect([r.data.qcResult, r.data.status]).toContain('NG');
  });

  it('15. parses Status = Finished', () => {
    const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\nMachine No: 23\nQC check Ok.\nFinished`);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe('Finished');
  });

  it('16. parses Status = Unfinished (case-insensitive)', () => {
    const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\nMachine No: 23\nQC check Ok.\nUNFINISHED`);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe('Unfinished');
  });

  it('accepts Number without Machine No (Number satisfies identity gate)', () => {
    const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\nNumber: 4\nQC check Ok.`);
    expect(r.success).toBe(true);
  });

  it('stores originalStatus alongside normalized status', () => {
    const r = parseQCMessage(SAMPLE);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.originalStatus?.toLowerCase().replace('.', '')).toBe('unfinished');
    expect(r.data.status).toBe('Unfinished');
  });
});
