import React from 'react';
import { AlertTriangle, Shield, AlertCircle, Flame } from 'lucide-react';

const RISK_CONFIG = {
    LOW: {
        label: 'Низкий',
        color: 'emerald',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-300',
        icon: Shield
    },
    MEDIUM: {
        label: 'Средний',
        color: 'amber',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-300',
        icon: AlertTriangle
    },
    HIGH: {
        label: 'Высокий',
        color: 'red',
        bgClass: 'bg-red-100',
        textClass: 'text-red-700',
        borderClass: 'border-red-300',
        icon: AlertCircle
    },
    CRITICAL: {
        label: 'Критический',
        color: 'red',
        bgClass: 'bg-red-200',
        textClass: 'text-red-900',
        borderClass: 'border-red-500',
        icon: Flame
    }
};

const ProjectRiskIndicator = ({ riskLevel, riskScore, size = 'md', showLabel = true, showScore = false }) => {
    const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.LOW;
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'h-6 px-2 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base'
    };

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 18
    };

    return (
        <div className={`inline-flex items-center gap-1.5 rounded-lg border ${config.borderClass} ${config.bgClass} ${sizeClasses[size]}`}>
            <Icon size={iconSizes[size]} className={config.textClass} />
            {showLabel && (
                <span className={`font-semibold ${config.textClass}`}>
                    {config.label}
                </span>
            )}
            {showScore && riskScore !== undefined && (
                <span className={`${config.textClass} opacity-75`}>
                    ({riskScore})
                </span>
            )}
        </div>
    );
};

export default ProjectRiskIndicator;
