import React, { useState } from 'react';
import { Heart, FlaskConical } from 'lucide-react';
import AdBanner from './AdBanner';

const RecipeList = ({
  recipes,
  categories,
  ads,
  user,
  userProfile,
  favoriteIds   = [],
  onSelectRecipe,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');

  const filtered = (Array.isArray(recipes) ? recipes : Object.values(recipes)).filter(
    r => selectedCategory === 'Wszystkie' || r.category === selectedCategory
  );

  return (
    <div>
      <AdBanner ads={ads} calculatorId="nalewki" />

      {/* Filtr kategorii */}
      <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto scrollbar-hide">
        {['Wszystkie', ...categories].map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`flex-none px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${
              selectedCategory === c
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                : 'bg-[var(--bg-card)] text-[var(--text-dim)] border border-[var(--border)]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Siatka kart */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {filtered.map(r => {
          const isFav = favoriteIds.includes(r.id);
          return (
            <div
              key={r.id}
              className="relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden active:scale-[0.97] transition-transform cursor-pointer"
              onClick={() => onSelectRecipe?.(r)}
            >
              {/* Przycisk serca */}
              <button
                onClick={e => { e.stopPropagation(); onToggleFavorite?.(r.id); }}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-xl bg-black/30 backdrop-blur-sm transition-all"
                aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
              >
                <Heart
                  size={15}
                  strokeWidth={2}
                  className={isFav ? 'text-violet-400' : 'text-white/80'}
                  fill={isFav ? 'currentColor' : 'none'}
                />
              </button>

              {/* Badge wzorzec */}
              {r.ownerId === 'ADMIN' && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="text-[8px] font-black bg-violet-600/80 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full uppercase">
                    ⭐ Wzorzec
                  </span>
                </div>
              )}

              {/* Zdjęcie */}
              <div className="w-full aspect-square overflow-hidden bg-[var(--bg)]">
                {r.imageUrl
                  ? <img src={r.imageUrl} className="w-full h-full object-cover" alt={r.name} />
                  : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FlaskConical size={40} className="text-violet-400 opacity-30" strokeWidth={1.25} />
                    </div>
                  )
                }
              </div>

              {/* Nazwa + meta */}
              <div className="p-3">
                <p className="font-black text-[var(--text)] text-sm leading-tight line-clamp-2">{r.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider">{r.category}</p>
                  {r.calc_final_strength != null && (
                    <span className="text-[9px] font-black text-violet-500">{Number(r.calc_final_strength).toFixed(1)}%</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center text-[var(--text-dim)] text-sm font-bold py-16">
            Brak receptur w tej kategorii
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeList;
