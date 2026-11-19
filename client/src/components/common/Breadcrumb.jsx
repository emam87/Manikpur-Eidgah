import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function Breadcrumb({ items = [] }) {
  const { locale } = useLanguage();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="py-2">
      {/* Mobile Ergonomic Back Button */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-dark hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg bg-surface/90 border border-sand shadow-sakinah-sm tap-feedback min-h-[38px]"
        >
          <ChevronLeft className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>{locale === 'bn' ? 'ফিরে যান' : 'Back'}</span>
        </button>
      </div>

      {/* Desktop Breadcrumbs (>= 1024px) */}
      <ol className="hidden lg:flex items-center flex-wrap gap-1.5 text-xs text-ink-muted">
        <li>
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>{locale === 'bn' ? 'হোম' : 'Home'}</span>
          </Link>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-ink-muted/60" />
              {isLast || !item.to ? (
                <span className="font-semibold text-primary-dark truncate max-w-xs" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-primary transition-colors truncate max-w-xs">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
