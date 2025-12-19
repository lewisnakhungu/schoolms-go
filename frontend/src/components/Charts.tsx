import { useMemo } from 'react';

interface ChartProps {
    data: number[];
    labels: string[];
    height?: number;
    color?: string;
}

// Simple Bar Chart
export function BarChart({ data, labels, height = 200, color = '#4F46E5' }: ChartProps) {
    const maxValue = Math.max(...data, 1);

    return (
        <div className="w-full" style={{ height }}>
            <div className="flex items-end justify-between h-full gap-2">
                {data.map((value, i) => {
                    const barHeight = (value / maxValue) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                                className="w-full rounded-t-lg transition-all duration-500 min-h-[4px]"
                                style={{
                                    height: `${barHeight}%`,
                                    backgroundColor: color,
                                    opacity: 0.8 + (value / maxValue) * 0.2
                                }}
                            />
                            <span className="text-xs text-slate-500 truncate max-w-full">{labels[i]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Simple Line Chart
export function LineChart({ data, labels, height = 200, color = '#4F46E5' }: ChartProps) {
    const maxValue = Math.max(...data, 1);
    const points = useMemo(() => {
        return data.map((value, i) => ({
            x: (i / (data.length - 1 || 1)) * 100,
            y: 100 - (value / maxValue) * 100
        }));
    }, [data, maxValue]);

    const pathD = points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
        : '';

    return (
        <div className="w-full relative" style={{ height }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#E2E8F0" strokeWidth="0.5" />
                ))}

                {/* Line path */}
                <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />
                ))}
            </svg>
            <div className="flex justify-between mt-2">
                {labels.map((label, i) => (
                    <span key={i} className="text-xs text-slate-500">{label}</span>
                ))}
            </div>
        </div>
    );
}

// Donut/Pie Chart
interface DonutChartProps {
    data: { value: number; color: string; label: string }[];
    size?: number;
}

export function DonutChart({ data, size = 160 }: DonutChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;

    const segments = data.map((d) => {
        const angle = (d.value / total) * 360;
        const startAngle = currentAngle;
        currentAngle += angle;
        return { ...d, startAngle, angle };
    });

    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox="0 0 100 100">
                {segments.map((seg, i) => {
                    const startRad = toRadians(seg.startAngle - 90);
                    const endRad = toRadians(seg.startAngle + seg.angle - 90);
                    const largeArc = seg.angle > 180 ? 1 : 0;

                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);

                    return (
                        <path
                            key={i}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={seg.color}
                            stroke="white"
                            strokeWidth="1"
                        />
                    );
                })}
                <circle cx="50" cy="50" r="25" fill="white" />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold" fill="#1E293B">
                    {total}
                </text>
            </svg>
            <div className="space-y-1">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
                        <span className="text-slate-600">{seg.label}: {seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Progress Ring
interface ProgressRingProps {
    value: number;
    max?: number;
    size?: number;
    color?: string;
    label?: string;
}

export function ProgressRing({ value, max = 100, size = 80, color = '#4F46E5', label }: ProgressRingProps) {
    const percent = Math.min((value / max) * 100, 100);
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className="transition-all duration-500"
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold" fill="#1E293B">
                    {percent.toFixed(0)}%
                </text>
            </svg>
            {label && <span className="text-xs text-slate-500 mt-1">{label}</span>}
        </div>
    );
}
