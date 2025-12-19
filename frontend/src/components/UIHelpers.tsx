import { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-amber-600 hover:bg-amber-700',
        info: 'bg-primary-600 hover:bg-primary-700'
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4">
                    {variant === 'danger' && (
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                        <p className="text-sm text-slate-500 mt-1">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-colors disabled:opacity-50 ${variantStyles[variant]}`}
                    >
                        {loading ? 'Loading...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="p-4 bg-slate-100 rounded-full mb-4 text-slate-400">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 text-center max-w-xs">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

export default { ConfirmDialog, EmptyState };
