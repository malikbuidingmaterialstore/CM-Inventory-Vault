import React, { useState } from 'react';
import { Property, PropertyImage, User } from '../types';
import { 
  Camera, 
  Building2, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  X, 
  Trash2
} from 'lucide-react';

interface ImageGalleryViewProps {
  user: User;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onAddImagesToProperty: (propertyId: string, images: PropertyImage[]) => Promise<void>;
  onDeleteImage: (propertyId: string, imageId: string) => Promise<void>;
}

export const ImageGalleryView: React.FC<ImageGalleryViewProps> = ({
  user: _user,
  properties,
  onSelectProperty,
  onAddImagesToProperty: _onAddImagesToProperty,
  onDeleteImage,
}) => {
  const [activePropertyId, setActivePropertyId] = useState<string>('all');
  const [selectedLightbox, setSelectedLightbox] = useState<{
    property: Property;
    imageIndex: number;
  } | null>(null);

  // Filter properties with images
  const propertiesWithImages = properties.filter((p) => p.images && p.images.length > 0);

  // All images flattened or filtered
  const displayProperties = activePropertyId === 'all'
    ? propertiesWithImages
    : properties.filter((p) => p.property_id === activePropertyId);

  let totalImagesCount = 0;
  properties.forEach((p) => { if (p.images) totalImagesCount += p.images.length; });

  const handleNextInLightbox = () => {
    if (!selectedLightbox) return;
    const { property, imageIndex } = selectedLightbox;
    const nextIndex = (imageIndex + 1) % property.images.length;
    setSelectedLightbox({ property, imageIndex: nextIndex });
  };

  const handlePrevInLightbox = () => {
    if (!selectedLightbox) return;
    const { property, imageIndex } = selectedLightbox;
    const prevIndex = (imageIndex - 1 + property.images.length) % property.images.length;
    setSelectedLightbox({ property, imageIndex: prevIndex });
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold theme-text-main font-brand">
            Property Image Gallery ({totalImagesCount})
          </h1>
          <p className="text-xs theme-text-tertiary mt-0.5">
            Full-resolution housing photos stored locally and backed up to cloud
          </p>
        </div>

        {/* Filter by property pill list */}
        {properties.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActivePropertyId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                activePropertyId === 'all'
                  ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                  : 'theme-bg-subtle theme-text-secondary theme-border hover:theme-bg-hover'
              }`}
            >
              All Properties ({totalImagesCount})
            </button>
            {properties.map((p) => (
              <button
                key={p.property_id}
                onClick={() => setActivePropertyId(p.property_id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                  activePropertyId === p.property_id
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                    : 'theme-bg-subtle theme-text-secondary theme-border hover:theme-bg-hover'
                }`}
              >
                {p.society} #{p.plot_number} ({p.images ? p.images.length : 0})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery content grouped by Property */}
      {displayProperties.length === 0 ? (
        <div className="text-center py-16 theme-bg-card rounded-2xl border theme-border p-6 theme-shadow">
          <Camera className="w-12 h-12 theme-text-tertiary mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold theme-text-main font-brand">No pictures available</h3>
          <p className="text-xs theme-text-secondary mt-1 max-w-sm mx-auto">
            You haven't uploaded pictures for this property yet. Open any property details or click below to add pictures.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {displayProperties.map((prop) => (
            <div
              key={prop.property_id}
              className="theme-bg-card border theme-border rounded-3xl p-5 sm:p-6 theme-shadow space-y-4"
            >
              {/* Property Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b theme-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold theme-text-main font-brand">
                      {prop.society} · {prop.phase ? `${prop.phase} · ` : ''}{prop.block ? `${prop.block} · ` : ''}Plot #{prop.plot_number}
                    </h2>
                    <div className="text-[11px] theme-text-secondary">
                      {prop.plot_size} · {prop.plot_type} · {prop.images.length} Photos
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectProperty(prop)}
                    className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-semibold px-3 py-1.5 rounded-lg theme-bg-subtle border theme-border transition hover:scale-[1.02]"
                  >
                    View Details &rarr;
                  </button>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {prop.images.map((img, idx) => (
                  <div
                    key={img.image_id || idx}
                    onClick={() => setSelectedLightbox({ property: prop, imageIndex: idx })}
                    className="relative group rounded-2xl overflow-hidden theme-bg-subtle border theme-border aspect-[4/3] cursor-pointer shadow-sm"
                  >
                    <img
                      src={img.image_url}
                      alt={`${prop.society} Plot ${prop.plot_number} Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Hover overlay with zoom icon */}
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-6 h-6 text-white" />
                    </div>

                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur text-[10px] font-mono text-stone-100">
                      Image {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4 animate-in fade-in select-none">
          <button
            onClick={() => setSelectedLightbox(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-stone-800/90 text-stone-100 hover:bg-stone-700 transition z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Delete Button */}
          <button
            onClick={async () => {
              const { property, imageIndex } = selectedLightbox;
              const img = property.images[imageIndex];
              await onDeleteImage(property.property_id, img.image_id);
              if (property.images.length <= 1) {
                setSelectedLightbox(null);
              } else {
                setSelectedLightbox({
                  property,
                  imageIndex: Math.max(0, imageIndex - 1),
                });
              }
            }}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-600 transition z-10 flex items-center gap-1.5 text-xs font-semibold px-3"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Photo</span>
          </button>

          {/* Prev */}
          {selectedLightbox.property.images.length > 1 && (
            <button
              onClick={handlePrevInLightbox}
              className="absolute left-4 p-3 rounded-full bg-stone-800/90 text-white hover:bg-stone-700 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image & Title */}
          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={selectedLightbox.property.images[selectedLightbox.imageIndex].image_url}
              alt="Full view"
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="mt-3 text-xs font-mono text-stone-200 bg-stone-900/90 px-4 py-1.5 rounded-full border border-stone-800 text-center">
              <span className="text-amber-400 font-bold">{selectedLightbox.property.society}</span> · Plot #{selectedLightbox.property.plot_number} · Photo {selectedLightbox.imageIndex + 1} of {selectedLightbox.property.images.length}
            </div>
          </div>

          {/* Next */}
          {selectedLightbox.property.images.length > 1 && (
            <button
              onClick={handleNextInLightbox}
              className="absolute right-4 p-3 rounded-full bg-stone-800/90 text-white hover:bg-stone-700 transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
