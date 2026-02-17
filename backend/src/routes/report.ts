import express from 'express';
import { body, validationResult } from 'express-validator';
import { ReportService } from '../services/reportService.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

// Session ID is required for anti-abuse but can be a simple frontend-generated UUID
router.post('/mismatch', [
    body('store_id').notEmpty(),
    body('store_name').notEmpty(),
    body('requested_item_name').notEmpty(),
    body('matched_item_name').notEmpty(),
    body('report_reason').notEmpty().isIn(['Wrong product matched', 'Wrong size or variant', 'Wrong price', 'Marked available but unavailable', 'Other']),
    body('session_id').notEmpty(),
], async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ApiError(400, 'Invalid report data'));
        }

        const { store_id, matched_item_id, matched_item_name, session_id } = req.body;

        // Anti-abuse check before processing
        const identifier = matched_item_id || matched_item_name;
        if (!ReportService.canReport(session_id, store_id, identifier)) {
            return next(new ApiError(429, 'Reporting limit reached or duplicate item report.'));
        }

        const report = await ReportService.saveReport(req.body);
        res.status(201).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
});

export default router;
