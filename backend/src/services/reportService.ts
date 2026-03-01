import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface MismatchReport {
    id: string;
    store_id: string;
    store_name: string;
    requested_item_name: string;
    matched_item_name: string;
    requested_item_id?: string;
    matched_item_id?: string;
    report_reason: string;
    optional_note?: string;
    basket_size?: number;
    available_items_count?: number;
    coverage_percentage?: number;
    total_store_price?: number;
    session_id: string;
    created_at: string;
}

const REPORTS_FILE = path.join(process.cwd(), 'data/item_mismatch_reports.json');

// H3: In-memory session cache with TTL to prevent unbounded memory growth
interface SessionEntry {
    map: Map<string, number>;
    createdAt: number;
}
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const sessionReportCounts = new Map<string, SessionEntry>();

// Sweep stale sessions every hour to free memory
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, entry] of sessionReportCounts.entries()) {
        if (now - entry.createdAt > SESSION_TTL_MS) {
            sessionReportCounts.delete(sessionId);
        }
    }
}, 60 * 60 * 1000).unref(); // unref() so this doesn't prevent process exit

export class ReportService {
    /**
     * Saves a mismatch report to the JSON file
     */
    static async saveReport(reportData: Omit<MismatchReport, 'id' | 'created_at'>): Promise<MismatchReport> {
        // Anti-abuse check
        const compositeKey = `${reportData.store_id}_${reportData.matched_item_id || reportData.matched_item_name}`;
        this.incrementSessionReport(reportData.session_id, compositeKey);

        const newReport: MismatchReport = {
            ...reportData,
            id: uuidv4(),
            created_at: new Date().toISOString()
        };

        try {
            let reports: MismatchReport[] = [];
            try {
                const content = await fs.readFile(REPORTS_FILE, 'utf-8');
                reports = JSON.parse(content);
            } catch (error) {
                // File might not exist yet — start fresh
                reports = [];
            }

            reports.push(newReport);
            // Ensure the data/ directory exists (important in fresh production containers)
            await fs.mkdir(path.dirname(REPORTS_FILE), { recursive: true });
            await fs.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2));

            console.log(`[ReportService] New mismatch report saved: ${newReport.id}`);
            return newReport;
        } catch (error) {
            console.error('[ReportService] Error saving mismatch report:', error);
            throw new Error('Failed to save report');
        }
    }

    /**
     * Checks if a report for this item in this session already exists or exceeds limit
     */
    static canReport(sessionId: string, storeId: string, itemId: string): boolean {
        const entry = sessionReportCounts.get(sessionId);
        if (!entry) return true;

        const { map: sessionMap } = entry;

        // Check if this specific item has already been reported in this session
        const compositeKey = `${storeId}_${itemId}`;
        if (sessionMap.has(compositeKey)) return false;

        // Check if total reports for this store in this session exceeds 3
        let storeReportCount = 0;
        for (const [key, count] of sessionMap.entries()) {
            if (key.startsWith(`${storeId}_`)) {
                storeReportCount += count;
            }
        }

        return storeReportCount < 3;
    }

    private static incrementSessionReport(sessionId: string, compositeKey: string) {
        if (!sessionReportCounts.has(sessionId)) {
            sessionReportCounts.set(sessionId, { map: new Map(), createdAt: Date.now() });
        }
        const entry = sessionReportCounts.get(sessionId)!;
        entry.map.set(compositeKey, (entry.map.get(compositeKey) || 0) + 1);
    }
}
