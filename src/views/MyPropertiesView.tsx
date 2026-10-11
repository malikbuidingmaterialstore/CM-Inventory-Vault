import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Property, PropertyStatus, User, SponsorAd } from '../types';
import { SponsorAdBanner } from '../components/SponsorAdBanner';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  PlusCircle, 
  Video, 
  Camera, 
  ArrowUpDown,
  Tag,
  MoreVertical,
  Edit3,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  AlertTriangle,
  History,
  DollarSign,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatPKR, formatDate } from '../utils/formatters';
import { PriceRangeFilter } from '../components/PriceRangeFilter';

interface MyPropertiesViewProps {
  user: User;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onAddNew: () => void;
  onEdit: (property: Property) => void;
  onDelete: (propertyId: string) => Promise<void>;
  onUpdateStatus: (propertyId: string, status: PropertyStatus, note?: string) => Promise<void>;
  sponsorAds?: SponsorAd[];
  adsEnabled?: boolean;
  onOpenUpgradeModal?: () => void;
}

export const MyPropertiesView: React.FC<MyPropertiesViewProps> = ({
  user,
  properties,
  onSelectProperty,
  onAddNew,
  onEdit,
  onDelete,
  onUpdateStatus,
  sponsorAds,
  adsEnabled = true,
  onOpenUpgradeModal,
}) => {
  // Status filter state: 'All' | 'Available' | 'On Hold' | 'Sold'
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priceAsc' | 'priceDesc' | 'plot'>('date');

  // Price Range filter state
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [showPricePanel, setShowPricePanel] = useState<boolean>(true);

  // Menu & Confirmation States
  const [activeMenuPropId, setActiveMenuPropId] = useState<string | null>(null);
  const [soldModalProp, setSoldModalProp] = useState<Property | null>(null);
  const [deleteModalProp, setDeleteModalProp] = useState<Property | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Close open dropdown when clicking outside
  useEffect(() => {
    const handleOutside = () => setActiveMenuPropId(null);
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  // Compute status counts for the tabs: All, Available, On Hold, Sold
  const counts = useMemo(() => {
    return {
      all: properties.length,
      available: properties.filter((p) => p.status === 'Available').length,
      onHold: properties.filter((p) => p.status === 'On Hold').length,
      sold: properties.filter((p) => p.status === 'Sold').length,
    };
  }, [properties]);

  // Readable price range summary
  const priceRangeSummary = useMemo(() => {
    if (minPrice === '' && maxPrice === '') return 'All Prices';
    if (minPrice !== '' && maxPrice !== '') {
      return `${formatPKR(Number(minPrice)).short} – ${formatPKR(Number(maxPrice)).short}`;
    }
    if (minPrice !== '') {
      return `Min ${formatPKR(Number(minPrice)).short}`;
    }
    if (maxPrice !== '') {
      return `Up to ${formatPKR(Number(maxPrice)).short}`;
    }
    return 'All Prices';
  }, [minPrice, maxPrice]);

  const isPriceFilterActive = minPrice !== '' || maxPrice !== '';
  const hasAnyFilterActive = filterStatus !== 'All' || isPriceFilterActive || searchQuery.trim().length > 0;

  // Maximum price detected in user's listing dataset for visual slider scaling
  const highestPropertyPrice = useMemo(() => {
    if (properties.length === 0) return 50000000;
    const maxVal = Math.max(...properties.map((p) => p.price || 0));
    return Math.max(maxVal, 20000000);
  }, [properties]);

  // Filter & Search strictly inside user's isolated properties
  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        // Status filter: Available, Sold, On Hold, or All
        if (filterStatus !== 'All' && p.status !== filterStatus) return false;
        
        // Price Range filter: minPrice and maxPrice
        if (minPrice !== '' && Number(minPrice) > 0) {
          if (p.price < Number(minPrice)) return false;
        }
        if (maxPrice !== '' && Number(maxPrice) > 0) {
          if (p.price > Number(maxPrice)) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            p.society.toLowerCase().includes(q) ||
            p.plot_number.toLowerCase().includes(q) ||
            p.block.toLowerCase().includes(q) ||
            p.phase.toLowerCase().includes(q) ||
            p.town.toLowerCase().includes(q) ||
            p.plot_size.toLowerCase().includes(q) ||
            p.status.toLowerCase().includes(q) ||
            p.notes.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        if (sortBy === 'plot') return a.plot_number.localeCompare(b.plot_number, undefined, { numeric: true });
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [properties, filterStatus, minPrice, maxPrice, searchQuery, sortBy]);

  // Clear only price filter
  const handleClearPriceFilter = () => {
    setMinPrice('');
    setMaxPrice('');
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setFilterStatus('All');
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery('');
  };

  // Confirm Mark as Sold
  const handleConfirmSold = async () => {
    if (!soldModalProp) return;
    setIsProcessing(true);
    try {
      await onUpdateStatus(soldModalProp.property_id, 'Sold', 'Marked as Sold from My Listings');
      setSoldModalProp(null);
    } catch (err) {
      console.error('Failed to mark as sold', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm Delete Property
  const handleConfirmDelete = async () => {
    if (!deleteModalProp) return;
    setIsProcessing(true);
    try {
      await onDelete(deleteModalProp.property_id);
      setDeleteModalProp(null);
    } catch (err) {
      console.error('Failed to delete property', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6 pb-28 space-y-4 sm:space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold theme-text-main font-brand">
            My Listings ({properties.length})
          </h1>
          <p className="text-[11px] sm:text-xs theme-text-secondary mt-0.5">
            Private records for <span className="text-sky-800 dark:text-sky-300 font-mono font-semibold">{user.username}</span> · Strict employee isolation active
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 active:scale-95 transition min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Plot</span>
        </button>
      </div>

      {/* Main Filter Control Box */}
      <div className="theme-bg-card border theme-border rounded-2xl p-4 theme-shadow space-y-3.5 transition-colors">
        {/* Search Input & Sort Selector Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none theme-text-tertiary">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by society, block, plot #, phase, or notes..."
              className="w-full pl-10 pr-9 py-2.5 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 dark:placeholder:text-stone-500 text-xs focus:outline-none focus:border-sky-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center theme-text-tertiary hover:theme-text-main"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs theme-text-secondary theme-bg-subtle border theme-border rounded-xl px-3 py-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
            <span className="text-[11px] theme-text-tertiary hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs theme-text-main font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="date" className="theme-bg-card theme-text-main">Latest Updated</option>
              <option value="priceAsc" className="theme-bg-card theme-text-main">Price: Low to High</option>
              <option value="priceDesc" className="theme-bg-card theme-text-main">Price: High to Low</option>
              <option value="plot" className="theme-bg-card theme-text-main">Plot Number</option>
            </select>
          </div>
        </div>

        {/* Status Tabs Bar */}
        <div className="pt-2 border-t theme-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-semibold theme-text-tertiary uppercase tracking-wider mr-1 hidden sm:inline">
                Status:
              </span>

              {/* All Status Tab */}
              <button
                onClick={() => setFilterStatus('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                  filterStatus === 'All'
                    ? 'bg-sky-600 dark:bg-sky-500 text-white border-sky-600 shadow-xs'
                    : 'theme-bg-subtle theme-text-secondary theme-border hover:theme-text-main'
                }`}
              >
                All ({counts.all})
              </button>

              {/* Available Tab */}
              <button
                onClick={() => setFilterStatus('Available')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                  filterStatus === 'Available'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                    : 'theme-bg-subtle theme-text-secondary theme-border hover:text-emerald-700 dark:hover:text-emerald-400'
                }`}
              >
                Available ({counts.available})
              </button>

              {/* On Hold Tab */}
              <button
                onClick={() => setFilterStatus('On Hold')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                  filterStatus === 'On Hold'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold'
                    : 'theme-bg-subtle theme-text-secondary theme-border hover:text-amber-700 dark:hover:text-amber-400'
                }`}
              >
                On Hold ({counts.onHold})
              </button>

              {/* Sold Tab */}
              <button
                onClick={() => setFilterStatus('Sold')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                  filterStatus === 'Sold'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold'
                    : 'theme-bg-subtle theme-text-secondary theme-border hover:text-rose-700 dark:hover:text-rose-400'
                }`}
              >
                Sold ({counts.sold})
              </button>
            </div>

            {/* Price Filter Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPricePanel((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  isPriceFilterActive
                    ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-300 font-semibold shadow-xs'
                    : 'theme-bg-subtle theme-border theme-text-secondary hover:theme-text-main'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                <span>Price Range: <span className="theme-text-main font-mono">{priceRangeSummary}</span></span>
                {isPriceFilterActive && (
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                )}
                {showPricePanel ? (
                  <ChevronUp className="w-3.5 h-3.5 ml-0.5 theme-text-tertiary" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5 theme-text-tertiary" />
                )}
              </button>

              {isPriceFilterActive && (
                <button
                  type="button"
                  onClick={handleClearPriceFilter}
                  className="p-1.5 rounded-lg theme-bg-subtle border theme-border theme-text-tertiary hover:text-rose-600 transition"
                  title="Clear price filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Range-Based Price Filter Component */}
        {showPricePanel && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-1">
            <PriceRangeFilter
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onReset={handleClearPriceFilter}
              highestAvailablePrice={highestPropertyPrice}
              matchedCount={filteredProperties.length}
              totalCount={properties.length}
            />
          </div>
        )}

        {/* Active Filter Tags Row (Visible whenever any filter is applied) */}
        {hasAnyFilterActive && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t theme-border text-xs">
            <span className="text-[11px] theme-text-secondary font-medium">Active filters:</span>

            {/* Status Filter Tag */}
            {filterStatus !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg theme-bg-subtle theme-text-main border theme-border text-xs">
                <span>Status: <strong className="text-amber-700 dark:text-amber-400">{filterStatus}</strong></span>
                <button
                  type="button"
                  onClick={() => setFilterStatus('All')}
                  className="theme-text-tertiary hover:theme-text-main"
                  title="Remove status filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Price Filter Tag */}
            {isPriceFilterActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs">
                <DollarSign className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                <span>Price: <strong className="font-mono">{priceRangeSummary}</strong></span>
                <button
                  type="button"
                  onClick={handleClearPriceFilter}
                  className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200"
                  title="Remove price filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Search Query Tag */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg theme-bg-subtle theme-text-main border theme-border text-xs">
                <span>Search: <strong className="font-mono">"{searchQuery.trim()}"</strong></span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="theme-text-tertiary hover:theme-text-main"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Clear All Filters Button */}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-[11px] theme-text-secondary pt-1">
          <div>
            Showing <span className="font-bold theme-text-main font-mono">{filteredProperties.length}</span> of{' '}
            <span className="font-mono theme-text-main">{properties.length}</span> properties
            {filterStatus !== 'All' && <span> under <strong className="text-amber-700 dark:text-amber-400">{filterStatus}</strong></span>}
            {isPriceFilterActive && <span> in price range (<strong className="text-amber-700 dark:text-amber-400">{priceRangeSummary}</strong>)</span>}
          </div>
          {filteredProperties.length < properties.length && !hasAnyFilterActive && (
            <span className="theme-text-tertiary">All listings shown</span>
          )}
        </div>
      </div>

      {/* Sponsor Ad Banner for Free Tier Users (Hidden if PRO or Owner) */}
      {sponsorAds && sponsorAds.length > 0 && !user.is_ad_free && user.role !== 'owner' && adsEnabled !== false && (
        <SponsorAdBanner
          user={user}
          ads={sponsorAds}
          adsEnabled={adsEnabled}
          onOpenUpgradeModal={onOpenUpgradeModal || (() => {})}
          variant="compact"
        />
      )}

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-14 theme-bg-card rounded-2xl border theme-border p-6 space-y-3 theme-shadow">
          <Building2 className="w-12 h-12 theme-text-tertiary mx-auto opacity-50" />
          <h3 className="text-base font-bold theme-text-main font-brand">No properties found</h3>
          <p className="text-xs theme-text-secondary max-w-md mx-auto">
            {hasAnyFilterActive ? (
              <>
                No property records match your current filters
                {filterStatus !== 'All' && <span> (Status: <strong>{filterStatus}</strong>)</span>}
                {isPriceFilterActive && <span> (Price: <strong>{priceRangeSummary}</strong>)</span>}
                {searchQuery.trim() && <span> matching "<strong>{searchQuery}</strong>"</span>}.
              </>
            ) : (
              `You do not have any properties currently listed.`
            )}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasAnyFilterActive && (
              <button
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl theme-bg-subtle theme-text-main text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 border theme-border transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                <span>Reset All Filters</span>
              </button>
            )}
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white text-xs font-bold transition shadow-md shadow-sky-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Property</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((prop) => {
            const priceInfo = formatPKR(prop.price);
            const hasImages = prop.images && prop.images.length > 0;
            const hasVideos = (prop.videos && prop.videos.length > 0) || (prop.tiktok_links && prop.tiktok_links.length > 0);
            const isSold = prop.status === 'Sold';
            const isMenuOpen = activeMenuPropId === prop.property_id;

            return (
              <div
                key={prop.property_id}
                onClick={() => onSelectProperty(prop)}
                className={`group theme-bg-card hover:theme-bg-subtle border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 theme-shadow flex flex-col justify-between relative ${
                  isSold 
                    ? 'border-rose-300 dark:border-rose-900/40 hover:border-rose-400' 
                    : 'theme-border hover:border-sky-400 dark:hover:border-sky-600'
                }`}
              >
                {/* Image Thumbnail */}
                <div className="relative h-44 w-full bg-stone-200 dark:bg-stone-900 overflow-hidden">
                  {hasImages ? (
                    <img
                      src={prop.images[0].image_url}
                      alt={`${prop.society} Plot ${prop.plot_number}`}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isSold ? 'grayscale-[20%] group-hover:scale-105' : 'group-hover:scale-105'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center theme-bg-subtle theme-text-tertiary">
                      <Building2 className="w-10 h-10 opacity-30 mb-1" />
                      <span className="text-[11px] font-medium">No Picture Added</span>
                    </div>
                  )}

                  {/* Prominent Status Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-md shadow-xs uppercase tracking-wider ${
                        prop.status === 'Available'
                          ? 'bg-emerald-600 text-white'
                          : prop.status === 'On Hold'
                          ? 'bg-amber-600 text-white'
                          : 'bg-rose-600 text-white border border-rose-500'
                      }`}
                    >
                      {prop.status === 'Sold' ? 'SOLD' : prop.status}
                    </span>
                  </div>

                  {/* Three-Dot / Manage Property Trigger Button */}
                  <div 
                    className="absolute top-2 right-2 z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuPropId(isMenuOpen ? null : prop.property_id);
                      }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition shadow-xs"
                      title="Manage Property"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Manage Property Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-1 w-48 rounded-xl theme-bg-card border theme-border shadow-xl p-1.5 z-30 text-xs theme-text-main backdrop-blur-md animate-in fade-in">
                        <div className="px-2.5 py-1.5 border-b theme-border text-[10px] font-bold theme-text-tertiary uppercase tracking-wider">
                          Manage Property
                        </div>

                        {/* Edit Property */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuPropId(null);
                            onEdit(prop);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-black/5 dark:hover:bg-white/10 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                          <span>Edit Property</span>
                        </button>

                        {/* Mark as Available */}
                        {prop.status !== 'Available' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setActiveMenuPropId(null);
                              await onUpdateStatus(prop.property_id, 'Available');
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 transition"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Mark as Available</span>
                          </button>
                        )}

                        {/* Mark as On Hold */}
                        {prop.status !== 'On Hold' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setActiveMenuPropId(null);
                              await onUpdateStatus(prop.property_id, 'On Hold');
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 transition"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Mark as On Hold</span>
                          </button>
                        )}

                        {/* Mark as Sold (Only if NOT already sold) */}
                        {!isSold ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuPropId(null);
                              setSoldModalProp(prop);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Mark as Sold</span>
                          </button>
                        ) : null}

                        <div className="my-1 border-t theme-border" />

                        {/* Delete Property */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuPropId(null);
                            setDeleteModalProp(prop);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 transition font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Property</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Badges on bottom right: Images count + Videos tag */}
                  <div className="absolute top-2.5 right-11 flex items-center gap-1.5">
                    {hasVideos && (
                      <div className="bg-sky-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                        <Video className="w-3 h-3" />
                        <span>Videos</span>
                      </div>
                    )}
                    {hasImages && (
                      <div className="bg-black/70 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>{prop.images.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Plot Size & Type */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded">
                      {prop.plot_size}
                    </span>
                    <span className="bg-black/60 backdrop-blur-md text-stone-200 text-[10px] px-2 py-0.5 rounded">
                      {prop.plot_type}
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-sky-800 dark:text-sky-300 font-semibold">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{prop.society}</span>
                    </div>

                    <h2 className="text-base font-bold theme-text-main mt-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      Plot #{prop.plot_number} · {prop.block || prop.phase || 'Main'}
                    </h2>

                    <div className="text-[11px] theme-text-secondary mt-1 line-clamp-2">
                      {prop.notes || `${prop.plot_size} ${prop.plot_type} plot located in ${prop.society}, ${prop.town}.`}
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t theme-border flex items-center justify-between gap-2">
                    <div>
                      <div className="text-base sm:text-lg font-bold theme-text-main font-brand">
                        {priceInfo.short}
                      </div>
                      <div className="text-[10px] theme-text-tertiary font-mono">
                        {priceInfo.full}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSold && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          SOLD
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProperty(prop);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 active:scale-95 min-h-[36px] flex items-center gap-1"
                      >
                        <span>View</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRMATION DIALOG: MARK AS SOLD (From Listings Page) */}
      {soldModalProp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
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
                  {soldModalProp.society} · Plot #{soldModalProp.plot_number}
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
                ✓ Keeps it accessible under <strong className="text-amber-700 dark:text-amber-400 font-mono">My Listings → Sold</strong>.
              </p>
              <p className="text-[11px] theme-text-tertiary">
                Preserves all property details, notes, pictures, and history. Does NOT delete the property.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSoldModalProp(null)}
                className="flex-1 py-2.5 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-main hover:bg-black/5 dark:hover:bg-white/5 border theme-border transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSold}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                {isProcessing ? 'Updating...' : 'Mark as Sold'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: DELETE PROPERTY PERMANENTLY (From Listings Page) */}
      {deleteModalProp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
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
                  {deleteModalProp.society} · Plot #{deleteModalProp.plot_number}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200">
              <p className="font-semibold">
                All information associated with this property may be removed. This action cannot be undone.
              </p>
              <p className="mt-1 text-[11px] theme-text-secondary">
                This will delete the property record, all attached images, videos, and history permanently.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalProp(null)}
                className="flex-1 py-2.5 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-main hover:bg-black/5 dark:hover:bg-white/5 border theme-border transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-md shadow-rose-600/20"
              >
                {isProcessing ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
