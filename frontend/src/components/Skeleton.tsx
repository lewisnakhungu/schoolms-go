// Loading skeleton components for better UX

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <Skeleton className="h-5 w-1/3 mb-3" />
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4" />
        </div>
    );
}

export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <div className="p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} />
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-48 rounded-xl" />
            </div>

            {/* Stats */}
            <StatCardsSkeleton count={3} />

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
            <TableSkeleton rows={5} />
        </div>
    );
}

export default {
    Skeleton,
    CardSkeleton,
    StatCardsSkeleton,
    TableRowSkeleton,
    TableSkeleton,
    DashboardSkeleton,
    PageSkeleton
};
