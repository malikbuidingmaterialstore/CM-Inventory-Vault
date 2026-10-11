import React, { useMemo } from 'react';
import { 
  RotateCcw, 
  SlidersHorizontal, 
  X, 
  TrendingDown, 
  TrendingUp,
  Info,
  DollarSign
} from 'lucide-react';
import { formatPKR } from '../utils/formatters';

export interface PriceRangePreset {
  id: string;
  label: string;
  min: number | '';
  max: number | '';
  subtitle?: string;
}

export const DEFAULT_PRICE_PRESETS: PriceRangePreset[] = [
  { id: 'all', label: 'All Prices', min: '', max: '' },
  { id: 'under_25_lac', label: 'Under 25 Lac', min: '', max: 2500000, subtitle: '< 25 Lac' },
  { id: '25_50_lac', label: '25 – 50 Lac', min: 2500000, max: 5000000, subtitle: '25L – 50L' },
  { id: '50_100_lac', label: '50 Lac – 1 Crore', min: 5000000, max: 10000000, subtitle: '50L – 1 Cr' },
  { id: '1_2_crore', label: '1 – 2 Crore', min: 10000000, max: 20000000, subtitle: '1 Cr – 2 Cr' },
  { id: '2_5_crore', label: '2 – 5 Crore', min: 20000000, max: 50000000, subtitle: '2 Cr – 5 Cr' },
  { id: 'above_5_crore', label: 'Above 5 Crore', min: 50000000, max: '', subtitle: '> 5 Cr' },
];

interface PriceRangeFilterProps {
  minPrice: number | '';
  maxPrice: number | '';
  onMinPriceChange: (val: number | '') => void;
  onMaxPriceChange: (val: number | '') => void;
  onReset: () => void;
  /** Maximum price boundary for the slider track, calculated from actual dataset */
  highestAvailablePrice?: number;
  /** Lowest price boundary for the slider track */
  lowestAvailablePrice?: number;
  /** Count of properties matching current filter */
  matchedCount?: number;
  /** Total count of properties */
  totalCount?: number;
  /** Optional custom presets */
  presets?: PriceRangePreset[];
}

