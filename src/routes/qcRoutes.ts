import { Router } from 'express';
import { exportQcHandler, listQcHandler } from '../controllers/qcController.js';

export const qcRouter = Router();

qcRouter.get('/', listQcHandler);
qcRouter.get('/export.xlsx', exportQcHandler);
