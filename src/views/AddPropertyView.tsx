import React, { useState, useEffect, useMemo } from 'react';
import { Property, PropertyImage, PropertyTikTokLink, PlotType, PropertyStatus, PropertyListingType, User } from '../types';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Upload, 
  Trash2, 
  Video, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  AlertTriangle,
  Eye,
  Camera,
  Layers,
  FileText,
  Sparkles,
  Calculator,
  Key
} from 'lucide-react';
import { formatPKR } from '../utils/formatters';

interface AddPropertyViewProps {
  user: User;
  editingProperty?: Property | null;
  existingProperties?: Property[];
  onSave: (property: Property) => Promise<void>;
  onCancel: () => void;
  onViewExisting?: (property: Property) => void;
  isOnline: boolean;
}

const COMMON_SOCIETIES = [
  'Al Rehman Garden',
  'Bahria Town',
  'DHA',
  'Lake City',
  'Park View City',
  'New Lahore City',
  'Central Park',
  'Fazaia Housing Scheme',
  'WAPDA Town',
  'Johar Town',
  'Gulberg',
  'Model Town',
  'State Life',
];

const COMMON_SIZES = [
  '3 Marla',
  '5 Marla',
  '7 Marla',
  '10 Marla',
  '1 Kanal',
  '2 Kanal',
  '4 Marla Commercial',
  '8 Marla Commercial',
];

const PLOT_TYPES: PlotType[] = [
  'Residential',
  'Commercial',
  'Semi-Commercial',
  'Industrial',
  'Agricultural',
  'Farmhouse',
];

