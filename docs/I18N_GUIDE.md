# Manikpur Eidgah — Strict Bilingual (bn / en) Guide

## 1. Overview & Architecture

Manikpur Eidgah implements a **Strict Bilingual System** supporting Bengali (`bn`) and English (`en`).
- **Default Language**: Bengali (`bn`).
- **Language State**: Managed via React `LanguageContext` and stored in `localStorage` (`manikpur_language`).
- **URL & Navigation**: The language toggle seamlessly updates text, dates, numbers, currencies, SEO meta, and document titles without losing scroll position, page filters, or routes.

---

## 2. Zero-Fallback Rule

> [!IMPORTANT]
> **No Cross-Language Fallback on Public Pages**:
> When the user selects English, no Bengali text must ever leak onto the interface. If an English translation for a database item or optional attribute is missing, the item or field is omitted cleanly from view rather than falling back to Bengali. In Admin view only, missing values display a subtle placeholder (`—`).

### Implementation Pattern:
```jsx
// Public component zero-fallback pattern
const title = getLocalized(item, 'title');
if (locale === 'en' && !title) {
  return null; // Skip rendering unlocalized content in English mode
}
```

---

## 3. UI Translations (`locales/bn.json` & `locales/en.json`)

All UI strings are namespaced in:
- `client/src/locales/bn.json`
- `client/src/locales/en.json`

### Namespaces:
- `common`: Universal UI controls, labels, statuses, pagination, buttons.
- `nav`: Navigation links, mobile drawer items, language toggle.
- `hero`: Main hero headline, subtitle, CTAs, audio, weather badges.
- `stats`: Key metrics and counters.
- `home`: Section headings, previews, and teasers.
- `about`: History, location, Managing Committee, timeline.
- `members`: Lifetime members directory, filters, tables, certificates.
- `land_donors`: Land donors registry, unit switcher, deed cards, timeline.
- `donations`: Archived monetary donations table, receipts.
- `gallery`: Photo albums, filters, lightbox controls, counters.
- `designs`: Architectural 3D renders, video tour.
- `map`: Leaflet map popups, directions, polygon boundaries.
- `land_maps`: Mouza and CS/SA/RS survey maps.
- `documents`: Waqf deeds, porchas, khatians, legal records.
- `notices`: Community announcements, dates, attachments.
- `contact`: Bank account, hotline, bKash/Nagad details.
- `footer`: Footer links, credits, legal.
- `admin`: Admin portal strings, forms, buttons, audit reports.
- `enums`: Localized enum labels (donation types, land units, khatian types, categories).
- `errors`: 404, 500, network waking-up alerts, validation errors.

### Using the Translation Hook:
```jsx
import { useLanguage } from '../context/LanguageContext.jsx';

export function ExampleComponent() {
  const { t, locale, toBanglaNum, formatMoney } = useLanguage();

  return (
    <div>
      <h2>{t('about.title')}</h2>
      <p>{t('common.total')}: {locale === 'bn' ? toBanglaNum(42) : 42}</p>
      <span>{formatMoney(50000)}</span>
    </div>
  );
}
```

---

## 4. Number & Currency Formatting

- **Digits**:
  - Bengali (`bn`): `০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯` via `toBanglaNum(value)`.
  - English (`en`): Latin digits (`0-9`) with standard thousands separators.
- **Currency**:
  - Bengali (`bn`): `৳ ৫০,০০০` via `formatMoney(50000)`.
  - English (`en`): `BDT 50,000` via `formatMoney(50000)`.
- **Land Units**:
  - Supports automatic conversion and localized unit representations (`শতাংশ / Decimal`, `কাঠা / Katha`, `বিঘা / Bigha`, `একর / Acre`, `বর্গফুট / Sq ft`).

---

## 5. Admin Bilingual Forms (`<BilingualInput />`)

All Admin edit and creation forms provide side-by-side inputs (stacked gracefully on mobile devices) using the shared component:
`client/src/admin/components/BilingualInput.jsx`

### Features:
1. **Completion Status Badges**:
   - `উভয় ভাষা সম্পূর্ণ` (Green) when both Bengali and English are entered.
   - `ইংরেজি বাকি` (Amber) when English is pending.
   - `বাংলা বাকি` (Amber) when Bengali is pending.
   - `উভয় ভাষা আবশ্যক` (Red) when both fields are required and missing.
2. **"Copy to English" Helper**:
   - One-click button copies Bengali text to the English input for fast transliteration.
3. **Multi-line Support**:
   - Accepts `isTextArea={true}` and `rows={...}` for biographies, descriptions, and histories.

### Form Usage Example:
```jsx
<BilingualInput
  label="সদস্যের নাম"
  required={true}
  valueBn={formData.nameBn}
  valueEn={formData.nameEn}
  onChangeBn={(val) => setFormData({ ...formData, nameBn: val })}
  onChangeEn={(val) => setFormData({ ...formData, nameEn: val })}
  placeholderBn="উদাঃ মাওলানা আব্দুর রহমান"
  placeholderEn="e.g. Maulana Abdur Rahman"
/>
```

---

## 6. Audit & QA Tools

### 1. Key Parity Check Script
Validates 100% key parity and absence of empty strings between `bn.json` and `en.json`:
```bash
npm run i18n:check
```

### 2. Automated Bilingual Character Suite
Runs Node test suite asserting zero Bengali character leakage into English resources:
```bash
node --test server/tests/bilingual.test.js
```

### 3. Admin Missing Translations Dashboard & Audit Page
- Route: `/:adminPath/missing-translations`
- Scans all database models (`Member`, `LandDonor`, `CommitteeMember`, `Notice`, `Album`, `Document`, `LandMap`, `Design`, `SiteSetting`) and lists records missing English or Bengali content with direct edit links.