export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onReset,
  highestAvailablePrice = 50000000,
  lowestAvailablePrice: _lowestAvailablePrice = 0,
  matchedCount,
  totalCount,
  presets = DEFAULT_PRICE_PRESETS,
}) => {
  // Slider track max bound: rounded up to nearest 1 Crore (at least 2 Crore)
  const sliderMax = useMemo(() => {
    const rawMax = Math.max(highestAvailablePrice, Number(maxPrice) || 0, 20000000);
    return Math.ceil(rawMax / 10000000) * 10000000;
  }, [highestAvailablePrice, maxPrice]);

  const sliderMin = 0;
  const sliderStep = 250000; // 2.5 Lac step for smooth sliding

  const currentMinNum = minPrice === '' ? 0 : Number(minPrice);
  const currentMaxNum = maxPrice === '' ? sliderMax : Number(maxPrice);

  const isFilterActive = minPrice !== '' || maxPrice !== '';

  // Calculate percentage positions for visual slider bar
  const minPercent = Math.min(100, Math.max(0, (currentMinNum / sliderMax) * 100));
  const maxPercent = Math.min(100, Math.max(0, (currentMaxNum / sliderMax) * 100));

  // Determine active preset
  const activePresetId = useMemo(() => {
    if (minPrice === '' && maxPrice === '') return 'all';
    for (const p of presets) {
      if (p.id === 'all') continue;
      const minMatch = p.min === '' ? minPrice === '' : minPrice === p.min;
      const maxMatch = p.max === '' ? maxPrice === '' : maxPrice === p.max;
      if (minMatch && maxMatch) return p.id;
    }
    return 'custom';
  }, [minPrice, maxPrice, presets]);

  // Adjust min price from slider
  const handleSliderMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (maxPrice !== '' && val > Number(maxPrice)) {
      onMinPriceChange(Number(maxPrice));
    } else {
      onMinPriceChange(val === 0 ? '' : val);
    }
  };

  // Adjust max price from slider
  const handleSliderMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (minPrice !== '' && val < Number(minPrice)) {
      onMaxPriceChange(Number(minPrice));
    } else {
      onMaxPriceChange(val >= sliderMax ? '' : val);
    }
  };

  // Quick delta adjustments (+/- 5 Lacs, 1 Crore)
  const adjustMinBy = (delta: number) => {
    const current = minPrice === '' ? 0 : Number(minPrice);
    const updated = Math.max(0, current + delta);
    if (maxPrice !== '' && updated > Number(maxPrice)) {
      onMinPriceChange(Number(maxPrice));
    } else {
      onMinPriceChange(updated === 0 ? '' : updated);
    }
  };

  const adjustMaxBy = (delta: number) => {
    const current = maxPrice === '' ? sliderMax : Number(maxPrice);
    const updated = Math.max(0, current + delta);
    if (minPrice !== '' && updated < Number(minPrice)) {
      onMaxPriceChange(Number(minPrice));
    } else {
      onMaxPriceChange(updated >= sliderMax ? '' : updated);
    }
  };

  return (
    <div className="theme-bg-subtle rounded-2xl border theme-border p-4 space-y-4 transition-colors">
      {/* Header with Title, Matching Counts, and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b theme-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold theme-text-main uppercase tracking-wider flex items-center gap-1.5 font-brand">
              <span>Price Range Filter</span>
              {isFilterActive && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                  ACTIVE
                </span>
              )}
            </h3>
            <p className="text-[11px] theme-text-secondary">
              Filter properties by <span className="font-semibold theme-text-main">Minimum Price</span> and <span className="font-semibold theme-text-main">Maximum Price</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {matchedCount !== undefined && totalCount !== undefined && (
            <div className="text-[11px] font-mono px-2.5 py-1 rounded-lg theme-bg-card border theme-border theme-text-main shadow-xs">
              <span className="text-amber-700 dark:text-amber-400 font-bold">{matchedCount}</span>
              <span className="theme-text-tertiary"> / {totalCount} matching plots</span>
            </div>
          )}

          {isFilterActive && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition active:scale-95"
              title="Reset price range filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Range</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Preset Buttons */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold theme-text-tertiary uppercase tracking-wider">
          <span>Quick Presets</span>
          <span className="text-[10px] font-normal lowercase opacity-80">one-tap price brackets</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onMinPriceChange(preset.min);
                  onMaxPriceChange(preset.max);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                  isActive
                    ? 'bg-amber-600 dark:bg-amber-500 text-white border-amber-600 shadow-xs font-bold'
                    : 'theme-bg-card theme-text-secondary theme-border hover:theme-text-main hover:theme-bg-hover'
                }`}
              >
                <span>{preset.label}</span>
                {preset.subtitle && (
                  <span className={`text-[10px] ml-1.5 font-mono ${isActive ? 'text-amber-100' : 'theme-text-tertiary'}`}>
                    ({preset.subtitle})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Range Span Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono theme-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-600" />
            <span>Min: {minPrice === '' ? 'Rs. 0' : formatPKR(Number(minPrice)).short}</span>
          </span>
          <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            {minPrice === '' && maxPrice === '' ? (
              'Showing All Prices (Unrestricted)'
            ) : (
              `${minPrice === '' ? 'From 0' : formatPKR(Number(minPrice)).short}  ➔  ${
                maxPrice === '' ? 'No Upper Limit' : formatPKR(Number(maxPrice)).short
              }`
            )}
          </span>
          <span className="flex items-center gap-1">
            <span>Max: {maxPrice === '' ? 'No Limit' : formatPKR(Number(maxPrice)).short}</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="relative h-2.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
          <div
            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 transition-all duration-150"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(2, maxPercent - minPercent)}%`,
            }}
          />
        </div>
      </div>

      {/* Dual Inputs & Range Sliders: 'Minimum Price' and 'Maximum Price' */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {/* Minimum Price Control Card */}
        <div className="theme-bg-card rounded-xl border theme-border p-3.5 space-y-3 theme-shadow">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold theme-text-main flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <TrendingDown className="w-3.5 h-3.5" />
              </span>
              <span>Minimum Price</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                {minPrice !== '' && Number(minPrice) > 0 ? (
                  formatPKR(Number(minPrice)).short
                ) : (
                  <span className="theme-text-tertiary font-normal">Rs. 0 (Min)</span>
                )}
              </span>
              {minPrice !== '' && (
                <button
                  type="button"
                  onClick={() => onMinPriceChange('')}
                  className="text-[10px] theme-text-tertiary hover:text-rose-600 flex items-center gap-0.5"
                  title="Clear minimum price"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Number Input with Currency Prefix */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
              Rs.
            </span>
            <input
              type="number"
              min="0"
              step="100000"
              value={minPrice}
              onChange={(e) => {
                const val = e.target.value;
                onMinPriceChange(val === '' ? '' : Math.max(0, Number(val)));
              }}
              placeholder="0 (No Minimum Price)"
              className="w-full pl-10 pr-3 py-2 theme-bg-subtle border theme-border rounded-lg text-xs theme-text-main font-mono placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Interactive Range Slider for Minimum Price */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono theme-text-tertiary">
              <span>Slider: 0</span>
              <span>Slide Min Price</span>
              <span>Max: {formatPKR(sliderMax).short}</span>
            </div>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={currentMinNum}
              onChange={handleSliderMinChange}
              className="w-full h-2 rounded-lg bg-stone-200 dark:bg-stone-700 accent-amber-600 cursor-pointer"
              aria-label="Minimum Price Slider"
            />
          </div>

          {/* Quick Adjustment Shortcuts */}
          <div className="flex items-center justify-between pt-1 border-t theme-border">
            <span className="text-[10px] theme-text-tertiary">Quick Step:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustMinBy(-500000)}
                className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-main"
                title="Subtract 5 Lac"
              >
                -5L
              </button>
              <button
                type="button"
                onClick={() => adjustMinBy(500000)}
                className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-main"
                title="Add 5 Lac"
              >
                +5L
              </button>
              <button
                type="button"
                onClick={() => adjustMinBy(2500000)}
                className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-main"
                title="Add 25 Lac"
              >
                +25L
              </button>
              <button
                type="button"
                onClick={() => adjustMinBy(10000000)}
                className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-main"
                title="Add 1 Crore"
              >
                +1Cr
              </button>
            </div>
          </div>
        </div>

        {/* Maximum Price Control Card */}
        <div className="theme-bg-card rounded-xl border theme-border p-3.5 space-y-3 theme-shadow">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold theme-text-main flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <span>Maximum Price</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                {maxPrice !== '' && Number(maxPrice) > 0 ? (
                  formatPKR(Number(maxPrice)).short
                ) : (
                  <span className="theme-text-tertiary font-normal">No Limit</span>
                )}
              </span>
              {maxPrice !== '' && (
                <button
                  type="button"
                  onClick={() => onMaxPriceChange('')}
                  className="text-[10px] theme-text-tertiary hover:text-rose-600 flex items-center gap-0.5"
                  title="Clear maximum price"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Number Input with Currency Prefix */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
              Rs.
            </span>
            <input
              type="number"
              min="0"
              step="100000"
              value={maxPrice}
              onChange={(e) => {
                const val = e.target.value;
                onMaxPriceChange(val === '' ? '' : Math.max(0, Number(val)));
              }}
              placeholder="No Limit (Any Price)"
              className="w-full pl-10 pr-3 py-2 theme-bg-subtle border theme-border rounded-lg text-xs theme-text-main font-mono placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Interactive Range Slider for Maximum Price */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono theme-text-tertiary">
              <span>Slider: 0</span>
              <span>Slide Max Price</span>
              <span>Max: {formatPKR(sliderMax).short}</span>
            </div>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={currentMaxNum}
              onChange={handleSliderMaxChange}
              className="w-full h-2 rounded-lg bg-stone-200 dark:bg-stone-700 accent-amber-600 cursor-pointer"
              aria-label="Maximum Price Slider"
            />
          </div>

          {/* Quick Adjustment Shortcuts */}
          <div className="flex items-center justify-between pt-1 border-t theme-border">
            <span className="text-[10px] theme-text-tertiary">Quick Step:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustMaxBy(-500000)}
                className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-main"
                title="Subtract 5 Lac"
              >
                -5L
              </button>
              <button
                type="button"
                onClick={() => adjustMaxBy(500000)}
                className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-main"
                title="Add 5 Lac"
              >
                +5L
              </button>
              <button
                type="button"
                onClick={() => adjustMaxBy(2500000)}
                className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-main"
                title="Add 25 Lac"
              >
                +25L
              </button>
              <button
                type="button"
                onClick={() => adjustMaxBy(10000000)}
                className="px-2 py-0.5 rounded text-[10px] font-mono theme-bg-subtle border theme-border theme-text-secondary hover:theme-text-main"
                title="Add 1 Crore"
              >
                +1Cr
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Validation alert if minPrice > maxPrice */}
      {minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice) && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            Minimum price (Rs. {formatPKR(Number(minPrice)).short}) is greater than Maximum price (Rs. {formatPKR(Number(maxPrice)).short}).
          </span>
          <button
            type="button"
            onClick={() => onMaxPriceChange(minPrice)}
            className="ml-auto underline font-bold"
          >
            Align Bounds
          </button>
        </div>
      )}
    </div>
  );
};