const normalizeField = (val?: string | null): string => {
  if (!val) return '';
  return val
    .toLowerCase()
    .trim()
    .replace(/^plot\s*#?\s*/i, '')
    .replace(/^#\s*/, '')
    .replace(/\s+/g, ' ');
};

const findDuplicateProperty = (
  soc: string,
  plot: string,
  blk: string,
  phs: string,
  twn: string,
  list: Property[],
  currentPropertyId?: string | null
): Property | undefined => {
  const normSoc = normalizeField(soc);
  const normPlot = normalizeField(plot);
  const normBlk = normalizeField(blk);
  const normPhs = normalizeField(phs);
  const normTwn = normalizeField(twn);

  if (!normSoc || !normPlot) return undefined;

  return list.find((p) => {
    if (currentPropertyId && p.property_id === currentPropertyId) {
      return false;
    }

    const pSoc = normalizeField(p.society);
    const pPlot = normalizeField(p.plot_number);
    const pBlk = normalizeField(p.block);
    const pPhs = normalizeField(p.phase);
    const pTwn = normalizeField(p.town);

    if (pSoc !== normSoc) return false;
    if (pPlot !== normPlot) return false;
    if (normBlk && pBlk && normBlk !== pBlk) return false;
    if (normPhs && pPhs && normPhs !== pPhs) return false;
    if (normTwn && pTwn && normTwn !== pTwn) return false;

    return true;
  });
};

// Helper: extract numeric marla from size string
const parseMarlaFromSize = (sizeStr: string): number => {
  const lower = sizeStr.toLowerCase().trim();
  if (lower.includes('kanal')) {
    const kanalMatch = lower.match(/([\d.]+)\s*kanal/);
    if (kanalMatch) return parseFloat(kanalMatch[1]) * 20;
    return 20;
  }
  const marlaMatch = lower.match(/([\d.]+)\s*marla/);
  if (marlaMatch) return parseFloat(marlaMatch[1]);
  const numOnly = parseFloat(sizeStr);
  return isNaN(numOnly) ? 5 : numOnly;
};

export const AddPropertyView: React.FC<AddPropertyViewProps> = ({
  user,
  editingProperty,
  existingProperties = [],
  onSave,
  onCancel,
  onViewExisting,
  isOnline,
}) => {
  // Purpose: Sale vs Rent
  const [listingType, setListingType] = useState<PropertyListingType>(editingProperty?.listing_type || 'Sale');
  const [rentDuration, setRentDuration] = useState<'Monthly' | 'Yearly'>(editingProperty?.rent_duration || 'Monthly');

  // Location & Identity
  const [society, setSociety] = useState(editingProperty?.society || '');
  const [town, setTown] = useState(editingProperty?.town || 'Lahore');
  const [phase, setPhase] = useState(editingProperty?.phase || '');
  const [block, setBlock] = useState(editingProperty?.block || '');
  const [plotNumber, setPlotNumber] = useState(editingProperty?.plot_number || '');
  const [plotSize, setPlotSize] = useState(editingProperty?.plot_size || '5 Marla');
  const [plotType, setPlotType] = useState<PlotType>(editingProperty?.plot_type || 'Residential');

  // Pricing Mode: 'total' or 'per_marla'
  const [pricingMode, setPricingMode] = useState<'total' | 'per_marla'>(editingProperty?.pricing_mode || 'total');
  const [marlaCount, setMarlaCount] = useState<string>(
    editingProperty?.marla_count ? String(editingProperty.marla_count) : String(parseMarlaFromSize(editingProperty?.plot_size || '5 Marla'))
  );
  const [pricePerMarla, setPricePerMarla] = useState<string>(
    editingProperty?.price_per_marla ? String(editingProperty.price_per_marla) : ''
  );
  const [price, setPrice] = useState<string>(editingProperty?.price ? String(editingProperty.price) : '');
  const [status, setStatus] = useState<PropertyStatus>(editingProperty?.status || 'Available');
  const [notes, setNotes] = useState(editingProperty?.notes || '');
  
  // Images
  const [images, setImages] = useState<PropertyImage[]>(editingProperty?.images || []);
  
  // TikTok Link
  const initialTikTok = editingProperty?.tiktok_links && editingProperty.tiktok_links.length > 0 
    ? editingProperty.tiktok_links[0].tiktok_url 
    : '';
  const [tiktokUrl, setTiktokUrl] = useState(initialTikTok);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Update marla count automatically if plotSize changes
  const handleSelectPlotSize = (sz: string) => {
    setPlotSize(sz);
    const parsed = parseMarlaFromSize(sz);
    if (parsed > 0) {
      setMarlaCount(String(parsed));
      if (pricingMode === 'per_marla' && pricePerMarla) {
        const total = Math.round(parsed * Number(pricePerMarla));
        setPrice(String(total));
      }
    }
  };

  // When in per_marla mode, recalculate total price
  const handlePricePerMarlaChange = (rateStr: string) => {
    setPricePerMarla(rateStr);
    const m = parseFloat(marlaCount) || 0;
    const rate = parseFloat(rateStr) || 0;
    if (m > 0 && rate > 0) {
      const calculated = Math.round(m * rate);
      setPrice(String(calculated));
    }
  };

  // When in per_marla mode, recalculate if marla count changes
  const handleMarlaCountChange = (mStr: string) => {
    setMarlaCount(mStr);
    const m = parseFloat(mStr) || 0;
    const rate = parseFloat(pricePerMarla) || 0;
    if (m > 0 && rate > 0) {
      const calculated = Math.round(m * rate);
      setPrice(String(calculated));
    }
  };

  // If in total mode and price changes, derive per marla rate
  const handleTotalPriceChange = (totalStr: string) => {
    setPrice(totalStr);
    const m = parseFloat(marlaCount) || parseMarlaFromSize(plotSize) || 0;
    const total = parseFloat(totalStr) || 0;
    if (m > 0 && total > 0) {
      setPricePerMarla(String(Math.round(total / m)));
    }
  };

  // Live conversion for Price
  const numericPrice = Number(price) || 0;
  const pkrFormatted = formatPKR(numericPrice);

  // Real-time duplicate detection
  const duplicateMatch = useMemo(() => {
    return findDuplicateProperty(
      society,
      plotNumber,
      block,
      phase,
      town,
      existingProperties,
      editingProperty?.property_id
    );
  }, [society, plotNumber, block, phase, town, existingProperties, editingProperty]);

  // Handle Image Upload
  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: PropertyImage[] = [];
    const readPromises = Array.from(files).map((file) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            newImages.push({
              image_id: 'img_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
              property_id: editingProperty?.property_id || '',
              user_id: user.user_id,
              image_url: result,
              created_at: new Date().toISOString(),
              is_local_only: true,
            });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(() => {
      setImages((prev) => [...prev, ...newImages]);
    });
  };

  const handleRemoveImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.image_id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!society.trim() || !plotNumber.trim() || !price) {
      setErrorMsg('Please enter Society, Plot Number, and Price.');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Please enter a valid price in PKR.');
      return;
    }

    // Check if property is already added
    const duplicate = findDuplicateProperty(
      society,
      plotNumber,
      block,
      phase,
      town,
      existingProperties,
      editingProperty?.property_id
    );

    if (duplicate) {
      setErrorMsg(`This property is already added. Plot #${duplicate.plot_number} in ${duplicate.society}${duplicate.block ? ` (${duplicate.block})` : ''} already exists in your account.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const now = new Date().toISOString();
      const propId = editingProperty?.property_id || 'prop_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

      // Ensure images have property_id
      const finalizedImages = images.map((img) => ({
        ...img,
        property_id: propId,
        user_id: user.user_id,
      }));

      // TikTok links
      const tiktokLinks: PropertyTikTokLink[] = [];
      if (tiktokUrl.trim()) {
        tiktokLinks.push({
          tiktok_id: 'tt_' + Math.random().toString(36).substring(2, 9),
          property_id: propId,
          user_id: user.user_id,
          tiktok_url: tiktokUrl.trim(),
          created_at: now,
          updated_at: now,
        });
      }

      // History item
      const historyItem = {
        history_id: 'hist_' + Math.random().toString(36).substring(2, 9),
        action: (editingProperty ? 'Edited' : 'Created') as any,
        timestamp: now,
        note: editingProperty ? 'Property details updated' : 'Property created in system',
        user_id: user.user_id,
        username: user.username,
      };

      const propertyRecord: Property = {
        property_id: propId,
        user_id: user.user_id,
        listing_type: listingType,
        rent_duration: listingType === 'Rent' ? rentDuration : undefined,
        pricing_mode: pricingMode,
        marla_count: parseFloat(marlaCount) || parseMarlaFromSize(plotSize) || undefined,
        price_per_marla: parseFloat(pricePerMarla) || undefined,
        society: society.trim(),
        town: town.trim() || 'Lahore',
        phase: phase.trim(),
        block: block.trim(),
        plot_number: plotNumber.trim(),
        plot_size: plotSize,
        plot_type: plotType,
        price: numPrice,
        status: status,
        notes: notes.trim(),
        images: finalizedImages,
        tiktok_links: tiktokLinks,
        history: editingProperty?.history ? [historyItem, ...editingProperty.history] : [historyItem],
        created_at: editingProperty?.created_at || now,
        updated_at: now,
        sync_version: (editingProperty?.sync_version || 0) + 1,
        is_local_only: !isOnline,
      };

      await onSave(propertyRecord);
      setSuccessMsg(editingProperty ? 'Property updated successfully!' : 'Property added successfully!');
    } catch (err: any) {
      console.error('Error saving property', err);
      setErrorMsg(err.message || 'Failed to save property record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs theme-text-secondary hover:theme-text-main transition px-3 py-2 rounded-xl theme-bg-subtle border theme-border min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h1 className="text-base sm:text-lg font-bold theme-text-main font-brand truncate px-2">
          {editingProperty ? 'Edit Property Record' : 'Add Property / Housing'}
        </h1>

        <div className="w-12" />
      </div>

      {/* Prominent English Duplicate Alert Banner */}
      {(duplicateMatch || (errorMsg && errorMsg.includes('already added'))) && (
        <div className="mb-4 sm:mb-5 p-4 sm:p-5 rounded-2xl bg-amber-500/15 dark:bg-amber-950/40 border-2 border-amber-500 dark:border-amber-500/60 shadow-lg shadow-amber-500/10 transition-all">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100 uppercase tracking-wide">
                  This property is already added.
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-500/40">
                  Duplicate Record
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 mt-1.5 leading-relaxed font-medium">
                {duplicateMatch ? (
                  <>
                    A property with Plot <span className="font-bold underline">#{duplicateMatch.plot_number}</span> in <span className="font-bold">{duplicateMatch.society}</span>
                    {duplicateMatch.block ? ` (${duplicateMatch.block})` : ''}
                    {duplicateMatch.phase ? ` - ${duplicateMatch.phase}` : ''} already exists in your account records.
                  </>
                ) : (
                  errorMsg
                )}
              </p>

              {duplicateMatch && (
                <div className="mt-3 pt-3 border-t border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-amber-900/90 dark:text-amber-200/90 flex flex-wrap items-center gap-2 sm:gap-4">
                    <span><strong className="text-amber-950 dark:text-amber-100">Status:</strong> {duplicateMatch.status}</span>
                    <span>•</span>
                    <span><strong className="text-amber-950 dark:text-amber-100">Price:</strong> PKR {formatPKR(duplicateMatch.price).short}</span>
                    {duplicateMatch.town && (
                      <>
                        <span>•</span>
                        <span><strong className="text-amber-950 dark:text-amber-100">Town:</strong> {duplicateMatch.town}</span>
                      </>
                    )}
                  </div>
                  {onViewExisting && (
                    <button
                      type="button"
                      onClick={() => onViewExisting(duplicateMatch)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-600/25 active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Existing Property</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {errorMsg && !errorMsg.includes('already added') && (
        <div className="mb-4 sm:mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 sm:mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Section 1: Basic Information */}
        <div className="theme-bg-card border theme-border rounded-2xl p-4 sm:p-6 theme-shadow">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b theme-border">
            <Building2 className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
              Basic Housing Information
            </h2>
          </div>

          <div className="space-y-4">
            {/* Purpose: For Sale vs For Rent Toggle */}
            <div className="p-3.5 rounded-2xl theme-bg-subtle border theme-border">
              <label className="block text-xs font-bold theme-text-main mb-2 flex items-center justify-between">
                <span>Property Purpose (فروخت یا کرایہ)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
                  {listingType === 'Rent' ? 'FOR RENT' : 'FOR SALE'}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setListingType('Sale')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                    listingType === 'Sale'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                      : 'theme-bg-card theme-text-secondary theme-border hover:theme-text-main'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>For Sale (فروخت کے لیے)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setListingType('Rent')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                    listingType === 'Rent'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                      : 'theme-bg-card theme-text-secondary theme-border hover:theme-text-main'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>For Rent (کرایہ کے لیے)</span>
                </button>
              </div>

              {listingType === 'Rent' && (
                <div className="mt-3 pt-3 border-t theme-border flex items-center justify-between gap-3 animate-in fade-in">
                  <span className="text-xs theme-text-secondary font-medium">Rent Payment Cycle:</span>
                  <div className="flex items-center gap-1.5">
                    {(['Monthly', 'Yearly'] as const).map((cycle) => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setRentDuration(cycle)}
                        className={`text-xs px-3 py-1 rounded-lg font-semibold transition border ${
                          rentDuration === cycle
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/50'
                            : 'theme-bg-card theme-text-tertiary theme-border hover:theme-text-main'
                        }`}
                      >
                        {cycle}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Society with Quick Suggestions */}
            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
                Housing Society <span className="text-sky-600 dark:text-sky-400">*</span>
              </label>
              <input
                type="text"
                value={society}
                onChange={(e) => setSociety(e.target.value)}
                placeholder="e.g. Al Rehman Garden, Bahria Town, DHA..."
                required
                className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-sky-500 transition"
              />

              {/* Quick Society chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_SOCIETIES.slice(0, 6).map((soc) => (
                  <button
                    key={soc}
                    type="button"
                    onClick={() => setSociety(soc)}
                    className={`text-[10px] px-2 py-0.5 rounded-md transition ${
                      society === soc
                        ? 'bg-sky-600 text-white font-bold'
                        : 'theme-bg-subtle theme-text-secondary border theme-border hover:theme-text-main'
                    }`}
                  >
                    {soc}
                  </button>
                ))}
              </div>
            </div>

            {/* City / Town & Phase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
                  Town / City
                </label>
                <input
                  type="text"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  placeholder="e.g. Lahore"
                  className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
                  Phase
                </label>
                <input
                  type="text"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  placeholder="e.g. Phase 2, Phase 6, Sector C"
                  className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Block & Plot Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
                  Block
                </label>
                <input
                  type="text"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  placeholder="e.g. Block A, Executive Block"
                  className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold theme-text-secondary">
                    Plot Number <span className="text-amber-600 dark:text-amber-400">*</span>
                  </label>
                  {duplicateMatch && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Already Added</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={plotNumber}
                  onChange={(e) => setPlotNumber(e.target.value)}
                  placeholder="e.g. 125, 48-B, 1024"
                  required
                  className={`w-full px-3.5 py-2.5 theme-bg-subtle border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none transition ${
                    duplicateMatch
                      ? 'border-amber-500 focus:border-amber-600 ring-2 ring-amber-500/20'
                      : 'theme-border focus:border-amber-500'
                  }`}
                />
                {duplicateMatch && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold truncate">This property is already added.</span>
                    </div>
                    {onViewExisting && (
                      <button
                        type="button"
                        onClick={() => onViewExisting(duplicateMatch)}
                        className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline hover:text-amber-900 dark:hover:text-amber-100 shrink-0"
                      >
                        View Existing
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Plot Size & Plot Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
                  Plot Size
                </label>
                <input
                  type="text"
                  value={plotSize}
                  onChange={(e) => setPlotSize(e.target.value)}
                  placeholder="e.g. 5 Marla, 1 Kanal"
                  className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-sky-500 transition mb-2"
                />
                <div className="flex flex-wrap gap-1">
                  {COMMON_SIZES.slice(0, 5).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleSelectPlotSize(sz)}
                      className={`text-[9px] px-1.5 py-0.5 rounded transition ${
                        plotSize === sz
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'theme-bg-subtle theme-text-secondary border theme-border hover:theme-text-main'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
                  Plot Type
                </label>
                <select
                  value={plotType}
                  onChange={(e) => setPlotType(e.target.value as PlotType)}
                  className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main text-sm focus:outline-none focus:border-sky-500 transition"
                >
                  {PLOT_TYPES.map((t) => (
                    <option key={t} value={t} className="theme-bg-card theme-text-main">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Price / Rate & Status */}
        <div className="theme-bg-card border theme-border rounded-2xl p-5 sm:p-6 theme-shadow">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b theme-border">
            <DollarSign className="w-4 h-4 text-sky-700 dark:text-sky-400" />
            <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
              Rate & Current Status
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pricing Section with Total vs Per-Marla Rate Mode */}
            <div className="space-y-3">
              {/* Pricing Mode Toggle (only for Sale or plots) */}
              <div className="flex items-center justify-between pb-1">
                <label className="text-xs font-semibold theme-text-secondary">
                  {listingType === 'Rent' 
                    ? `Rent Amount (${rentDuration})` 
                    : 'Pricing Method (ریٹ کا طریقہ)'} <span className="text-amber-600 dark:text-amber-400">*</span>
                </label>

                {listingType === 'Sale' && (
                  <div className="flex items-center p-0.5 rounded-lg theme-bg-subtle border theme-border text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPricingMode('total')}
                      className={`px-2.5 py-1 rounded-md font-bold transition ${
                        pricingMode === 'total'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'theme-text-secondary hover:theme-text-main'
                      }`}
                    >
                      Total Price (مکمل رقم)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode('per_marla')}
                      className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                        pricingMode === 'per_marla'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'theme-text-secondary hover:theme-text-main'
                      }`}
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Per Marla (فی مرلہ)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Per Marla Calculation Inputs */}
              {pricingMode === 'per_marla' && listingType === 'Sale' ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        Total Marla (کل مرلے)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={marlaCount}
                        onChange={(e) => handleMarlaCountChange(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full px-3 py-2 rounded-lg theme-bg-card border theme-border text-xs theme-text-main focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        Rate Per Marla (فی مرلہ ریٹ)
                      </label>
                      <input
                        type="number"
                        step="1000"
                        min="1000"
                        value={pricePerMarla}
                        onChange={(e) => handlePricePerMarlaChange(e.target.value)}
                        placeholder="e.g. 1000000"
                        required
                        className="w-full px-3 py-2 rounded-lg theme-bg-card border theme-border text-xs theme-text-main focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {pricePerMarla && Number(pricePerMarla) > 0 && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 font-mono flex items-center justify-between pt-1 border-t border-amber-500/20">
                      <span>Per Marla: PKR {formatPKR(Number(pricePerMarla)).short}</span>
                      <span className="font-bold">Total: {marlaCount} Marla × {formatPKR(Number(pricePerMarla)).short}</span>
                    </div>
                  )}

                  {/* Calculated Total Display */}
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      Calculated Total Price (خودکار کل قیمت):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Calculated Total"
                      required
                      className="w-full px-3.5 py-2.5 theme-bg-card border-2 border-amber-500/60 rounded-xl theme-text-main text-sm font-bold font-mono focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                /* Standard Total Price Input */
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={price}
                      onChange={(e) => handleTotalPriceChange(e.target.value)}
                      placeholder={listingType === 'Rent' ? 'e.g. 45000 (Monthly Rent)' : 'e.g. 5000000 (Total Price)'}
                      required
                      className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 transition font-mono font-semibold"
                    />
                  </div>

                  {/* Optional Per Marla breakdown in total mode */}
                  {listingType === 'Sale' && numericPrice > 0 && (
                    <div className="mt-1 text-[11px] theme-text-tertiary flex items-center justify-between">
                      <span>Rate breakdown:</span>
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                        ~PKR {formatPKR(Math.round(numericPrice / (parseFloat(marlaCount) || parseMarlaFromSize(plotSize) || 5))).short} / Marla
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Friendly Pakistani denomination badge */}
              {numericPrice > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-amber-800 dark:text-amber-300 font-bold font-brand text-sm sm:text-base block">
                      {pkrFormatted.short}
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      {listingType === 'Rent' ? `Rent (${rentDuration})` : 'Total Price'}
                    </span>
                  </div>
                  <span className="theme-text-secondary font-mono text-[11px]">
                    {pkrFormatted.full}
                  </span>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
                Property Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Available', 'On Hold', 'Sold'] as PropertyStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition border ${
                      status === st
                        ? st === 'Available'
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : st === 'On Hold'
                          ? 'bg-amber-600 text-white border-amber-600 font-bold'
                          : 'bg-rose-600 text-white border-rose-600 font-bold'
                        : 'theme-bg-subtle theme-text-secondary theme-border hover:theme-text-main'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mt-4">
            <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
              Additional Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Near commercial area, 40ft road, corner plot, park facing, possession paid..."
              className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-sky-500 transition resize-none"
            />
          </div>
        </div>

        {/* Section 3: ADD PICTURE */}
        <div className="theme-bg-card border theme-border rounded-2xl p-5 sm:p-6 theme-shadow">
          <div className="flex items-center justify-between mb-4 pb-3 border-b theme-border">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
                ADD PICTURE ({images.length})
              </h2>
            </div>
            <span className="text-[11px] theme-text-tertiary">Offline & Online Photos</span>
          </div>

          {/* Photo Gallery Grid & Upload Trigger */}
          <div className="space-y-4">
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img.image_id || idx}
                    className="relative group rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-900 border theme-border h-28"
                  >
                    <img
                      src={img.image_url}
                      alt={`Plot upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.image_id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition shadow-xs"
                      title="Remove picture"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono text-white">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed theme-border hover:border-sky-500 rounded-xl cursor-pointer theme-bg-subtle hover:bg-black/5 dark:hover:bg-white/5 transition group">
              <div className="p-3 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 group-hover:bg-sky-600 group-hover:text-white transition">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold theme-text-main mt-2">
                Click or tap to Upload Pictures
              </span>
              <span className="text-[10px] theme-text-tertiary mt-0.5">
                PNG, JPG or WEBP (Saved locally in IndexedDB and synced to cloud)
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageFiles(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Section 4: ADD TIKTOK LINK */}
        <div className="theme-bg-card border theme-border rounded-2xl p-5 sm:p-6 theme-shadow">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b theme-border">
            <Video className="w-4 h-4 text-sky-700 dark:text-sky-400" />
            <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
              ADD PROPERTY VIDEO / TIKTOK LINK
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
              Video Tour / TikTok URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none theme-text-tertiary">
                <Video className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@propertyhub/video/..."
                className="w-full pl-10 pr-4 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-sm focus:outline-none focus:border-sky-500 transition"
              />
            </div>
            <p className="text-[11px] theme-text-tertiary mt-1.5">
              Paste the public link to your TikTok, YouTube, or Instagram property walk-through.
            </p>
          </div>
        </div>

        {/* If duplicate, warning note above submit */}
        {duplicateMatch && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">
                <strong>Notice:</strong> This property is already added. Please change the plot number or block to add a new record.
              </span>
            </div>
            {onViewExisting && (
              <button
                type="button"
                onClick={() => onViewExisting(duplicateMatch)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shrink-0"
              >
                View Existing
              </button>
            )}
          </div>
        )}

        {/* Submit Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl theme-bg-subtle hover:bg-black/5 dark:hover:bg-white/5 theme-text-main border theme-border font-semibold text-xs transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-2 py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm tracking-wide transition shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${
              duplicateMatch
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                : 'bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 shadow-sky-600/25'
            }`}
          >
            {isSubmitting ? (
              <span>Saving Property...</span>
            ) : duplicateMatch ? (
              <>
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                <span>This Property is Already Added</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{editingProperty ? 'Save Changes' : 'Save Property Record'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
