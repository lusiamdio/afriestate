import React, { useState, useEffect } from 'react';
import type { InvestorSettings, User } from '../../../types';
import { ClipboardDocumentIcon, CheckBadgeIcon } from '../../icons/ActionIcons';
import { useToast } from '../../../contexts/ToastContext';

interface InvestorSettingsProps {
  settings: InvestorSettings | null;
  onUpdateSettings: (settings: InvestorSettings) => void;
  user: User;
}

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({
  label,
  checked,
  onChange,
}) => (
  <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
    <span className="relative inline-flex items-center shrink-0">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`block w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#0F2D25] dark:bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      />
      <span
        className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </span>
  </label>
);

const InvestorSettingsPage: React.FC<InvestorSettingsProps> = ({ settings, onUpdateSettings, user }) => {
  const [localSettings, setLocalSettings] = useState<InvestorSettings | null>(settings);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!localSettings) {
    return (
      <div className="p-8 h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Loading workspace preferences...
      </div>
    );
  }

  const handleWidgetToggle = (id: string, isVisible: boolean) => {
    setLocalSettings((prev) =>
      prev
        ? {
            ...prev,
            widgets: prev.widgets.map((w) => (w.id === id ? { ...w, isVisible } : w)),
          }
        : null
    );
  };

  const handleAlertsToggle = (key: 'priceDrop' | 'rentalVacancy', checked: boolean) => {
    setLocalSettings((prev) =>
      prev
        ? {
            ...prev,
            alerts: { ...prev.alerts, [key]: checked },
          }
        : null
    );
  };

  const handleRoiAlertToggle = (checked: boolean) => {
    setLocalSettings((prev) =>
      prev
        ? {
            ...prev,
            alerts: { ...prev.alerts, roiThreshold: { ...prev.alerts.roiThreshold, isEnabled: checked } },
          }
        : null
    );
  };

  const handleRoiValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalSettings((prev) =>
      prev
        ? {
            ...prev,
            alerts: { ...prev.alerts, roiThreshold: { ...prev.alerts.roiThreshold, value } },
          }
        : null
    );
  };

  const handleSaveChanges = () => {
    if (localSettings) {
      onUpdateSettings(localSettings);
      addToast('Investor preferences saved.', 'success');
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(localSettings.apiToken);
    setCopied(true);
    addToast('API key copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportData = (format: 'json' | 'csv') => {
    const payload =
      format === 'csv'
        ? 'Account,ROI_Threshold_Enabled,ROI_Threshold_Pct,Price_Drop_Alerts,Vacancy_Alerts\n' +
          `${user.username},${localSettings.alerts.roiThreshold.isEnabled},${localSettings.alerts.roiThreshold.value},${localSettings.alerts.priceDrop},${localSettings.alerts.rentalVacancy}`
        : JSON.stringify({ user: user.username, preferences: localSettings }, null, 2);

    const blob = new Blob([payload], {
      type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `investor-config.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    addToast(`Exported portfolio configuration (${format.toUpperCase()}).`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1000px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Settings &amp; API Access
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure terminal modules, yield thresholds, and institutional data exports.
          </p>
        </div>
        <button
          onClick={handleSaveChanges}
          className="px-4 py-2 text-xs font-semibold bg-[#0F2D25] text-white rounded-lg hover:bg-[#173f34] transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          Save Preferences
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Terminal Modules</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Select which analytical panels display on your Portfolio Snapshot.
          </p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {localSettings.widgets.map((widget) => (
              <Toggle
                key={widget.id}
                label={widget.label}
                checked={widget.isVisible}
                onChange={(checked) => handleWidgetToggle(widget.id, checked)}
              />
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Risk &amp; Yield Alerts</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
            Receive automated triggers for watchlist repricing, vacancies, or cap-rate targets.
          </p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <Toggle
              label="Price drop on watchlist asset"
              checked={localSettings.alerts.priceDrop}
              onChange={(checked) => handleAlertsToggle('priceDrop', checked)}
            />
            <Toggle
              label="Rental vacancy alert"
              checked={localSettings.alerts.rentalVacancy}
              onChange={(checked) => handleAlertsToggle('rentalVacancy', checked)}
            />
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <Toggle
                  label="Minimum ROI threshold alert"
                  checked={localSettings.alerts.roiThreshold.isEnabled}
                  onChange={handleRoiAlertToggle}
                />
              </div>
              {localSettings.alerts.roiThreshold.isEnabled && (
                <div className="relative w-28 shrink-0">
                  <input
                    type="number"
                    value={localSettings.alerts.roiThreshold.value}
                    onChange={handleRoiValueChange}
                    className="w-full pl-3 pr-7 py-1.5 text-sm font-mono tabular-nums border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400">%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Data Export &amp; API Key</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download structured reporting feeds or authenticate external portfolio trackers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleExportData('json')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Export Portfolio JSON
            </button>
            <button
              onClick={() => handleExportData('csv')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Export Preferences CSV
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Institutional API Token
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={localSettings.apiToken}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-200"
              />
              <button
                onClick={handleCopyToClipboard}
                className="bg-slate-900 dark:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? <CheckBadgeIcon className="w-4 h-4 text-emerald-400" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorSettingsPage;