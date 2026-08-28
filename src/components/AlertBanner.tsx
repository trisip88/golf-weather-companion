import React, { useState } from 'react';
import { AlertTriangle, Zap, CloudRain, Flame, Wind, Eye, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { Alert } from '../types';

interface AlertBannerProps {
  alerts: Alert[];
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  const unsafeAlerts = alerts.filter((a) => a.severity === 'unsafe');
  const highAlerts = alerts.filter((a) => a.severity === 'high');
  const advisoryAlerts = alerts.filter((a) => a.severity === 'advisory');

  const primaryAlert = unsafeAlerts[0] || highAlerts[0] || advisoryAlerts[0];
  const totalCount = alerts.length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'thunderstorm':
        return <Zap className="w-5 h-5 text-amber-300 fill-amber-300/30 shrink-0" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-sky-300 shrink-0" />;
      case 'heat':
        return <Flame className="w-5 h-5 text-rose-300 shrink-0" />;
      case 'wind':
        return <Wind className="w-5 h-5 text-indigo-300 shrink-0" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-300 shrink-0" />;
    }
  };

  const getAlertBadgeStyle = (severity: string) => {
    switch (severity) {
      case 'unsafe':
        return 'bg-rose-950 border-rose-500 text-rose-100';
      case 'high':
        return 'bg-amber-950 border-amber-500 text-amber-100';
      default:
        return 'bg-slate-900 border-slate-600 text-slate-200';
    }
  };

  const isUnsafe = unsafeAlerts.length > 0;

  return (
    <div
      id="safety-alerts-banner"
      className={`border-b ${
        isUnsafe
          ? 'bg-rose-900 text-white border-rose-700 shadow-lg animate-pulse-slow'
          : 'bg-amber-900/90 text-amber-50 border-amber-700'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5">{getAlertIcon(primaryAlert.type)}</div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-white border border-white/20">
                  {primaryAlert.severity.toUpperCase()} ALERT
                </span>
                <span className="text-[11px] opacity-80 uppercase tracking-wider font-mono">
                  [{primaryAlert.basis}]
                </span>
              </div>
              <p className="text-sm font-semibold mt-1 leading-snug">
                {primaryAlert.message}
              </p>
              
              {/* Mandatory course horn safety rule */}
              <div className="flex items-center gap-1.5 text-xs text-amber-200/90 mt-1 font-medium bg-black/20 px-2 py-1 rounded inline-flex">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Club Rule: App is advisory; the course lightning siren/horn is authoritative.</span>
              </div>
            </div>
          </div>

          {totalCount > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 transition flex items-center gap-1 shrink-0 mt-1 text-white"
            >
              <span>{totalCount} Active</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Collapsible drawer for additional alerts */}
        {isExpanded && totalCount > 1 && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            {alerts.slice(1).map((alert, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${getAlertBadgeStyle(
                  alert.severity
                )}`}
              >
                {getAlertIcon(alert.type)}
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold uppercase tracking-wider">{alert.type} ({alert.severity})</span>
                    <span className="opacity-75">[{alert.basis}]</span>
                  </div>
                  <p>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
