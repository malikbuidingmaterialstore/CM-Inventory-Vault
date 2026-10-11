import React, { useState, useMemo } from 'react';
import { Property, PropertyStatus, User, SponsorAd } from '../types';
import { SponsorAdBanner } from '../components/SponsorAdBanner';
import { 
  Search, 
  MapPin, 
  Building2, 
  Filter, 
  X, 
  DollarSign, 
  Maximize2,
  ChevronRight
} from 'lucide-react';
import { formatPKR } from '../utils/formatters';

interface SearchPropertyViewProps {
  user: User;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  sponsorAds?: SponsorAd[];
  adsEnabled?: boolean;
  onOpenUpgradeModal?: () => void;
}

export const SearchPropertyView: React.FC<SearchPropertyViewProps> = ({
  user,
  properties,
  onSelectProperty,
  sponsorAds,
  adsEnabled = true,
  onOpenUpgradeModal,
}) => {
  const [societyQuery, setSocietyQuery] = useState('');
  const [townQuery, setTownQuery] = useState('');
  const [phaseQuery, setPhaseQuery] = useState('');
  const [blockQuery, setBlockQuery] = useState('');
  const [plotNumberQuery, setPlotNumberQuery] = useState('');
  const [plotSizeQuery, setPlotSizeQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Extract unique societies & sizes for dropdown shortcuts
  const uniqueSocieties = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => { if (p.society) set.add(p.society); });
    return Array.from(set);
  }, [properties]);

  const uniqueSizes = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => { if (p.plot_size) set.add(p.plot_size); });
    return Array.from(set);
  }, [properties]);

  // Execute Search
  const results = useMemo(() => {
    return properties.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (societyQuery && !p.society.toLowerCase().includes(societyQuery.toLowerCase().trim())) return false;
      if (townQuery && !p.town.toLowerCase().includes(townQuery.toLowerCase().trim())) return false;
      if (phaseQuery && !p.phase.toLowerCase().includes(phaseQuery.toLowerCase().trim())) return false;
      if (blockQuery && !p.block.toLowerCase().includes(blockQuery.toLowerCase().trim())) return false;
      if (plotNumberQuery && !p.plot_number.toLowerCase().includes(plotNumberQuery.toLowerCase().trim())) return false;
      if (plotSizeQuery && !p.plot_size.toLowerCase().includes(plotSizeQuery.toLowerCase().trim())) return false;
      if (maxPrice && Number(maxPrice) > 0 && p.price > Number(maxPrice)) return false;
      return true;
    });
  }, [
    properties,
    statusFilter,
    societyQuery,
    townQuery,
    phaseQuery,
    blockQuery,
    plotNumberQuery,
    plotSizeQuery,
    maxPrice,
  ]);

  const handleClear = () => {
    setSocietyQuery('');
    setTownQuery('');
    setPhaseQuery('');
    setBlockQuery('');
    setPlotNumberQuery('');
    setPlotSizeQuery('');
    setStatusFilter('All');
    setMaxPrice('');
  };

  const hasActiveFilters = 
    societyQuery || 
    townQuery || 
    phaseQuery || 
    blockQuery || 
    plotNumberQuery || 
    plotSizeQuery || 
    statusFilter !== 'All' || 
    maxPrice;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold theme-text-main font-brand">
            Search Properties
          </h1>
          <p className="text-xs theme-text-secondary mt-0.5">
            Search across your private inventory · Employee {user.username}
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-sky-700 dark:text-sky-400 hover:underline font-medium px-2.5 py-1.5 rounded-lg theme-bg-subtle border theme-border"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Advanced Search Form Box */}
      <div className="theme-bg-card border theme-border rounded-2xl p-5 theme-shadow space-y-4">
        {/* Row 1: Society & Plot Number */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
              Housing Society
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 theme-text-tertiary" />
              <input
                type="text"
                value={societyQuery}
                onChange={(e) => setSocietyQuery(e.target.value)}
                placeholder="Search society (e.g. Al Rehman Garden, DHA)..."
                className="w-full pl-9 pr-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-xs focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            {/* Quick Society chips */}
            {uniqueSocieties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {uniqueSocieties.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSocietyQuery(societyQuery === s ? '' : s)}
                    className={`text-[9px] px-1.5 py-0.5 rounded transition ${
                      societyQuery === s
                        ? 'bg-sky-600 text-white font-bold'
                        : 'theme-bg-subtle theme-text-secondary border theme-border hover:theme-text-main'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
              Plot Number
            </label>
            <input
              type="text"
              value={plotNumberQuery}
              onChange={(e) => setPlotNumberQuery(e.target.value)}
              placeholder="e.g. 125, 42"
              className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-xs focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Row 2: Block, Phase, City */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
              Block
            </label>
            <input
              type="text"
              value={blockQuery}
              onChange={(e) => setBlockQuery(e.target.value)}
              placeholder="e.g. Block A"
              className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-xs focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
              Phase
            </label>
            <input
              type="text"
              value={phaseQuery}
              onChange={(e) => setPhaseQuery(e.target.value)}
              placeholder="e.g. Phase 2"
              className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-xs focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
              City
            </label>
            <input
              type="text"
              value={townQuery}
              onChange={(e) => setTownQuery(e.target.value)}
              placeholder="e.g. Lahore"
              className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-xs focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Row 3: Size, Max Price, Status Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t theme-border">
          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
              Plot Size
            </label>
            <input
              type="text"
              value={plotSizeQuery}
              onChange={(e) => setPlotSizeQuery(e.target.value)}
              placeholder="e.g. 5 Marla, 1 Kanal"
              className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-xs focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
              Maximum Price (PKR)
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 10000000"
              className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl theme-text-main placeholder:text-stone-400 text-xs focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
              Status Filter
            </label>
            <div className="grid grid-cols-4 gap-1">
              {['All', 'Available', 'On Hold', 'Sold'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`py-2 px-1 text-[10px] font-semibold rounded-lg transition border ${
                    statusFilter === st
                      ? 'bg-sky-600 dark:bg-sky-500 text-white border-sky-600 font-bold shadow-xs'
                      : 'theme-bg-subtle theme-text-secondary border theme-border hover:theme-text-main'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
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

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
            Results Found ({results.length})
          </h2>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-12 theme-bg-card rounded-2xl border theme-border p-6 theme-shadow">
            <Building2 className="w-10 h-10 theme-text-tertiary mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold theme-text-main">No matching properties</p>
            <p className="text-xs theme-text-secondary mt-1">
              Try clearing some filter criteria to broaden your search results.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((prop) => {
              const priceInfo = formatPKR(prop.price);
              const hasImages = prop.images && prop.images.length > 0;

              return (
                <div
                  key={prop.property_id}
                  onClick={() => onSelectProperty(prop)}
                  className="group theme-bg-card hover:theme-bg-subtle border theme-border hover:border-sky-400 dark:hover:border-sky-600 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 theme-shadow flex flex-col justify-between"
                >
                  <div className="relative h-36 w-full bg-stone-200 dark:bg-stone-900 overflow-hidden">
                    {hasImages ? (
                      <img
                        src={prop.images[0].image_url}
                        alt={`${prop.society} Plot ${prop.plot_number}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center theme-bg-subtle theme-text-tertiary">
                        <Building2 className="w-8 h-8 opacity-30 mb-1" />
                        <span className="text-[10px]">No Image</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded shadow-xs uppercase tracking-wider ${
                          prop.status === 'Available'
                            ? 'bg-emerald-600 text-white'
                            : prop.status === 'On Hold'
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {prop.status === 'Sold' ? 'SOLD' : prop.status}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {prop.plot_size}
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-sky-800 dark:text-sky-300 font-semibold">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{prop.society}</span>
                      </div>

                      <h3 className="text-sm font-bold theme-text-main mt-0.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        Plot #{prop.plot_number} · {prop.block || prop.phase || 'Main'}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2.5 border-t theme-border flex items-center justify-between">
                      <div className="text-sm font-bold theme-text-main font-brand">
                        {priceInfo.short}
                      </div>
                      <ChevronRight className="w-4 h-4 theme-text-tertiary group-hover:text-sky-600 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
