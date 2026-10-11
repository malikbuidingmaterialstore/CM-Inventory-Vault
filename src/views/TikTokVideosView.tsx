import React from 'react';
import { Property, User } from '../types';
import { Video, ExternalLink, Building2, MapPin, PlusCircle } from 'lucide-react';
import { formatPKR } from '../utils/formatters';

interface TikTokVideosViewProps {
  user: User;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onAddNew: () => void;
}

export const TikTokVideosView: React.FC<TikTokVideosViewProps> = ({
  user: _user,
  properties,
  onSelectProperty,
  onAddNew,
}) => {
  // Filter properties with TikTok links
  const propertiesWithTikTok = properties.filter(
    (p) => p.tiktok_links && p.tiktok_links.length > 0
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold theme-text-main font-brand">
            TikTok Videos & Reels ({propertiesWithTikTok.length})
          </h1>
          <p className="text-xs theme-text-tertiary mt-0.5">
            Direct marketing videos for your housing schemes and plot walk-throughs
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl theme-bg-card border theme-border text-xs font-semibold text-amber-700 dark:text-amber-400 hover:scale-[1.02] transition theme-shadow"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Property with TikTok</span>
        </button>
      </div>

      {propertiesWithTikTok.length === 0 ? (
        <div className="text-center py-16 theme-bg-card rounded-2xl border theme-border p-6 theme-shadow">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center mx-auto mb-3">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold theme-text-main font-brand">
            No TikTok videos attached yet
          </h3>
          <p className="text-xs theme-text-secondary mt-1 max-w-sm mx-auto">
            When adding or editing a property, paste your TikTok video link to make plot walk-throughs accessible here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propertiesWithTikTok.map((prop) => {
            const tiktok = prop.tiktok_links[0];
            const priceInfo = formatPKR(prop.price);
            const hasImages = prop.images && prop.images.length > 0;

            return (
              <div
                key={prop.property_id}
                className="theme-bg-card border theme-border hover:border-pink-500/40 rounded-2xl overflow-hidden theme-shadow flex flex-col justify-between transition-colors"
              >
                {/* Header preview */}
                <div className="relative h-36 bg-stone-900 overflow-hidden">
                  {hasImages ? (
                    <img
                      src={prop.images[0].image_url}
                      alt={prop.society}
                      className="w-full h-full object-cover opacity-70"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-900">
                      <Building2 className="w-10 h-10 text-stone-600" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent flex items-center justify-center">
                    <a
                      href={tiktok.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-lg shadow-pink-600/40 hover:scale-110 active:scale-95 transition"
                      title="Play on TikTok"
                    >
                      <Video className="w-6 h-6 stroke-[2.2]" />
                    </a>
                  </div>

                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-black/75 text-pink-300 border border-pink-500/30">
                      TikTok Linked
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2">
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-black/75 text-amber-300">
                      {priceInfo.short}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{prop.society}</span>
                    </div>

                    <h3 className="text-sm font-bold theme-text-main mt-1">
                      Plot #{prop.plot_number} · {prop.block || prop.phase || 'Main'}
                    </h3>

                    <p className="text-[11px] theme-text-tertiary mt-1 line-clamp-1 font-mono break-all opacity-85">
                      {tiktok.tiktok_url}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t theme-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectProperty(prop)}
                      className="text-xs theme-text-secondary hover:theme-text-main font-medium"
                    >
                      Property Details
                    </button>

                    <a
                      href={tiktok.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch Reel</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
