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
    expect(r.data.number).toBe('4');
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

  it('19. extracts Defect/Remark lines', () => {
    const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\nMachine No: 23\nQC check 100%=1pc.\nQC check NG.\nDefect: scratch 5pcs`);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.qcResult).toBe('NG');
    expect(r.data.defectRemark).toBe('scratch 5pcs');
  });

  it('20. extracts NG free-text detail', () => {
    const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\nMachine No: 23\nQC check 100%=1pc.\nNG scratch on surface`);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.qcResult).toBe('NG');
    expect(r.data.defectRemark).toBe('scratch on surface');
  });

  it('21. defect is null when not given', () => {
    const r = parseQCMessage(`IPQC Random Inspection 15/09/2026\nFactory 2 Row hole\nJob Number: TD-HM-014\nMachine No: 23\nQC check Ok.`);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.defectRemark).toBeNull();
  });

  it('22. parses the NG problem-report format', () => {
    const msg = `🚨 IPQC 15/09/2026Random inspection reports have revealed problems.
Factory 2  hole line
⏰ 21:39
Shift work: (B)
Job Number: DS-13-JD
Machine number: 18
Number: 5
📌Problems encountered : Multiple white streaks on the black boards.
Qc Random Inspection: 30 pcs
Number of jobs found: 30 pcs.
📌Total NG =400 pcs.
📌please confirm sir.`;
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.inspectionDate).toBe('2026-09-15');
    expect(r.data.factory).toBe('Factory 2');
    expect(r.data.process).toBe('hole line');
    expect(r.data.jobNumber).toBe('DS-13-JD');
    expect(r.data.machineNumber).toBe('18');
    expect(r.data.number).toBe('5');
    expect(r.data.inspectionTime).toBe('21:39');
    expect(r.data.qcResult).toBe('NG');
    expect(r.data.defectRemark).toBe('Multiple white streaks on the black boards');
    expect(r.data.shift).toBe('B');
    expect(r.data.inspectionQty).toBe(30);
    expect(r.data.foundQty).toBe(30);
    expect(r.data.totalNg).toBe(400);
    expect(r.data.qcCheck).toBe('Random Inspection 30pcs; Found 30pcs');
  });

  it('23. tolerates spacing typos in the NG format', () => {
    const msg = `IPQC 15/09/ 2026 Random inspection reports have revealed problems
Factory 2 hole line
Time: 21 : 39
Shift work:B
Job Number:DS-13-JD
Machine No:18
Number:5
Problems encountered:Multiple white streaks
Total NG=400pcs`;
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.qcResult).toBe('NG');
    expect(r.data.inspectionTime).toBe('21:39');
    expect(r.data.shift).toBe('B');
    expect(r.data.totalNg).toBe(400);
  });

  it('24. nulls NG fields for the classic OK format', () => {
    const r = parseQCMessage(SAMPLE);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.shift).toBeNull();
    expect(r.data.inspectionQty).toBeNull();
    expect(r.data.foundQty).toBeNull();
    expect(r.data.totalNg).toBeNull();
  });

  it('25. preserves leading zeros in Number', () => {
    const r = parseQCMessage(SAMPLE.replace('Number: 4', 'Number: 00892496'));
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.number).toBe('00892496');
  });
  it('26. parses cleaning-line problem report with Found Problem + QC random check + NGFound items', () => {
    const msg = "\u{1F6A8} IPQC 06/10/2026Random inspection reports \nHave revealed problems.\nFactory 2 Cleaning Line\n\u23F0 Time:18:11\nShift work (A)\nJob Number: ZW-08\nMachine number: cleaning\nNumber: 3\nFound Problem: The glue bonding is not good and needs rework.\n\n\nQC random check: 10 pcs\nNGFound items: 30 pcs\nTotal NG: 50 pcs\nPlease rework  sir.";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.inspectionDate).toBe('2026-10-06');
    expect(r.data.factory).toBe('Factory 2');
    expect(r.data.process).toBe('Cleaning Line');
    expect(r.data.jobNumber).toBe('ZW-08');
    expect(r.data.machineNumber).toBe('cleaning');
    expect(r.data.number).toBe('3');
    expect(r.data.inspectionTime).toBe('18:11');
    expect(r.data.qcResult).toBe('NG');
    expect(r.data.defectRemark).toBe('The glue bonding is not good and needs rework');
    expect(r.data.shift).toBe('A');
    expect(r.data.inspectionQty).toBe(10);
    expect(r.data.foundQty).toBe(30);
    expect(r.data.totalNg).toBe(50);
  });
  it('27. parses dash-job area report with bare time and near-machine text', () => {
    const msg = "IPQC 09/09/2026Random inspection reports have revealed problems.\nFactory 2 hole Line\n17:47\nShift work: (A)\nJob Number: -\nMachine number: near 24\nNumber: -\nProblems encountered: The pile has collapsed\nQc Random Inspection: 10 pcs\nNumber of jobs found: 20 pcs";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.inspectionDate).toBe('2026-09-09');
    expect(r.data.jobNumber).toBe('NO-JOB');
    expect(r.data.machineNumber).toBe('near 24');
    expect(r.data.inspectionTime).toBe('17:47');
    expect(r.data.qcResult).toBe('NG');
    expect(r.data.defectRemark).toBe('The pile has collapsed');
    expect(r.data.inspectionQty).toBe(10);
    expect(r.data.foundQty).toBe(20);
  });

  it('28. parses space-before-colon random check and dash Total NG', () => {
    const msg = "IPQC 06/10/2026\nFactory 2 hole line\nTime: 10:29\nShift work (A)\nJob Number: SN-03\nMachine number: 12\nNumber: 10\nFound Problem: side frames are not same\nQC random : 10pcs.\nNGFound items: 8pcs.\nTotal NG: -";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.jobNumber).toBe('SN-03');
    expect(r.data.defectRemark).toBe('side frames are not same');
    expect(r.data.inspectionQty).toBe(10);
    expect(r.data.foundQty).toBe(8);
    expect(r.data.totalNg).toBe(null);
  });

  it('29. parses night-shift hours and night shift code', () => {
    const msg = "IPQC Random Inspection 06/10/2026\nFactory 2 Row hole\nJob Number: SN-03\nNumber: 5\nMachine No: 12\nTime: 02:30\nShift work (N)\nQC check 100%=1pc.\nQC check Ok.";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.inspectionTime).toBe('02:30');
    expect(r.data.shift).toBe('N');
    expect(r.data.qcResult).toBe('OK');
  });

  it('30. parses Factory 1 laminate report with model and colour', () => {
    const msg = "IPQC Random Check 7/10/2026 Factory 1  Laminate\nTime : 10:22\nModel number : 1220*2440*12mm\nMachine Number: 5\nColour:OA\nRandom inspection : 10Pcs\nQC Check Ok";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.inspectionDate).toBe('2026-10-07');
    expect(r.data.inspectionType).toBe('IPQC Random Check');
    expect(r.data.factory).toBe('Factory 1');
    expect(r.data.process).toBe('Laminate');
    expect(r.data.jobNumber).toBe('1220*2440*12mm');
    expect(r.data.number).toBe(null);
    expect(r.data.machineNumber).toBe('5');
    expect(r.data.modelNumber).toBe('1220*2440*12mm');
    expect(r.data.colour).toBe('OA');
    expect(r.data.inspectionTime).toBe('10:22');
    expect(r.data.qcResult).toBe('OK');
    expect(r.data.inspectionQty).toBe(10);
  });

  it('31. parses Factory 3 paint paren job with Random Number qty', () => {
    const msg = "IPQC Random Inspection 17/09/2026Factory 3 Paint Line B\nJob Number: TD-SWF-452(3)\nTime:18:43\nRandom Number: 10 pcs.\nQC Check Ok";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.jobNumber).toBe('TD-SWF-452');
    expect(r.data.number).toBe('3');
    expect(r.data.inspectionQty).toBe(10);
    expect(r.data.qcResult).toBe('OK');
  });

  it('32. parses slash job and ignores wooden list, bare Check lines give OK', () => {
    const msg = "IPQC Random Inspectionu 07/10/2026\nFactory2 Packing\nRandom check time: 19:50\nJob Number:JV11574WH/(ZW-08)\nNumber of wooden in box- 1,2,3,4,5\nCheck 100%= 1 pcs.\nCheck ok .";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.jobNumber).toBe('JV11574WH');
    expect(r.data.number).toBe('ZW-08');
    expect(r.data.inspectionTime).toBe('19:50');
    expect(r.data.qcResult).toBe('OK');
  });

  it('33. parses woodworking task with unlabeled slash code and total-checks qty', () => {
    const msg = "07/10/2026\nAdditional woodworking tasks.\nTime: 19:10\nRandom inspection task code:\nHV10826FG/(DS-47)\nTotal number of random checks: 11BOX\n(OK):11\n(NG):";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.factory).toBe('Factory 2');
    expect(r.data.jobNumber).toBe('HV10826FG');
    expect(r.data.number).toBe('DS-47');
    expect(r.data.inspectionQty).toBe(11);
  });

  it('34. parses Machine at: and cleans dotted QC detail', () => {
    const msg = "IPQC Random Inspection 23/09/2026\nFactory 2 Cutting\nJob Number:YS-14\n Time:23 :10\nNumber: 7:Machine at:2\n QC check. 100% = 1 Pcs\nQC Check Ok.";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.number).toBe('7');
    expect(r.data.machineNumber).toBe('2');
    expect(r.data.inspectionTime).toBe('23:10');
    expect(r.data.qcCheck).toBe('100% = 1 Pcs');
  });

  it('35. parses same-line Number and Machine with night time', () => {
    const msg = "IPQC Random Inspection 07/ 10/ 2026\nFactory 2Row hole\nJob Number:CT-126\nNumber: 3 Machine No:11\nTime: 22:35\nQC  check100%=1Pcs\nQC check Ok.";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.number).toBe('3');
    expect(r.data.machineNumber).toBe('11');
    expect(r.data.inspectionTime).toBe('22:35');
  });

  it('36. leaves Not Finished unmarked on hole-line spot checks', () => {
    const msg = "IPQC Random Inspection 23/ 09/ 2026\nFactory 2Row hole\nJob Number:SG-95\nNumber: 10 Machine No:1\nTime: 18:00\nQC  check=1pcs\nQC check Ok.\nNot Finished.";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.qcResult).toBe('OK');
    expect(r.data.status).toBe(null);
  });

  it('37. parses Manchine typo and sentence Check Ok with notes ignored', () => {
    const msg = "IPQC Random Inspection 07/10/2026\nFactory 3 Cutting Line\nJob Number: TD-SWF-102(6)\nManchine No:5\nTime: 19:15\nRandom All:10 pcs\nCutting workpiece Specification can be standard according to the Drawing  Check  Ok.";
    const r = parseQCMessage(msg);
    expect(r.success).toBe(true);
    if (!r.success) throw new Error(JSON.stringify(r.errors));
    expect(r.data.machineNumber).toBe('5');
    expect(r.data.number).toBe('6');
    expect(r.data.qcResult).toBe('OK');
    expect(r.data.defectRemark).toBe(null);
  });
  it('38. keeps free-text paren content and comma numbers', () => {
    const a = parseQCMessage("Job Number: TD-SWF-102(2,B)\nIPQC 07/09/2026\nFactory 3 Paint Line B\nTime:19:12\nRandom Number: 10 pcs.\nQC Check Ok");
    expect(a.success).toBe(true);
    if (!a.success) throw new Error(JSON.stringify(a.errors));
    expect(a.data.jobNumber).toBe('TD-SWF-102');
    expect(a.data.number).toBe('2,B');
    const b = parseQCMessage('Job Number:BY004S4(bicycle wheel 18" blue)\nIPQC 07/09/2026\nFactory 3 Paint Line A\nTime:18:51\nRandom Number: 30 pcs.\nQC Check Ok');
    expect(b.success).toBe(true);
    if (!b.success) throw new Error(JSON.stringify(b.errors));
    expect(b.data.number).toBe('bicycle wheel 18" blue');
  });
});
