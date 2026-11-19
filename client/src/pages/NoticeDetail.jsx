import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Pin, Download, Share2, Check, 
  FileText, Clock, Bell, AlertTriangle 
} from 'lucide-react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EightPointStar, StarDivider } from '../components/common/EightPointStar.jsx';
import { Breadcrumb } from '../components/common/Breadcrumb.jsx';

export function NoticeDetail() {
  const { slug } = useParams();
  const { locale, t, toBanglaNum, getLocalized } = useLanguage();

  const [notice, setNotice] = useState(null);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchNotice();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchNotice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/notices/${slug}`);
      if (!res.ok) {
        throw new Error('Notice not found');
      }
      const data = await res.json();
      if (data.success) {
        setNotice(data.notice);
        setRecentNotices(data.recentNotices || []);
      } else {
        throw new Error(data.error || 'Failed to load notice');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = notice ? getLocalized(notice, 'title') : (locale === 'bn' ? 'নোটিশ' : 'Notice');

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="py-16 max-w-4xl mx-auto px-4">
        <div className="h-8 w-40 bg-canvas-alt rounded animate-pulse mb-6" />
        <div className="h-12 w-3/4 bg-canvas-alt rounded animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-4 bg-canvas-alt rounded animate-pulse" />
          <div className="h-4 bg-canvas-alt rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-canvas-alt rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="py-20 max-w-2xl mx-auto px-4 text-center space-y-4">
        <SEO title={locale === 'bn' ? 'নোটিশ পাওয়া যায়নি' : 'Notice Not Found'} />
        <AlertTriangle className="w-12 h-12 text-gold-text mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-primary-dark">
          {locale === 'bn' ? 'নোটিশটি খুঁজে পাওয়া যায়নি' : 'Notice Not Found'}
        </h1>
        <p className="text-ink-muted text-sm">
          {locale === 'bn' 
            ? 'যে নোটিশটি আপনি খুঁজছেন তা মুছে ফেলা হয়েছে অথবা ভুল লিংক ব্যবহার করা হয়েছে।' 
            : 'The notice you are looking for may have been removed or the link is incorrect.'}
        </p>
        <Link
          to="/notices"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'bn' ? 'সকল নোটিশে ফিরে যান' : 'Back to All Notices'}</span>
        </Link>
      </div>
    );
  }

  const pubDate = notice.publishedAt 
    ? new Date(notice.publishedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="py-6 sm:py-12">
      <SEO 
        title={getLocalized(notice, 'title')} 
        description={getLocalized(notice, 'body').substring(0, 160)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb 
          items={[
            { label: locale === 'bn' ? 'নোটিশ ও সংবাদ' : 'Notices & News', to: '/notices' },
            { label: getLocalized(notice, 'title') },
          ]} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
          {/* Main Notice Body */}
          <div className="lg:col-span-2 space-y-8">
            <article className="bg-surface rounded-3xl p-6 sm:p-10 border border-sand shadow-sakinah-card space-y-6">
              {/* Badges & Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-sand">
                <div className="flex items-center gap-2">
                  {notice.isPinned && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gold-plate text-ink">
                      <Pin className="w-3.5 h-3.5 fill-current" />
                      <span>{locale === 'bn' ? 'জরুরি নোটিশ' : 'Pinned'}</span>
                    </span>
                  )}
                  {pubDate && (
                    <span className="text-xs text-ink-muted flex items-center gap-1 font-medium tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                      {pubDate}
                    </span>
                  )}
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-ink-muted hover:text-primary-dark hover:bg-primary-soft/60 border border-sand transition-colors min-h-[40px] tap-target"
                  title="শেয়ার করুন"
                  aria-label="Share notice"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span className="text-success font-semibold">{locale === 'bn' ? 'লিংক কপি হয়েছে!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-primary" />
                      <span>{locale === 'bn' ? 'শেয়ার করুন' : 'Share'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight leading-snug">
                {getLocalized(notice, 'title')}
              </h1>

              {/* Notice Body */}
              <div className="prose dark:prose-invert max-w-none text-ink text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4 pt-2">
                {getLocalized(notice, 'body')}
              </div>

              {/* Attachment Card if present */}
              {notice.attachmentPath && (
                <div className="mt-8 pt-6 border-t border-sand">
                  <div className="bg-canvas-alt rounded-2xl p-4 sm:p-5 border border-sand flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-dark flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-sm text-ink">
                          {locale === 'bn' ? 'সংযুক্ত নথিপত্র' : 'Official Notice Attachment'}
                        </h2>
                        <p className="text-xs text-ink-muted">
                          {locale === 'bn' ? 'অফিসিয়াল স্বাক্ষরিত কপি / পরিশিষ্ট' : 'Signed official circular / attachment'}
                        </p>
                      </div>
                    </div>

                    <a
                      href={notice.attachmentPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sakinah-sm min-h-[44px]"
                    >
                      <Download className="w-4 h-4" />
                      <span>{locale === 'bn' ? 'ডাউনলোড করুন' : 'Download File'}</span>
                    </a>
                  </div>
                </div>
              )}
            </article>
          </div>

          {/* Sidebar: Recent Notices */}
          <div className="space-y-6">
            <div className="bg-surface rounded-3xl p-6 border border-sand shadow-sakinah-card space-y-4">
              <h2 className="font-serif font-bold text-lg text-primary-dark flex items-center gap-2 border-b border-sand pb-3">
                <Bell className="w-4 h-4 text-gold-text" />
                <span>{locale === 'bn' ? 'সাম্প্রতিক অন্যান্য নোটিশ' : 'Other Recent Notices'}</span>
              </h2>

              {recentNotices.length === 0 ? (
                <p className="text-xs text-ink-muted">{locale === 'bn' ? 'অন্য কোনো সাম্প্রতিক নোটিশ নেই।' : 'No other recent notices.'}</p>
              ) : (
                <div className="space-y-3">
                  {recentNotices.map((rn) => (
                    <Link
                      key={rn.id}
                      to={`/notices/${rn.slug}`}
                      className="block p-3 rounded-xl hover:bg-primary-soft/50 border border-transparent hover:border-gold/40 transition-all group"
                    >
                      <h3 className="font-serif font-bold text-xs sm:text-sm text-ink group-hover:text-primary transition-colors line-clamp-2">
                        {getLocalized(rn, 'title')}
                      </h3>
                      {rn.publishedAt && (
                        <p className="text-[11px] text-ink-muted mt-1 flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3 h-3" />
                          {new Date(rn.publishedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-sand">
                <Link
                  to="/notices"
                  className="text-xs font-semibold text-primary-dark hover:text-gold-text transition-colors flex items-center justify-between"
                >
                  <span>{locale === 'bn' ? 'সকল নোটিশের তালিকা দেখুন' : 'View all notices'}</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

