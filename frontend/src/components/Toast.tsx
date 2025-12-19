import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = Date.now().toString();
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after duration
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, toast.duration || 4000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast, toasts }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />
    };

    const backgrounds = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
        warning: 'bg-amber-50 border-amber-200'
    };

    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm
                transform transition-all duration-300 ease-out
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                ${backgrounds[toast.type]}
            `}
        >
            {icons[toast.type]}
            <div className="flex-1">
                <p className="font-medium text-slate-900">{toast.title}</p>
                {toast.message && (
                    <p className="text-sm text-slate-600 mt-0.5">{toast.message}</p>
                )}
            </div>
            <button
                onClick={onRemove}
                className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
                <X className="h-4 w-4 text-slate-400" />
            </button>
        </div>
    );
}

// Standalone toast function for simple use cases
let globalAddToast: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function setGlobalToast(fn: (toast: Omit<Toast, 'id'>) => void) {
    globalAddToast = fn;
}

export function toast(type: ToastType, title: string, message?: string) {
    if (globalAddToast) {
        globalAddToast({ type, title, message });
    }
}

export default { ToastProvider, useToast, toast };
