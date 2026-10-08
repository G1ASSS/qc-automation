import { Router } from 'express';
import { exportQcHandler, listQcHandler, summaryHandler, nightSummaryHandler, exportNightHandler, deleteOneHandler, deleteManyHandler } from '../controllers/qcController.js';

export const qcRouter = Router();

qcRouter.get('/summary/night', nightSummaryHandler);
qcRouter.get('/summary', summaryHandler);
qcRouter.delete('/', deleteManyHandler);
qcRouter.delete('/:id', deleteOneHandler);
qcRouter.get('/', listQcHandler);
qcRouter.get('/export.xlsx', exportQcHandler);
qcRouter.get('/export-night.xlsx', exportNightHandler);
