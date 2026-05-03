import React, { useState } from 'react';
import { Heart, FlaskConical, ChevronDown } from 'lucide-react';
import AdBanner from './AdBanner';

function renderTech(raw) {
  if (!raw) return '';
  const esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .split('\n')
    .map(line => line.startsWith('- ')
      ? `<li class="ml-4 list-disc">${line.slice(2)}</li>`
      : (line.trim() ? `<p>${line}</p>` : ''))
    .join('');
}

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
  const [expandedId, setExpandedId] = useState(null);

  const filtered = (Array.isArray(recipes) ? recipes : Object.values(recipes)).filter(
    r => selectedCategory === 'Wszystkie' || r.category === selectedCategory
  );

  return (
    <div>
      <AdBanner ads={ads} calculatorId="nalewki" />

      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
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

      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        {filtered.map(r => {
          const isFav = favoriteIds.includes(r.id);
          const isExpanded = expandedId === r.id;
          return (
            <div
              key={r.id}
              className="relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(r.id); }}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-xl transition-all"
                aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
              >
                <Heart
                  size={16}
                  strokeWidth={2}
                  className={isFav ? 'text-violet-500' : 'text-[var(--text-dim)] hover:text-violet-500 transition-colors'}
                  fill={isFav ? 'currentColor' : 'none'}
                />
              </button>

              <button
                onClick={() => onSelectRecipe?.(r)}
                className="flex flex-col w-full text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-full aspect-square border-b border-[var(--border)] overflow-hidden bg-[var(--bg)] flex items-center justify-center">
                  {r.imageUrl
                    ? <img src={r.imageUrl} className="w-full h-full object-cover" alt={r.name} />
                    : <FlaskConical size={40} className="text-violet-400 opacity-40" strokeWidth={1.25} />
                  }
                </div>
                <div className="p-2.5">
                  {r.ownerId === 'ADMIN' && (
                    <span className="text-[8px] font-black bg-violet-900/20 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full uppercase inline-block mb-1">
                      ⭐ Wzorzec
                    </span>
                  )}
                  <p className="font-black text-[var(--text)] text-xs leading-tight line-clamp-2">{r.name}</p>
                  <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider mt-0.5">{r.category}</p>
                  {r.calc_final_strength != null && (
                    <p className="text-[9px] font-black text-violet-500 mt-0.5">{Number(r.calc_final_strength).toFixed(1)}%</p>
                  )}
                  {r.spices?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {r.spices.map((s, idx) => (
                        <span key={idx} className="text-[8px] font-black bg-violet-900/20 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                          {s.name} {s.amount} {s.unit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>

              {r.tech && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : r.id); }}
                    className="w-full flex items-center justify-center gap-1 py-1.5 border-t border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--text-dim)] hover:text-violet-400 transition-colors"
                  >
                    Procedura
                    <ChevronDown size={11} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div
                      className="px-3 pb-3 text-[11px] text-[var(--text)] leading-relaxed [&_strong]:font-bold [&_em]:italic [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-1"
                      dangerouslySetInnerHTML={{ __html: renderTech(r.tech) }}
                    />
                  )}
                </>
              )}
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
