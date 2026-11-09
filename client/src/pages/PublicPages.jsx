import React from 'react';
import { SEO } from '../components/common/SEO.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Clock } from 'lucide-react';

export function PagePlaceholder({ titleBn, titleEn, descBn, descEn }) {
  const { locale } = useLanguage();
  const title = locale === 'bn' ? titleBn : titleEn;
  const desc = locale === 'bn' ? descBn : descEn;

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
      <SEO title={title} />
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-gold-500/30 flex items-center justify-center text-emerald-800 mx-auto">
        <Clock className="w-8 h-8 text-gold-500" />
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">{title}</h1>
      <p className="text-stone-600 max-w-xl mx-auto">{desc}</p>
    </div>
  );
}

export function About() {
  return <PagePlaceholder titleBn="পরিচিতি ও ইতিহাস" titleEn="About & History" descBn="মানিকপুর কেন্দ্রীয় শাহী ঈদগাহের ঐতিহাসিক পটভূমি ও কমিটি।" descEn="History and managing committee of Manikpur Central Shahi Eidgah." />;
}

export function LifetimeMembers() {
  return <PagePlaceholder titleBn="আজীবন সদস্যবৃন্দ" titleEn="Lifetime Members" descBn="মানিকপুর ঈদগাহের সম্মানিত আজীবন সদস্য তালিকা।" descEn="Honored Lifetime Members of Manikpur Eidgah." />;
}

export function Donors() {
  return <PagePlaceholder titleBn="সম্মানিত অনুদানকারী" titleEn="Donors Ledger" descBn="ঈদগাহ উন্নয়ন তহবিলে অনুদানকারী দাতাবৃন্দের তালিকা।" descEn="Honored donors supporting the Eidgah development fund." />;
}

export function Gallery() {
  return <PagePlaceholder titleBn="ফটো গ্যালারি" titleEn="Photo Gallery" descBn="ঈদুল ফিতর ও ঈদুল আযহার জামাতের ঐতিহাসিক আলোকচিত্র।" descEn="Photographic archive of holy Eid prayer congregations." />;
}

export function GalleryFolder() {
  return <PagePlaceholder titleBn="ফোল্ডার বিস্তারিত" titleEn="Album Details" descBn="অ্যালবামের সকল ছবি প্রদর্শনী ও পূর্ণাঙ্গ লাইটবক্স।" descEn="Full album photos and lightbox view." />;
}

export function Designs() {
  return <PagePlaceholder titleBn="ডিজাইন ও পরিকল্পনা" titleEn="Design & Plan" descBn="প্রস্তাবিত ৩ডি স্থাপত্য নকশা ও শাহী মিম্বর পরিকল্পনা।" descEn="Proposed 3D architectural renders and layout plans." />;
}

export function MapPage() {
  return <PagePlaceholder titleBn="অবস্থান মানচিত্র" titleEn="Location Map" descBn="ঈদগাহ ময়দানের ভৌগোলিক অবস্থান ও সীমানা।" descEn="Geographical location and 1.35-acre boundary overlay." />;
}

export function LandMaps() {
  return <PagePlaceholder titleBn="জমির নকশা" titleEn="Cadastral Land Maps" descBn="সিএস, এসএ, আরএস ও বিএস জরিপের মৌজা নকশা।" descEn="Official CS, SA, RS, and BS cadastral mouza maps." />;
}

export function Documents() {
  return <PagePlaceholder titleBn="দলিল ও কাগজপত্র" titleEn="Legal Documents" descBn="ওয়াকফ দলিল, খতিয়ান, পর্চা ও নামজারি সংরক্ষণাগার।" descEn="Registered waqf deeds, khatians, and legal records." />;
}

export function Notices() {
  return <PagePlaceholder titleBn="নোটিশ ও সংবাদ" titleEn="Notices & News" descBn="ঈদগাহের সর্বশেষ নোটিশ ও জরুরি ঘোষণা।" descEn="Official announcements and notices." />;
}

export function NoticeDetail() {
  return <PagePlaceholder titleBn="নোটিশ বিস্তারিত" titleEn="Notice Detail" descBn="পূর্ণাঙ্গ নোটিশ ও ডাউনলোডযোগ্য সংযুক্তি।" descEn="Full notice announcement and attachment." />;
}

export function Contact() {
  return <PagePlaceholder titleBn="যোগাযোগ" titleEn="Contact" descBn="কমিটির সাথে যোগাযোগ ও অনুদান পাঠানোর ব্যাংক হিসাব।" descEn="Contact committee representatives and bank donation info." />;
}

