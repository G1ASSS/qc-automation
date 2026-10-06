import { Router } from 'express';
import { exportQcHandler, listQcHandler, summaryHandler, nightSummaryHandler } from '../controllers/qcController.js';

export const qcRouter = Router();

qcRouter.get('/summary/night', nightSummaryHandler);
qcRouter.get('/summary', summaryHandler);
qcRouter.get('/', listQcHandler);
qcRouter.get('/export.xlsx', exportQcHandler);
