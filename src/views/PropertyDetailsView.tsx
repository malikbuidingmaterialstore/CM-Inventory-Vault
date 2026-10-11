import React, { useState, useRef, useEffect } from 'react';
import { Property, PropertyImage, PropertyStatus, User, SponsorAd } from '../types';
import { SponsorAdBanner } from '../components/SponsorAdBanner';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  Video, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Camera, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Tag,
  MoreVertical,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  History,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils/formatters';

interface PropertyDetailsViewProps {
  user: User;
  property: Property;
  onBack: () => void;
  onEdit: (property: Property) => void;
  onDelete: (propertyId: string) => Promise<void>;
  onUpdateStatus: (propertyId: string, status: PropertyStatus, note?: string) => Promise<void>;
  onAddImages: (propertyId: string, newImages: PropertyImage[]) => Promise<void>;
  onDeleteImage: (propertyId: string, imageId: string) => Promise<void>;
  sponsorAds?: SponsorAd[];
  adsEnabled?: boolean;
  onOpenUpgradeModal?: () => void;
}

export const PropertyDetailsView: React.FC<PropertyDetailsViewProps> = ({
  user,
  property,
  onBack,
  onEdit,
  onDelete,
  onUpdateStatus,
  onAddImages,
  onDeleteImage,
  sponsorAds,
  adsEnabled = true,
  onOpenUpgradeModal,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);
  const [soldNote, setSoldNote] = useState('');
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const priceInfo = formatPKR(property.price);
  const images = property.images || [];
  const tiktoks = property.tiktok_links || [];
  const isSold = property.status === 'Sold';

  // Close manage dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowManageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Upload pictures directly on details page
  const handleUploadAdditionalImages = async (files: FileList | null) => {
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
              property_id: property.property_id,
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

    await Promise.all(readPromises);
    if (newImages.length > 0) {
      await onAddImages(property.property_id, newImages);
    }
  };

  const handleDeleteProperty = async () => {
    setIsDeleting(true);
    try {
      await onDelete(property.property_id);
    } catch (err) {
      console.error('Failed to delete property', err);
      setIsDeleting(false);
    }
  };

  const handleConfirmMarkAsSold = async () => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(
        property.property_id, 
        'Sold', 
        soldNote.trim() ? `Marked as Sold: ${soldNote.trim()}` : 'Marked as Sold by employee'
      );
      setShowSoldConfirm(false);
      setSoldNote('');
    } catch (err) {
      console.error('Failed to mark as sold', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSetStatus = async (status: PropertyStatus) => {
    setIsUpdatingStatus(true);
    setShowManageMenu(false);
    try {
      await onUpdateStatus(property.property_id, status);
    } catch (err) {
      console.error(`Failed to change status to ${status}`, err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Lightbox navigation
  const handleNextImage = () => {
    if (selectedImageIndex !== null && images.length > 0) {
      setSelectedImageIndex((selectedImageIndex + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    if (selectedImageIndex !== null && images.length > 0) {
      setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-32 space-y-4 sm:space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl theme-bg-card border theme-border text-xs font-semibold theme-text-secondary hover:theme-text-main transition shadow-xs min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick status button */}
          {!isSold ? (
            <button
              onClick={() => setShowSoldConfirm(true)}
              disabled={isUpdatingStatus}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs active:scale-95 disabled:opacity-50 min-h-[40px]"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark Sold</span>
            </button>
          ) : (
            <button
              onClick={() => handleSetStatus('Available')}
              disabled={isUpdatingStatus}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs active:scale-95 disabled:opacity-50 min-h-[40px]"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Available</span>
            </button>
          )}

          {/* Edit Property Button (Visible on mobile as well) */}
          <button
            onClick={() => onEdit(property)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl theme-bg-card hover:theme-bg-subtle border theme-border text-xs font-semibold theme-text-main transition min-h-[40px]"
            title="Edit Property"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="hidden xs:inline">Edit</span>
          </button>

          {/* Manage Property Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowManageMenu(!showManageMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-bg-card hover:theme-bg-subtle border theme-border text-xs font-bold text-amber-700 dark:text-amber-400 transition"
              title="Manage Property"
            >
              <MoreVertical className="w-4 h-4" />
              <span className="hidden xs:inline">Manage Property</span>
            </button>

            {showManageMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl theme-bg-card border theme-border shadow-xl p-1.5 z-40 text-xs theme-text-main animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b theme-border text-[11px] font-bold theme-text-tertiary uppercase tracking-wider">
                  Manage Listing
                </div>

                {/* Edit Property */}
                <button
                  onClick={() => {
                    setShowManageMenu(false);
                    onEdit(property);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <Edit3 className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Edit Property</span>
                </button>

                {/* View History */}
                <button
                  onClick={() => {
                    setShowManageMenu(false);
                    setShowHistoryModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>View History</span>
                </button>

                <div className="my-1 border-t theme-border" />

                {/* Status Options */}
                {property.status !== 'Available' && (
                  <button
                    onClick={() => handleSetStatus('Available')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 transition"
                  >
                    <PlayCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Mark as Available</span>
                  </button>
                )}

                {property.status !== 'On Hold' && (
                  <button
                    onClick={() => handleSetStatus('On Hold')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 transition"
                  >
                    <PauseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Mark as On Hold</span>
                  </button>
                )}

                {!isSold ? (
                  <button
                    onClick={() => {
                      setShowManageMenu(false);
                      setShowSoldConfirm(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 transition"
                  >
                    <CheckCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Mark as Sold</span>
                  </button>
                ) : null}

                <div className="my-1 border-t theme-border" />

                {/* Delete Property */}
                <button
                  onClick={() => {
                    setShowManageMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 transition font-semibold"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Delete Property</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prominent SOLD Badge / Archive Banner */}
      {isSold && (
        <div className="rounded-2xl p-4 bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm tracking-wider shadow-xs">
              SOLD
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-main flex items-center gap-1.5">
                <span>Property Marked as Sold</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-semibold">
                  Archived Record
                </span>
              </h3>
              <p className="text-xs theme-text-secondary mt-0.5">
                Preserved in your historical records under <strong className="text-amber-800 dark:text-amber-300 font-mono">My Listings → Sold</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 rounded-lg theme-bg-card border theme-border text-xs font-semibold theme-text-main hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>View History</span>
            </button>
            <button
              onClick={() => handleSetStatus('Available')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Mark as Available</span>
            </button>
          </div>
        </div>
      )}

      {/* MARK AS SOLD CONFIRMATION DIALOG */}
      {showSoldConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl theme-bg-card border theme-border p-6 shadow-2xl theme-text-main space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold theme-text-main font-brand">
                  Are you sure you want to mark this property as Sold?
                </h3>
                <p className="text-xs theme-text-secondary mt-0.5">
                  {property.society} · Plot #{property.plot_number}
                </p>
              </div>
            </div>

            <div className="theme-bg-subtle p-3.5 rounded-xl border theme-border text-xs theme-text-secondary space-y-2">
              <p>
                ✓ Changes property status to <strong className="text-rose-700 dark:text-rose-400 font-semibold">Sold</strong>.
              </p>
              <p>
                ✓ Removes it from active Available listings.
              </p>
              <p>
                ✓ Retains all property information, images, and history under <strong className="text-amber-700 dark:text-amber-400 font-mono">My Listings → Sold</strong>.
              </p>
              <p className="text-[11px] theme-text-tertiary">
                Note: This does <span className="underline font-bold">not</span> delete the property. Historical records remain fully preserved.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
                Sold Details / Buyer Note (Optional):
              </label>
              <input
                type="text"
                value={soldNote}
                onChange={(e) => setSoldNote(e.target.value)}
                placeholder="e.g. Sold to Client for 45 Lac via token"
                className="w-full px-3 py-2 rounded-xl theme-bg-subtle border theme-border text-xs theme-text-main placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSoldConfirm(false)}
                className="flex-1 py-2.5 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-main hover:bg-black/5 dark:hover:bg-white/5 border theme-border transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkAsSold}
                disabled={isUpdatingStatus}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                {isUpdatingStatus ? 'Updating...' : 'Mark as Sold'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PROPERTY CONFIRMATION DIALOG */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl theme-bg-card border-2 border-rose-600 p-6 shadow-2xl theme-text-main space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 font-brand">
                  Delete this property permanently?
                </h3>
                <p className="text-xs theme-text-secondary mt-0.5">
                  {property.society} · Plot #{property.plot_number}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200">
              <p className="font-semibold">
                All information associated with this property may be removed. This action cannot be undone.
              </p>
              <p className="mt-1 text-[11px] theme-text-secondary">
                All attached pictures, video records, and notes will be permanently deleted from local and cloud storage.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-main hover:bg-black/5 dark:hover:bg-white/5 border theme-border transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProperty}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-md shadow-rose-600/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Property Card Header */}
      <div className="theme-bg-card border theme-border rounded-3xl p-6 sm:p-8 theme-shadow relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* For Sale vs For Rent Badge */}
              <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-md shadow-xs ${
                property.listing_type === 'Rent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}>
                {property.listing_type === 'Rent' ? 'FOR RENT' : 'FOR SALE'}
              </span>

              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                {property.society}
              </span>
              <span className="text-xs font-semibold theme-text-tertiary">·</span>
              <span className="text-xs theme-text-secondary">{property.town}</span>
              <span className="text-xs font-semibold theme-text-tertiary">·</span>
              
              {/* Prominent Status Display */}
              <span
                className={`text-xs font-bold font-mono px-3 py-1 rounded-md shadow-xs uppercase tracking-wider ${
                  property.status === 'Available'
                    ? 'bg-emerald-600 text-white'
                    : property.status === 'On Hold'
                    ? 'bg-amber-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {property.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold theme-text-main font-brand">
              Plot #{property.plot_number}
            </h1>
            <p className="text-sm font-semibold theme-text-secondary mt-1">
              {property.phase ? `${property.phase}, ` : ''}{property.block ? `${property.block}, ` : ''}{property.society}
            </p>
          </div>

          {/* Price Tag */}
          <div className="sm:text-right theme-bg-subtle p-4 rounded-2xl border theme-border">
            <span className="text-[11px] uppercase tracking-wider theme-text-tertiary font-semibold block">
              {property.listing_type === 'Rent' 
                ? `Rent (${property.rent_duration || 'Monthly'})` 
                : 'Asking Price / Rate'}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-800 dark:text-amber-300 font-brand mt-0.5">
              {priceInfo.short}
            </div>
            <div className="text-xs theme-text-secondary font-mono mt-0.5">
              {priceInfo.full}
            </div>
            {property.price_per_marla && property.listing_type !== 'Rent' && (
              <div className="mt-1 text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold border-t border-amber-500/20 pt-1">
                Rate: PKR {formatPKR(property.price_per_marla).short} / Marla
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t theme-border">
          <div className="theme-bg-subtle p-3 rounded-xl border theme-border">
            <span className="text-[10px] theme-text-tertiary uppercase font-semibold">Plot Size</span>
            <div className="text-base font-bold theme-text-main mt-0.5 font-mono">
              {property.plot_size}
            </div>
          </div>

          <div className="theme-bg-subtle p-3 rounded-xl border theme-border">
            <span className="text-[10px] theme-text-tertiary uppercase font-semibold">Plot Type</span>
            <div className="text-base font-bold theme-text-main mt-0.5">
              {property.plot_type}
            </div>
          </div>

          <div className="theme-bg-subtle p-3 rounded-xl border theme-border">
            <span className="text-[10px] theme-text-tertiary uppercase font-semibold">Phase / Sector</span>
            <div className="text-base font-bold theme-text-main mt-0.5 truncate">
              {property.phase || 'N/A'}
            </div>
          </div>

          <div className="theme-bg-subtle p-3 rounded-xl border theme-border">
            <span className="text-[10px] theme-text-tertiary uppercase font-semibold">Block</span>
            <div className="text-base font-bold theme-text-main mt-0.5 truncate">
              {property.block || 'N/A'}
            </div>
          </div>
        </div>

        {/* VIDEO LINK BUTTON */}
        {tiktoks.length > 0 && (
          <div className="mt-6 pt-5 border-t theme-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl theme-bg-subtle border theme-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-xs">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold theme-text-main">Property Video Tour</h4>
                  <p className="text-xs theme-text-secondary">Walk-through video recorded for this plot</p>
                </div>
              </div>

              <a
                href={tiktoks[0].tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 active:scale-95 whitespace-nowrap"
              >
                <Video className="w-4 h-4" />
                <span>Open Video Tour</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Property Notes */}
      {property.notes && (
        <div className="theme-bg-card border theme-border rounded-2xl p-5 theme-shadow">
          <h3 className="text-xs font-bold uppercase tracking-wider theme-text-secondary font-brand mb-2">
            Property Notes & Specifications
          </h3>
          <p className="text-sm theme-text-main whitespace-pre-line leading-relaxed">
            {property.notes}
          </p>
        </div>
      )}

      {/* PROPERTY IMAGE GALLERY */}
      <div className="theme-bg-card border theme-border rounded-2xl p-5 sm:p-6 theme-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b theme-border">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
                Property Image Gallery ({images.length})
              </h2>
            </div>
            <p className="text-xs theme-text-secondary mt-0.5">
              Tap any picture to open full-screen view
            </p>
          </div>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-bg-subtle hover:bg-black/5 dark:hover:bg-white/5 border theme-border text-xs font-semibold theme-text-main cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
            <span>Add More Pictures</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleUploadAdditionalImages(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-10 theme-bg-subtle rounded-xl border theme-border p-6">
            <Camera className="w-10 h-10 theme-text-tertiary mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold theme-text-main">No pictures in this gallery</p>
            <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-sky-600/20">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Picture</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleUploadAdditionalImages(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.image_id || idx}
                onClick={() => setSelectedImageIndex(idx)}
                className="relative group rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-900 border theme-border aspect-video cursor-pointer"
              >
                <img
                  src={img.image_url}
                  alt={`Property picture ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sponsor Ad Banner for Free Tier Users (Hidden if PRO or Owner) */}
      {sponsorAds && sponsorAds.length > 0 && !user.is_ad_free && user.role !== 'owner' && adsEnabled !== false && (
        <SponsorAdBanner
          user={user}
          ads={sponsorAds}
          adsEnabled={adsEnabled}
          onOpenUpgradeModal={onOpenUpgradeModal || (() => {})}
          variant="banner"
        />
      )}

      {/* Property History Preview */}
      <div className="theme-bg-card border theme-border rounded-2xl p-5 theme-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider theme-text-main font-brand">
              Listing Timeline & History
            </h3>
          </div>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold"
          >
            View Full Log
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b theme-border theme-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Created</span>
            </span>
            <span className="font-mono text-[11px] theme-text-main">{formatDate(property.created_at)}</span>
          </div>

          {property.sold_at && (
            <div className="flex items-center justify-between py-1.5 border-b theme-border theme-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-700 dark:text-rose-400 font-semibold">Marked as Sold</span>
              </span>
              <span className="font-mono text-[11px] text-rose-700 dark:text-rose-400">{formatDate(property.sold_at)}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-1.5 theme-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Last Modified</span>
            </span>
            <span className="font-mono text-[11px] theme-text-main">{formatDate(property.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Date Added & Last Updated Footer */}
      <div className="flex flex-wrap items-center justify-between text-xs theme-text-tertiary px-2 pt-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Added: {formatDate(property.created_at)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Updated: {formatDate(property.updated_at)}</span>
        </div>
      </div>

      {/* View History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl theme-bg-card border theme-border p-6 shadow-2xl theme-text-main space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <h3 className="text-base font-bold theme-text-main font-brand">
                  Property History & Audit Log
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg theme-text-tertiary hover:theme-text-main hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs theme-text-secondary">
              History for <strong className="theme-text-main">{property.society} Plot #{property.plot_number}</strong>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {property.history && property.history.length > 0 ? (
                property.history.map((hist) => (
                  <div
                    key={hist.history_id}
                    className="p-3 rounded-xl theme-bg-subtle border theme-border space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-800 dark:text-amber-400">{hist.action}</span>
                      <span className="font-mono text-[10px] theme-text-tertiary">
                        {formatDate(hist.timestamp)}
                      </span>
                    </div>
                    {hist.note && <p className="theme-text-main">{hist.note}</p>}
                    {hist.username && (
                      <p className="text-[10px] theme-text-tertiary font-mono">By: {hist.username}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl theme-bg-subtle border theme-border space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">Listing Initialized</span>
                      <span className="font-mono text-[10px] theme-text-tertiary">
                        {formatDate(property.created_at)}
                      </span>
                    </div>
                    <p className="theme-text-secondary">Property record created in database</p>
                  </div>

                  {property.sold_at && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-700 dark:text-rose-400">Marked as Sold</span>
                        <span className="font-mono text-[10px] text-rose-600 dark:text-rose-300">
                          {formatDate(property.sold_at)}
                        </span>
                      </div>
                      <p className="theme-text-secondary">Listing moved to Sold archive</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t theme-border">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-2.5 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-main hover:bg-black/5 dark:hover:bg-white/5 border theme-border transition"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Lightbox Modal */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in select-none">
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-stone-800 text-white hover:bg-stone-700 transition z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={async () => {
              const imgToDelete = images[selectedImageIndex];
              await onDeleteImage(property.property_id, imgToDelete.image_id);
              if (images.length <= 1) {
                setSelectedImageIndex(null);
              } else {
                setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
              }
            }}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition z-10 flex items-center gap-1.5 text-xs font-semibold px-3"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Photo</span>
          </button>

          {images.length > 1 && (
            <button
              onClick={handlePrevImage}
              className="absolute left-4 p-3 rounded-full bg-stone-800/80 text-white hover:bg-stone-700 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={images[selectedImageIndex].image_url}
              alt="Full size property"
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="mt-3 text-xs font-mono text-white bg-black/80 px-3 py-1 rounded-full border border-white/20">
              Picture {selectedImageIndex + 1} of {images.length}
            </div>
          </div>

          {images.length > 1 && (
            <button
              onClick={handleNextImage}
              className="absolute right-4 p-3 rounded-full bg-stone-800/80 text-white hover:bg-stone-700 transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
