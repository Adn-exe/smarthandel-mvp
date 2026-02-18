import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, note: string) => Promise<void>;
    itemName: string;
}

const REASONS = [
    'Wrong product matched',
    'Wrong size or variant',
    'Wrong price',
    'Marked available but unavailable',
    'Other'
];

export function ReportModal({ isOpen, onClose, onSubmit, itemName }: ReportModalProps) {
    const { t } = useTranslation();
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReason) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await onSubmit(selectedReason, note);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setSelectedReason('');
                setNote('');
            }, 2000);
        } catch (err) {
            setError(t('report.submitError', 'Failed to submit report. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-dark/20 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-dark tracking-tight leading-tight">
                                {t('report.title', 'Report item issue')}
                            </h3>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {itemName}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-dark">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="p-10 text-center flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h4 className="text-xl font-black text-dark mb-2">{t('report.thankYou', 'Thank you!')}</h4>
                        <p className="text-gray-500 font-medium">{t('report.successText', 'Your report has been submitted. This helps us improve our matching quality.')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                    {t('report.reasonLabel', 'What is wrong with this item?')}
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {REASONS.map((reason) => (
                                        <label
                                            key={reason}
                                            className={clsx(
                                                "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                                                selectedReason === reason
                                                    ? "bg-primary/5 border-primary shadow-sm"
                                                    : "border-gray-50 hover:bg-gray-50 hover:border-gray-100"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                                selectedReason === reason ? "border-primary bg-primary" : "border-gray-200"
                                            )}>
                                                {selectedReason === reason && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name="reason"
                                                value={reason}
                                                checked={selectedReason === reason}
                                                onChange={(e) => setSelectedReason(e.target.value)}
                                                className="hidden"
                                                required
                                            />
                                            <span className={clsx(
                                                "text-sm font-bold",
                                                selectedReason === reason ? "text-dark" : "text-gray-600"
                                            )}>
                                                {reason}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                    {t('report.noteLabel', 'Additional Notes (Optional)')}
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={t('report.notePlaceholder', 'Tell us more about the issue...')}
                                    maxLength={250}
                                    className="w-full p-4 rounded-xl border-2 border-gray-50 focus:border-primary focus:outline-none text-sm font-medium resize-none transition-all"
                                    rows={3}
                                />
                                <div className="text-right mt-1">
                                    <span className="text-[10px] font-bold text-gray-400">
                                        {note.length}/250
                                    </span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={!selectedReason || isSubmitting}
                                className={clsx(
                                    "flex-[2] px-6 py-3 bg-primary text-white font-black rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none",
                                    isSubmitting && "animate-pulse"
                                )}
                            >
                                {isSubmitting ? t('report.submitting', 'Submitting...') : t('report.submit', 'Submit Report')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
