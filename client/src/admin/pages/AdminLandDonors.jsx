import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Landmark, Search, Plus, Edit, Trash2, Download, Upload, 
  X, Check, AlertCircle, Calendar, FileText, ChevronLeft, ChevronRight,
  ShieldAlert, Eye, EyeOff, MapPin, Map, User, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

export function AdminLandDonors() {
  const { toBanglaNum, formatBDT } = useLanguage();

  const [donors, setDonors] = useState([]);
  const [totalLandInDecimal, setTotalLandInDecimal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [landUse, setLandUse] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Auxiliary data for dropdown selects
  const [landMaps, setLandMaps] = useState([]);
  const [availableDocuments, setAvailableDocuments] = useState([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'land' | 'deed' | 'boundaries_story' | 'privacy_admin'
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    nameBn: '',
    nameEn: '',
    fatherNameBn: '',
    fatherNameEn: '',
    motherNameBn: '',
    motherNameEn: '',
    villageBn: 'মানিকপুর',
    villageEn: 'Manikpur',
    isDeceased: true,
    areaValue: '',
    areaUnit: 'DECIMAL_SHATANGSHO',
    donationYear: new Date().getFullYear(),
    donationDate: '',
    donationType: 'DANPATRA',
    deedNumber: '',
    deedDate: '',
    khatianType: 'SA',
    khatianNumber: '',
    dagNumber: '',
    mouzaBn: 'মানিকপুর',
    mouzaEn: 'Manikpur',
    jlNumber: '৪৫',
    upazilaBn: 'বাঞ্ছারামপুর',
    upazilaEn: 'Bancharampur',
    districtBn: 'ব্রাহ্মণবাড়িয়া',
    districtEn: 'Brahmanbaria',
    boundaryNorth: '',
    boundarySouth: '',
    boundaryEast: '',
    boundaryWest: '',
    landUse: 'EIDGAH_GROUND',
    landUseOther: '',
    storyBn: '',
    storyEn: '',
    relatedLandMapId: '',
    relatedDocumentIds: [],
    representativeName: '',
    representativeRelation: '',
    phone: '',
    nid: '',
    representativePhone: '',
    isPublished: true,
    sortOrder: 0,
    showDeedDetails: true,
    showPlotDetails: true,
    showBoundaries: true,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // CSV Import State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen || importModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen, importModalOpen]);

  useEffect(() => {
    fetchDonors();
  }, [search, landUse, year, page]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  const fetchAuxiliaryData = async () => {
    try {
      const [mapsRes, docsRes] = await Promise.all([
        fetch('/api/admin/land-maps'),
        fetch('/api/admin/documents'),
      ]);
      const mapsData = await mapsRes.json();
      const docsData = await docsRes.json();
      if (mapsData.success) setLandMaps(mapsData.maps || []);
      if (docsData.success) setAvailableDocuments(docsData.documents || []);
    } catch (err) {
      console.error('Error fetching auxiliary data:', err);
    }
  };

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (search) params.append('q', search);
      if (landUse) params.append('landUse', landUse);
      if (year) params.append('year', year);

      const res = await fetch(`/api/admin/land-donors?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDonors(data.donors || []);
        setTotalLandInDecimal(data.totalLandInDecimal || 0);
        setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditItem(null);
    setFormData({
      nameBn: '',
      nameEn: '',
      fatherNameBn: '',
      fatherNameEn: '',
      motherNameBn: '',
      motherNameEn: '',
      villageBn: 'মানিকপুর',
      villageEn: 'Manikpur',
      isDeceased: true,
      areaValue: '',
      areaUnit: 'DECIMAL_SHATANGSHO',
      donationYear: new Date().getFullYear(),
      donationDate: '',
      donationType: 'DANPATRA',
      deedNumber: '',
      deedDate: '',
      khatianType: 'SA',
      khatianNumber: '',
      dagNumber: '',
      mouzaBn: 'মানিকপুর',
      mouzaEn: 'Manikpur',
      jlNumber: '৪৫',
      upazilaBn: 'বাঞ্ছারামপুর',
      upazilaEn: 'Bancharampur',
      districtBn: 'ব্রাহ্মণবাড়িয়া',
      districtEn: 'Brahmanbaria',
      boundaryNorth: '',
      boundarySouth: '',
      boundaryEast: '',
      boundaryWest: '',
      landUse: 'EIDGAH_GROUND',
      landUseOther: '',
      storyBn: '',
      storyEn: '',
      relatedLandMapId: '',
      relatedDocumentIds: [],
      representativeName: '',
      representativeRelation: '',
      phone: '',
      nid: '',
      representativePhone: '',
      isPublished: true,
      sortOrder: donors.length + 1,
      showDeedDetails: true,
      showPlotDetails: true,
      showBoundaries: true,
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrorMsg('');
    setActiveTab('identity');
    setModalOpen(true);
  };

  const openEditModal = (donor) => {
    setEditItem(donor);
    setFormData({
      nameBn: donor.nameBn || '',
      nameEn: donor.nameEn || '',
      fatherNameBn: donor.fatherNameBn || '',
      fatherNameEn: donor.fatherNameEn || '',
      motherNameBn: donor.motherNameBn || '',
      motherNameEn: donor.motherNameEn || '',
      villageBn: donor.villageBn || 'মানিকপুর',
      villageEn: donor.villageEn || 'Manikpur',
      isDeceased: donor.isDeceased ?? true,
      areaValue: donor.areaValue || '',
      areaUnit: donor.areaUnit || 'DECIMAL_SHATANGSHO',
      donationYear: donor.donationYear || new Date().getFullYear(),
      donationDate: donor.donationDate ? donor.donationDate.split('T')[0] : '',
      donationType: donor.donationType || 'DANPATRA',
      deedNumber: donor.deedNumber || '',
      deedDate: donor.deedDate ? donor.deedDate.split('T')[0] : '',
      khatianType: donor.khatianType || 'SA',
      khatianNumber: donor.khatianNumber || '',
      dagNumber: donor.dagNumber || '',
      mouzaBn: donor.mouzaBn || 'মানিকপুর',
      mouzaEn: donor.mouzaEn || 'Manikpur',
      jlNumber: donor.jlNumber || '৪৫',
      upazilaBn: donor.upazilaBn || 'বাঞ্ছারামপুর',
      upazilaEn: donor.upazilaEn || 'Bancharampur',
      districtBn: donor.districtBn || 'ব্রাহ্মণবাড়িয়া',
      districtEn: donor.districtEn || 'Brahmanbaria',
      boundaryNorth: donor.boundaryNorth || '',
      boundarySouth: donor.boundarySouth || '',
      boundaryEast: donor.boundaryEast || '',
      boundaryWest: donor.boundaryWest || '',
      landUse: donor.landUse || 'EIDGAH_GROUND',
      landUseOther: donor.landUseOther || '',
      storyBn: donor.storyBn || '',
      storyEn: donor.storyEn || '',
      relatedLandMapId: donor.relatedLandMapId ? String(donor.relatedLandMapId) : '',
      relatedDocumentIds: Array.isArray(donor.relatedDocumentIds) ? donor.relatedDocumentIds : [],
      representativeName: donor.representativeName || '',
      representativeRelation: donor.representativeRelation || '',
      phone: donor.phone || '',
      nid: donor.nid || '',
      representativePhone: donor.representativePhone || '',
      isPublished: donor.isPublished ?? true,
      sortOrder: donor.sortOrder ?? 0,
      showDeedDetails: donor.showDeedDetails ?? true,
      showPlotDetails: donor.showPlotDetails ?? true,
      showBoundaries: donor.showBoundaries ?? true,
    });
    setPhotoFile(null);
    setPhotoPreview(donor.photoPath ? getImageUrl(donor.photoPath) : null);
    setErrorMsg('');
    setActiveTab('identity');
    setModalOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (editItem) {
      setFormData(prev => ({ ...prev, photoPath: '' }));
    }
  };

  const handleDocumentToggle = (docId) => {
    const numId = Number(docId);
    setFormData(prev => {
      const current = prev.relatedDocumentIds || [];
      const exists = current.includes(numId);
      return {
        ...prev,
        relatedDocumentIds: exists 
          ? current.filter(id => id !== numId)
          : [...current, numId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nameBn.trim()) {
      setErrorMsg('দাতার বাংলা নাম আবশ্যক।');
      setActiveTab('identity');
      return;
    }
    if (!formData.nameEn.trim()) {
      setErrorMsg('দাতার ইংরেজি নাম আবশ্যক (English name is required)।');
      setActiveTab('identity');
      return;
    }
    if (!formData.areaValue || parseFloat(formData.areaValue) <= 0) {
      setErrorMsg('জমির পরিমাণ শূন্যের বেশি হতে হবে।');
      setActiveTab('land');
      return;
    }
    if (!formData.donationYear) {
      setErrorMsg('দানের সাল আবশ্যক।');
      setActiveTab('deed');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const bodyData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'relatedDocumentIds') {
          bodyData.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== undefined) {
          bodyData.append(key, formData[key]);
        }
      });

      if (photoFile) {
        bodyData.append('photo', photoFile);
      }

      const url = editItem 
        ? `/api/admin/land-donors/${editItem.id}` 
        : '/api/admin/land-donors';
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: bodyData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'সংরক্ষণে ব্যর্থ হয়েছে।');
      }

      setModalOpen(false);
      fetchDonors();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে জমিদাতা "${name}" এর তথ্য ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/land-donors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDonors();
      } else {
        alert(data.error || 'মুছে ফেলা যায়নি।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভারের সাথে সংযোগে ত্রুটি হয়েছে।');
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/admin/land-donors/export';
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/admin/land-donors/template';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportLoading(true);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch('/api/admin/land-donors/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ donors: results.data }),
          });
          const data = await res.json();
          setImportResult(data);
          if (data.success) {
            fetchDonors();
          }
        } catch (err) {
          setImportResult({ success: false, error: 'সার্ভারে ফাইল পাঠাতে সমস্যা হয়েছে।' });
        } finally {
          setImportLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        setImportResult({ success: false, error: `CSV পার্সিং ত্রুটি: ${err.message}` });
        setImportLoading(false);
      }
    });
  };

  // Land Unit Labels
  const unitLabels = {
    DECIMAL_SHATANGSHO: 'শতাংশ',
    KATHA: 'কাঠা',
    BIGHA: 'বিঘা',
    ACRE: 'একর',
    SQFT: 'বর্গফুট',
  };

  const donationTypeLabels = {
    DANPATRA: 'দানপত্র',
    WAQF: 'ওয়াকফনামা',
    HEBA: 'হেবা দলিল',
    REGISTERED_DEED: 'রেজিস্ট্রিকৃত সাব-কবলা',
    OTHER: 'অন্যান্য',
  };

  const landUseLabels = {
    EIDGAH_GROUND: 'ঈদগাহ মাঠ',
    GRAVEYARD: 'কবরস্থান',
    MOSQUE: 'মসজিদ',
    ROAD: 'রাস্তা / প্রবেশপথ',
    BOUNDARY_WALL: 'সীমানা প্রাচীর',
    OTHER: 'অন্যান্য',
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-sand shadow-sakinah-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary-dark flex items-center justify-center border border-primary/25 shadow-inner">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-ink">জমিদাতা পরিষদ ব্যবস্থাপনা</h1>
            <p className="text-xs text-ink-muted">মানিকপুর ঈদগাহের ওয়াকফ ও দানকৃত ভূমির ইতিহাস ও রেকর্ড</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition-all shadow-sakinah-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন জমিদাতা</span>
          </button>
          
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-canvas hover:bg-canvas-alt text-ink font-medium text-xs transition-colors border border-sand"
            title="CSV ফাইল ডাউনলোড"
          >
            <Download className="w-4 h-4 text-ink-muted" />
            <span>এক্সপোর্ট</span>
          </button>

          <button
            onClick={() => { setImportResult(null); setImportModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-canvas hover:bg-canvas-alt text-ink font-medium text-xs transition-colors border border-sand"
            title="CSV ফাইল ইম্পোর্ট"
          >
            <Upload className="w-4 h-4 text-ink-muted" />
            <span>ইম্পোর্ট</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-sand shadow-sakinah-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning-soft text-warning flex items-center justify-center border border-gold/30">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-ink-muted">মোট নিবন্ধিত জমিদাতা</span>
            <p className="text-2xl font-bold font-serif text-ink">
              {toBanglaNum(pagination.total || 0)} <span className="text-xs font-normal text-ink-muted">জন</span>
            </p>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-sand shadow-sakinah-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary-dark flex items-center justify-center border border-primary/25">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-ink-muted">মোট দানকৃত ভূমি (শতাংশে)</span>
            <p className="text-2xl font-bold font-serif text-primary-dark">
              {toBanglaNum(Number(totalLandInDecimal).toFixed(2))} <span className="text-xs font-normal text-ink-muted">শতাংশ</span>
            </p>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-sand shadow-sakinah-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-mist text-primary-dark flex items-center justify-center border border-primary/20">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-ink-muted">মোট ভূমি (একর হিসেবে)</span>
            <p className="text-2xl font-bold font-serif text-ink">
              {toBanglaNum((Number(totalLandInDecimal) / 100).toFixed(2))} <span className="text-xs font-normal text-ink-muted">একর</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-sand shadow-sakinah-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="নাম, দলিল নম্বর, গ্রাম বা মৌজা দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={landUse}
            onChange={(e) => { setLandUse(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-canvas border border-sand rounded-xl text-xs font-medium text-ink focus:outline-none focus:border-primary focus:bg-surface"
          >
            <option value="">সকল ব্যবহার</option>
            <option value="EIDGAH_GROUND">ঈদগাহ মাঠ</option>
            <option value="GRAVEYARD">কবরস্থান</option>
            <option value="MOSQUE">মসজিদ</option>
            <option value="ROAD">রাস্তা</option>
            <option value="BOUNDARY_WALL">সীমানা প্রাচীর</option>
            <option value="OTHER">অন্যান্য</option>
          </select>

          <input
            type="number"
            value={year}
            onChange={(e) => { setYear(e.target.value); setPage(1); }}
            placeholder="সাল (উদা: ১৯৬২)"
            className="w-28 px-3 py-2 bg-canvas border border-sand rounded-xl text-xs font-medium text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
          />

          {(search || landUse || year) && (
            <button
              onClick={() => { setSearch(''); setLandUse(''); setYear(''); setPage(1); }}
              className="px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-soft rounded-xl transition-colors"
            >
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* Donors List Table */}
      <div className="bg-surface rounded-2xl border border-sand shadow-sakinah-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-ink-muted font-medium text-sm">
            ডাটা লোড হচ্ছে...
          </div>
        ) : donors.length === 0 ? (
          <div className="p-12 text-center text-ink-muted space-y-3">
            <Landmark className="w-12 h-12 text-ink-muted/50 mx-auto" />
            <p className="text-sm font-semibold text-ink">কোন জমিদাতা পাওয়া যায়নি</p>
            <p className="text-xs text-ink-muted">নতুন জমিদাতা যোগ করুন অথবা ফিল্টার পরিবর্তন করুন</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink border-collapse">
              <thead className="bg-canvas-alt border-b border-sand text-ink-muted font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">জমিদাতা</th>
                  <th className="py-3 px-4">জমির পরিমাণ</th>
                  <th className="py-3 px-4">দান ও দলিল</th>
                  <th className="py-3 px-4">ব্যবহার</th>
                  <th className="py-3 px-4">খতিয়ান ও দাগ</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {donors.map((d) => (
                  <tr key={d.id} className="hover:bg-canvas-alt/60 transition-colors">
                    {/* Donor Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {d.photoPath ? (
                          <img
                            src={getImageUrl(d.photoPath)}
                            alt={d.nameBn}
                            className="w-10 h-10 rounded-xl object-cover border border-sand shadow-xs flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {d.nameBn.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-ink flex items-center gap-1.5">
                            {d.isDeceased && (
                              <span className="text-[10px] bg-canvas text-ink-muted border border-sand px-1.5 py-0.5 rounded font-normal">
                                মরহুম
                              </span>
                            )}
                            <span>{d.nameBn}</span>
                          </div>
                          {d.fatherNameBn && (
                            <div className="text-[11px] text-ink-muted">
                              পিতা: {d.fatherNameBn}
                            </div>
                          )}
                          <div className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-ink-muted" />
                            <span>{d.villageBn || 'মানিকপুর'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Area */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-primary-dark text-sm">
                        {toBanglaNum(d.areaValue)} {unitLabels[d.areaUnit] || d.areaUnit}
                      </div>
                      <div className="text-[10px] text-ink-muted">
                        = {toBanglaNum(Number(d.areaInDecimal).toFixed(2))} শতাংশ
                      </div>
                    </td>

                    {/* Donation & Deed */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink">
                        {donationTypeLabels[d.donationType] || d.donationType} ({toBanglaNum(d.donationYear)})
                      </div>
                      {d.deedNumber ? (
                        <div className="text-[11px] text-ink-muted">
                          দলিল: {d.deedNumber}
                        </div>
                      ) : (
                        <span className="text-[10px] text-ink-muted italic">দলিল নম্বর নেই</span>
                      )}
                    </td>

                    {/* Usage */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-soft text-primary-dark border border-primary/25">
                        {landUseLabels[d.landUse] || d.landUse}
                      </span>
                    </td>

                    {/* Plot & Khatian */}
                    <td className="py-3 px-4 text-ink-muted">
                      <div>খতিয়ান: {d.khatianNumber ? `${d.khatianType || ''} ${d.khatianNumber}` : '—'}</div>
                      <div>দাগ: {d.dagNumber || '—'}</div>
                    </td>

                    {/* Status & Privacy Badges */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          d.isPublished 
                            ? 'bg-primary-soft text-primary-dark' 
                            : 'bg-canvas text-ink-muted border border-sand'
                        }`}>
                          {d.isPublished ? 'প্রকাশিত' : 'অপ্রকাশিত'}
                        </span>
                        {!d.showDeedDetails && (
                          <span className="text-[9px] text-warning bg-warning-soft px-1 rounded flex items-center gap-0.5" title="দলিল গোপন">
                            <ShieldAlert className="w-2.5 h-2.5" /> দলিল গোপন
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg bg-canvas hover:bg-primary-soft hover:text-primary-dark text-ink-muted transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.nameBn)}
                          className="p-1.5 rounded-lg bg-canvas hover:bg-danger-soft hover:text-danger text-ink-muted transition-colors"
                          title="ডাটাবেজ থেকে মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-canvas border-t border-sand flex items-center justify-between">
            <span className="text-xs text-ink-muted">
              পৃষ্ঠা {toBanglaNum(pagination.page)} এর {toBanglaNum(pagination.totalPages)} (মোট {toBanglaNum(pagination.total)} জন)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-sand text-ink-muted hover:bg-canvas-alt disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-sand text-ink-muted hover:bg-canvas-alt disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-scrim/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-4xl bg-surface rounded-3xl shadow-sakinah-lift border border-sand flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-canvas-alt text-primary-dark flex items-center justify-between border-b border-sand">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-sm border border-primary/20">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-serif text-ink">
                    {editItem ? 'জমিদাতা রেকর্ড সম্পাদনা' : 'নতুন জমিদাতা অন্তর্ভুক্তি'}
                  </h2>
                  <p className="text-[11px] text-ink-muted">
                    {editItem ? editItem.nameBn : 'ওয়াকফ ও জমি সংক্রান্ত তথ্য নির্ভুলভাবে পূরণ করুন'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-primary-soft text-ink-muted hover:text-primary-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tabs */}
            <div className="flex border-b border-sand bg-canvas overflow-x-auto px-4 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('identity')}
                className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'identity' 
                    ? 'border-primary text-primary-dark font-bold bg-surface' 
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                ১. মূল পরিচিতি
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('land')}
                className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'land' 
                    ? 'border-primary text-primary-dark font-bold bg-surface' 
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                ২. জমির পরিমাপ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('deed')}
                className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'deed' 
                    ? 'border-primary text-primary-dark font-bold bg-surface' 
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                ৩. দান ও দলিল
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('boundaries_story')}
                className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'boundaries_story' 
                    ? 'border-primary text-primary-dark font-bold bg-surface' 
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                ৪. সীমানা ও ইতিহাস
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('privacy_admin')}
                className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'privacy_admin' 
                    ? 'border-primary text-primary-dark font-bold bg-surface' 
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                ৫. ওয়ারিশ ও গোপনীয়তা
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* TAB 1: IDENTITY */}
              {activeTab === 'identity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        দাতার পুরো নাম (বাংলা) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nameBn}
                        onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                        placeholder="উদা: আলহাজ্ব মৌলভী আব্দুল জব্বার"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        দাতার পুরো নাম (ইংরেজি)
                      </label>
                      <input
                        type="text"
                        value={formData.nameEn}
                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                        placeholder="e.g. Alhaj Maulvi Abdul Jabbar"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        পিতা / স্বামীর নাম (বাংলা)
                      </label>
                      <input
                        type="text"
                        value={formData.fatherNameBn}
                        onChange={(e) => setFormData({ ...formData, fatherNameBn: e.target.value })}
                        placeholder="উদা: হাজী মোহাম্মদ বক্স"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        পিতা / স্বামীর নাম (ইংরেজি)
                      </label>
                      <input
                        type="text"
                        value={formData.fatherNameEn}
                        onChange={(e) => setFormData({ ...formData, fatherNameEn: e.target.value })}
                        placeholder="e.g. Haji Mohammad Baksh"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        মাতার নাম (বাংলা - ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={formData.motherNameBn}
                        onChange={(e) => setFormData({ ...formData, motherNameBn: e.target.value })}
                        placeholder="উদা: মরহুমা রাবেয়া খাতুন"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        গ্রাম / ঠিকানা (বাংলা)
                      </label>
                      <input
                        type="text"
                        value={formData.villageBn}
                        onChange={(e) => setFormData({ ...formData, villageBn: e.target.value })}
                        placeholder="উদা: মানিকপুর"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                  </div>

                  {/* Is Deceased & Photo */}
                  <div className="p-4 bg-canvas rounded-2xl border border-sand flex flex-col sm:flex-row items-center justify-between gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDeceased}
                        onChange={(e) => setFormData({ ...formData, isDeceased: e.target.checked })}
                        className="w-4 h-4 accent-primary rounded border-sand"
                      />
                      <div>
                        <span className="text-xs font-bold text-ink block">দাতার বর্তমান অবস্থা: মরহুম / মৃত</span>
                        <span className="text-[11px] text-ink-muted">অন থাকলে নামের পূর্বে স্বয়ংক্রিয়ভাবে "মরহুম/মরহুমা" প্রদর্শিত হবে</span>
                      </div>
                    </label>

                    {/* Photo upload */}
                    <div className="flex items-center gap-3">
                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-14 h-14 rounded-xl object-cover border border-sand shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center text-xs shadow-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-canvas-alt text-ink-muted border border-sand flex items-center justify-center text-xs">
                          ছবি নেই
                        </div>
                      )}
                      <div>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-sand rounded-xl text-xs font-semibold text-ink hover:bg-canvas-alt shadow-xs">
                          <Upload className="w-3.5 h-3.5 text-ink-muted" />
                          <span>ছবি নির্বাচন</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                        <span className="block text-[10px] text-ink-muted mt-1">সর্বোচ্চ ৫ মেগাবাইট</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LAND & AREA */}
              {activeTab === 'land' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        জমির পরিমাণ <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.areaValue}
                        onChange={(e) => setFormData({ ...formData, areaValue: e.target.value })}
                        placeholder="উদা: ৪০ বা ১.২৫"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        পরিমাপের একক <span className="text-danger">*</span>
                      </label>
                      <select
                        value={formData.areaUnit}
                        onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      >
                        <option value="DECIMAL_SHATANGSHO">শতাংশ / শতক / ডেসিমাল</option>
                        <option value="KATHA">কাঠা (১ কাঠা = ১.৬৫ শতাংশ)</option>
                        <option value="BIGHA">বিঘা (১ বিঘা = ৩৩ শতাংশ)</option>
                        <option value="ACRE">একর (১ একর = ১০০ শতাংশ)</option>
                        <option value="SQFT">বর্গফুট / স্কয়ার ফিট (৪৩৫.৬ বর্গফুট = ১ শতাংশ)</option>
                      </select>
                    </div>
                  </div>

                  {/* Calculated Area Preview Box */}
                  <div className="p-4 bg-primary-soft/60 rounded-2xl border border-primary/25 text-ink flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold block text-primary-dark">মানসম্মত রূপান্তর (শতাংশ হিসেবে মোট)</span>
                      <span className="text-[11px] text-primary">ওয়েবসাইটের মোট হিসাব ও গ্রাফে এই শতাংশ ব্যবহার করা হবে</span>
                    </div>
                    <div className="text-xl font-bold font-serif text-primary-dark">
                      {formData.areaValue ? (
                        <>
                          {formData.areaUnit === 'DECIMAL_SHATANGSHO' && `${toBanglaNum(formData.areaValue)} শতাংশ`}
                          {formData.areaUnit === 'KATHA' && `~${toBanglaNum((parseFloat(formData.areaValue) * 1.65).toFixed(2))} শতাংশ`}
                          {formData.areaUnit === 'BIGHA' && `~${toBanglaNum((parseFloat(formData.areaValue) * 33).toFixed(2))} শতাংশ`}
                          {formData.areaUnit === 'ACRE' && `~${toBanglaNum((parseFloat(formData.areaValue) * 100).toFixed(2))} শতাংশ`}
                          {formData.areaUnit === 'SQFT' && `~${toBanglaNum((parseFloat(formData.areaValue) / 435.6).toFixed(2))} শতাংশ`}
                        </>
                      ) : '০ শতাংশ'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        জমির ব্যবহারের ক্ষেত্র
                      </label>
                      <select
                        value={formData.landUse}
                        onChange={(e) => setFormData({ ...formData, landUse: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      >
                        <option value="EIDGAH_GROUND">ঈদগাহ মাঠ (মূল চত্বর)</option>
                        <option value="GRAVEYARD">কবরস্থান</option>
                        <option value="MOSQUE">মসজিদ ও অযুস্থান</option>
                        <option value="ROAD">রাস্তা / প্রবেশপথ</option>
                        <option value="BOUNDARY_WALL">সীমানা প্রাচীর</option>
                        <option value="OTHER">অন্যান্য</option>
                      </select>
                    </div>

                    {formData.landUse === 'OTHER' && (
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">
                          অন্যান্য ব্যবহারের বিবরণ
                        </label>
                        <input
                          type="text"
                          value={formData.landUseOther}
                          onChange={(e) => setFormData({ ...formData, landUseOther: e.target.value })}
                          placeholder="উদা: ড্রেন বা পানির পাম্পের জায়গা"
                          className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DEED & SURVEY */}
              {activeTab === 'deed' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        দানের সাল (ইংরেজি/ইংরেজি সংখ্যা) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.donationYear}
                        onChange={(e) => setFormData({ ...formData, donationYear: e.target.value })}
                        placeholder="উদা: 1965"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        দানের তারিখ (যদি জানা থাকে)
                      </label>
                      <input
                        type="date"
                        value={formData.donationDate}
                        onChange={(e) => setFormData({ ...formData, donationDate: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        দানের ধরন
                      </label>
                      <select
                        value={formData.donationType}
                        onChange={(e) => setFormData({ ...formData, donationType: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      >
                        <option value="DANPATRA">দানপত্র</option>
                        <option value="WAQF">ওয়াকফনামা</option>
                        <option value="HEBA">হেবা দলিল</option>
                        <option value="REGISTERED_DEED">রেজিস্ট্রিকৃত সাব-কবলা</option>
                        <option value="OTHER">অন্যান্য</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        দলিল নম্বর
                      </label>
                      <input
                        type="text"
                        value={formData.deedNumber}
                        onChange={(e) => setFormData({ ...formData, deedNumber: e.target.value })}
                        placeholder="উদা: ২৮৪১/১৯৬৫"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        দলিল রেজিস্ট্রির তারিখ
                      </label>
                      <input
                        type="date"
                        value={formData.deedDate}
                        onChange={(e) => setFormData({ ...formData, deedDate: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                  </div>

                  {/* Khatian & Dag */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        খতিয়ানের ধরন
                      </label>
                      <select
                        value={formData.khatianType}
                        onChange={(e) => setFormData({ ...formData, khatianType: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      >
                        <option value="CS">সিএস (CS)</option>
                        <option value="SA">এসএ (SA)</option>
                        <option value="RS">আরএস (RS)</option>
                        <option value="BS">বিএস / সিটি (BS)</option>
                        <option value="OTHER">অন্যান্য</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        খতিয়ান নম্বর
                      </label>
                      <input
                        type="text"
                        value={formData.khatianNumber}
                        onChange={(e) => setFormData({ ...formData, khatianNumber: e.target.value })}
                        placeholder="উদা: ১১২"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        দাগ নম্বর
                      </label>
                      <input
                        type="text"
                        value={formData.dagNumber}
                        onChange={(e) => setFormData({ ...formData, dagNumber: e.target.value })}
                        placeholder="উদা: ৩২৪"
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                  </div>

                  {/* Mouza & Location */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">মৌজা</label>
                      <input
                        type="text"
                        value={formData.mouzaBn}
                        onChange={(e) => setFormData({ ...formData, mouzaBn: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">জে.এল. নং</label>
                      <input
                        type="text"
                        value={formData.jlNumber}
                        onChange={(e) => setFormData({ ...formData, jlNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">উপজেলা</label>
                      <input
                        type="text"
                        value={formData.upazilaBn}
                        onChange={(e) => setFormData({ ...formData, upazilaBn: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">জেলা</label>
                      <input
                        type="text"
                        value={formData.districtBn}
                        onChange={(e) => setFormData({ ...formData, districtBn: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BOUNDARIES & STORY */}
              {activeTab === 'boundaries_story' && (
                <div className="space-y-4">
                  <div className="p-4 bg-canvas rounded-2xl border border-sand space-y-3">
                    <h3 className="text-xs font-bold text-ink">চৌহদ্দি / সীমানা বিবরণ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-ink-muted mb-1">উত্তর সীমানা</label>
                        <input
                          type="text"
                          value={formData.boundaryNorth}
                          onChange={(e) => setFormData({ ...formData, boundaryNorth: e.target.value })}
                          placeholder="উদা: সরকারী গোপাট"
                          className="w-full px-3 py-2 bg-surface border border-sand rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-ink-muted mb-1">দক্ষিণ সীমানা</label>
                        <input
                          type="text"
                          value={formData.boundarySouth}
                          onChange={(e) => setFormData({ ...formData, boundarySouth: e.target.value })}
                          placeholder="উদা: মৌলভী বাড়ির সীমানা"
                          className="w-full px-3 py-2 bg-surface border border-sand rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-ink-muted mb-1">পূর্ব সীমানা</label>
                        <input
                          type="text"
                          value={formData.boundaryEast}
                          onChange={(e) => setFormData({ ...formData, boundaryEast: e.target.value })}
                          placeholder="উদা: নূরুল ইসলাম সাহেবের জমি"
                          className="w-full px-3 py-2 bg-surface border border-sand rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-ink-muted mb-1">পশ্চিম সীমানা</label>
                        <input
                          type="text"
                          value={formData.boundaryWest}
                          onChange={(e) => setFormData({ ...formData, boundaryWest: e.target.value })}
                          placeholder="উদা: হাজী বাড়ির সীমানা"
                          className="w-full px-3 py-2 bg-surface border border-sand rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      দানের ইতিহাস ও স্মৃতিচারণ (বাংলা)
                    </label>
                    <textarea
                      rows={4}
                      value={formData.storyBn}
                      onChange={(e) => setFormData({ ...formData, storyBn: e.target.value })}
                      placeholder="জমি দান সম্পর্কিত বিশেষ কোনো ঘটনা, পটভূমি বা মরহুমের অবদান..."
                      className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary focus:bg-surface"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: PRIVACY, REPRESENTATIVE & ADMIN */}
              {activeTab === 'privacy_admin' && (
                <div className="space-y-4">
                  {/* Private Contact & Representative */}
                  <div className="p-4 bg-warning-soft/70 rounded-2xl border border-gold/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-warning" />
                      <h3 className="text-xs font-bold text-ink">
                        ওয়ারিশ / প্রতিনিধির তথ্য (সম্পূর্ণ গোপনীয় ও অভ্যন্তরীণ)
                      </h3>
                    </div>
                    <p className="text-[11px] text-warning">
                      নিচের যোগাযোগের তথ্যগুলো জনসম্মুখে প্রদর্শিত হবে না। শুধুমাত্র অ্যাডমিন যোগাযোগ ও যাচাইয়ের জন্য রক্ষিত থাকবে।
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">প্রতিনিধি / ওয়ারিশের নাম</label>
                        <input
                          type="text"
                          value={formData.representativeName}
                          onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                          placeholder="উদা: সৈয়দ হারুন"
                          className="w-full px-3 py-2 bg-surface border border-sand rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">সম্পর্ক</label>
                        <input
                          type="text"
                          value={formData.representativeRelation}
                          onChange={(e) => setFormData({ ...formData, representativeRelation: e.target.value })}
                          placeholder="উদা: সন্তান / নাতি / দৌহিত্র"
                          className="w-full px-3 py-2 bg-surface border border-sand rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">প্রতিনিধির ফোন নম্বর</label>
                        <input
                          type="text"
                          value={formData.representativePhone}
                          onChange={(e) => setFormData({ ...formData, representativePhone: e.target.value })}
                          placeholder="উদা: 01811000000"
                          className="w-full px-3 py-2 bg-surface border border-sand rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">দাতার NID বা মোবাইল (যদি থাকে)</label>
                        <input
                          type="text"
                          value={formData.nid}
                          onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                          placeholder="উদা: 1965123456789"
                          className="w-full px-3 py-2 bg-surface border border-sand rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Related Land Map & Documents */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        সংযুক্ত মৌজা নকশা (ম্যাপ)
                      </label>
                      <select
                        value={formData.relatedLandMapId}
                        onChange={(e) => setFormData({ ...formData, relatedLandMapId: e.target.value })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      >
                        <option value="">কোনো ম্যাপ সংযুক্ত নয়</option>
                        {landMaps.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.titleBn} ({m.surveyType || 'মৌজা'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        প্রদর্শনের ক্রম (Sort Order)
                      </label>
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 bg-canvas border border-sand rounded-xl text-sm text-ink focus:outline-none focus:border-primary focus:bg-surface"
                      />
                    </div>
                  </div>

                  {/* Available Documents Multiselect */}
                  {availableDocuments.length > 0 && (
                    <div className="p-4 bg-canvas rounded-2xl border border-sand space-y-2">
                      <span className="text-xs font-bold text-ink block">সংরক্ষণাগার থেকে সংশ্লিষ্ট দলিল নির্বাচন:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {availableDocuments.map(doc => (
                          <label key={doc.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-canvas-alt text-xs text-ink cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(formData.relatedDocumentIds || []).includes(doc.id)}
                              onChange={() => handleDocumentToggle(doc.id)}
                              className="w-3.5 h-3.5 accent-primary rounded border-sand"
                            />
                            <span className="truncate">{doc.titleBn} {doc.documentNo ? `(${doc.documentNo})` : ''}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Public Visibility Flags */}
                  <div className="p-4 bg-canvas rounded-2xl border border-sand space-y-3">
                    <span className="text-xs font-bold text-ink block">ওয়েবসাইটে দৃশ্যমানতা ও গোপনীয়তা নিয়ন্ত্রণ</span>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPublished}
                          onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                          className="w-4 h-4 accent-primary rounded border-sand"
                        />
                        <span className="font-semibold text-ink">ওয়েবসাইটে সর্বসাধারণের জন্য প্রকাশ করুন (Published)</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.showDeedDetails}
                          onChange={(e) => setFormData({ ...formData, showDeedDetails: e.target.checked })}
                          className="w-4 h-4 accent-primary rounded border-sand"
                        />
                        <span className="text-ink-muted">দলিল নম্বর ও রেজিস্ট্রির তারিখ জনসম্মুখে দেখান</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.showPlotDetails}
                          onChange={(e) => setFormData({ ...formData, showPlotDetails: e.target.checked })}
                          className="w-4 h-4 accent-primary rounded border-sand"
                        />
                        <span className="text-ink-muted">খতিয়ান ও দাগ নম্বর জনসম্মুখে দেখান</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.showBoundaries}
                          onChange={(e) => setFormData({ ...formData, showBoundaries: e.target.checked })}
                          className="w-4 h-4 accent-primary rounded border-sand"
                        />
                        <span className="text-ink-muted">চৌহদ্দি বা চারপাশের সীমানা জনসম্মুখে দেখান</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-sand flex items-center justify-between">
                <div className="text-xs text-ink-muted">
                  {activeTab !== 'privacy_admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['identity', 'land', 'deed', 'boundaries_story', 'privacy_admin'];
                        const nextIdx = tabs.indexOf(activeTab) + 1;
                        if (nextIdx < tabs.length) setActiveTab(tabs[nextIdx]);
                      }}
                      className="text-primary-dark font-semibold hover:underline"
                    >
                      পরবর্তী ধাপ →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-ink-muted hover:bg-canvas-alt font-semibold text-xs transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition-colors shadow-sakinah-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving ? 'সংরক্ষণ হচ্ছে...' : editItem ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-scrim/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-surface rounded-3xl shadow-sakinah-lift border border-sand p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-sand">
              <div className="flex items-center gap-2 text-ink font-bold font-serif text-base">
                <Upload className="w-5 h-5 text-primary-dark" />
                <span>CSV ফাইলের মাধ্যমে জমিদাতা ইম্পোর্ট</span>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink-muted">
              একসাথে একাধিক জমিদাতার তথ্য যুক্ত করার জন্য প্রস্তুতকৃত CSV ফাইল নির্বাচন করুন। ফরম্যাট নিশ্চিত করতে প্রথমে নমুনা টেমপ্লেট ডাউনলোড করে নিন।
            </p>

            <div className="p-4 bg-primary-soft/60 rounded-2xl border border-primary/25 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary-dark block">নমুনা CSV টেমপ্লেট</span>
                <span className="text-[11px] text-primary">সকল কলামের হেডার ও উদাহরণসহ</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-primary/30 text-primary-dark text-xs font-semibold hover:bg-primary-soft shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ডাউনলোড</span>
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-ink">CSV ফাইল আপলোড করুন:</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={importLoading}
                className="block w-full text-xs text-ink-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover file:cursor-pointer cursor-pointer border border-sand rounded-2xl bg-canvas"
              />
            </div>

            {importLoading && (
              <div className="p-4 text-center text-xs text-ink-muted">
                ফাইল প্রসেস ও ডাটাবেজে সংরক্ষণ করা হচ্ছে...
              </div>
            )}

            {importResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                importResult.success 
                  ? 'bg-success-soft border-success/30 text-success' 
                  : 'bg-danger-soft border-danger/30 text-danger'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {importResult.success ? <CheckCircle2 className="w-4 h-4 text-success" /> : <AlertTriangle className="w-4 h-4 text-danger" />}
                  <span>{importResult.success ? `সফলভাবে ${importResult.count} জন জমিদাতা যুক্ত হয়েছে!` : 'ইম্পোর্টে সমস্যা হয়েছে'}</span>
                </div>
                {importResult.error && <p>{importResult.error}</p>}
                {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1 text-[11px] text-danger bg-surface/80 p-2 rounded-xl">
                    <span className="font-bold block">ত্রুটিযুক্ত সারি:</span>
                    {importResult.errors.map((err, idx) => (
                      <div key={idx}>সারি {err.row}: {err.error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-ink-muted hover:bg-canvas-alt font-semibold text-xs"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

