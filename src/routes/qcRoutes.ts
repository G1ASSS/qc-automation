import { Router } from 'express';
import { exportQcHandler, listQcHandler, summaryHandler } from '../controllers/qcController.js';

export const qcRouter = Router();

qcRouter.get('/summary', summaryHandler);
qcRouter.get('/', listQcHandler);
qcRouter.get('/export.xlsx', exportQcHandler);
