import React from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';

export function BilingualInput({
  label,
  valueBn = '',
  valueEn = '',
  onChangeBn,
  onChangeEn,
  placeholderBn = '',
  placeholderEn = '',
  required = false,
  isTextArea = false,
  rows = 3,
  className = '',
}) {
  const hasBn = Boolean(valueBn && String(valueBn).trim());
  const hasEn = Boolean(valueEn && String(valueEn).trim());

  const handleCopyToEn = () => {
    if (valueBn && !valueEn && onChangeEn) {
      onChangeEn(valueBn);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Top Header: Label & Status Badges */}
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-bold text-ink">
          {label} {required && <span className="text-danger">*</span>}
        </label>

        <div className="flex items-center gap-1.5">
          {hasBn && hasEn ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-soft text-success">
              <Check className="w-3 h-3 text-success" />
              <span>উভয় ভাষা সম্পূর্ণ</span>
            </span>
          ) : hasBn && !hasEn ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-soft text-warning">
              <AlertCircle className="w-3 h-3 text-warning" />
              <span>ইংরেজি বাকি</span>
            </span>
          ) : !hasBn && hasEn ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-soft text-warning">
              <AlertCircle className="w-3 h-3 text-warning" />
              <span>বাংলা বাকি</span>
            </span>
          ) : (
            required && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-soft text-danger">
                <span>উভয় ভাষা আবশ্যক</span>
              </span>
            )
          )}

          {hasBn && !hasEn && !isTextArea && (
            <button
              type="button"
              onClick={handleCopyToEn}
              title="বাংলা টেক্সট ইংরেজিতে কপি করুন"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-ink-muted bg-canvas-alt hover:bg-primary-soft hover:text-primary-dark rounded-md border border-sand transition-colors"
            >
              <Copy className="w-2.5 h-2.5" />
              <span>Copy</span>
            </button>
          )}
        </div>
      </div>

      {/* Side-by-side (stacked on mobile) Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Bangla Input */}
        <div>
          <span className="block text-[10px] font-semibold text-ink-muted mb-1">
            বাংলা (Bangla) {required && <span className="text-danger">*</span>}
          </span>
          {isTextArea ? (
            <textarea
              rows={rows}
              value={valueBn}
              onChange={(e) => onChangeBn && onChangeBn(e.target.value)}
              placeholder={placeholderBn}
              className={`w-full px-3 py-2 bg-canvas border rounded-xl text-sm text-ink focus:outline-none focus:bg-surface transition-all ${
                required && !hasBn 
                  ? 'border-warning/60 focus:border-primary' 
                  : 'border-sand focus:border-primary'
              }`}
            />
          ) : (
            <input
              type="text"
              value={valueBn}
              onChange={(e) => onChangeBn && onChangeBn(e.target.value)}
              placeholder={placeholderBn}
              className={`w-full px-3 py-2 bg-canvas border rounded-xl text-sm text-ink focus:outline-none focus:bg-surface transition-all ${
                required && !hasBn 
                  ? 'border-warning/60 focus:border-primary' 
                  : 'border-sand focus:border-primary'
              }`}
            />
          )}
        </div>

        {/* English Input */}
        <div>
          <span className="block text-[10px] font-semibold text-ink-muted mb-1">
            English {required && <span className="text-danger">*</span>}
          </span>
          {isTextArea ? (
            <textarea
              rows={rows}
              value={valueEn}
              onChange={(e) => onChangeEn && onChangeEn(e.target.value)}
              placeholder={placeholderEn}
              className={`w-full px-3 py-2 bg-canvas border rounded-xl text-sm text-ink focus:outline-none focus:bg-surface transition-all ${
                required && !hasEn 
                  ? 'border-warning/60 focus:border-primary' 
                  : 'border-sand focus:border-primary'
              }`}
            />
          ) : (
            <input
              type="text"
              value={valueEn}
              onChange={(e) => onChangeEn && onChangeEn(e.target.value)}
              placeholder={placeholderEn}
              className={`w-full px-3 py-2 bg-canvas border rounded-xl text-sm text-ink focus:outline-none focus:bg-surface transition-all ${
                required && !hasEn 
                  ? 'border-warning/60 focus:border-primary' 
                  : 'border-sand focus:border-primary'
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

