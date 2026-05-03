import React, { useState } from 'react';
import { doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db, COL_RECIPES } from '../firebase';
import { Edit3, Trash2, Heart, Plus, FlaskConical, Lock, ChevronDown } from 'lucide-react';

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

const DEFAULT_PLANS = {
  free:  { name: 'Free',  limit: 2   },
  mini:  { name: 'Mini',  limit: 10  },
  midi:  { name: 'Midi',  limit: 20  },
  maxi:  { name: 'Maxi',  limit: 30  },
  max:   { name: 'Max',   limit: 30  },
  vip:   { name: 'VIP',   limit: 100 },
};

const RecipeRow = ({ recipe, user, userProfile, onSelectRecipe, onOpenRecipeModal, onToggleFavorite, showFav }) => {
  const isAdminRecipe = recipe.ownerId === 'ADMIN';
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Usunąć recepturę?')) return;
    await deleteDoc(doc(db, COL_RECIPES, recipe.id));
    await updateDoc(doc(db, 'users', user.uid), { recipeCount: increment(-1) });
  };

  return (
    <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] overflow-hidden">
      {isAdminRecipe && (
        <span className="absolute -top-2 left-4 bg-violet-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm">
          <Heart size={8} fill="currentColor" /> Ulubiona
        </span>
      )}

      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-input)] transition-all"
        onClick={() => onSelectRecipe?.(recipe)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
            {recipe.imageUrl
              ? <img src={recipe.imageUrl} className="w-full h-full object-cover" alt="" />
              : <FlaskConical className="text-violet-400 opacity-60" size={20} />}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[var(--text)] truncate text-sm">{recipe.name}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{recipe.category}</span>
              {recipe.calc_final_strength != null && (
                <span className="text-[10px] font-black text-violet-500">{Number(recipe.calc_final_strength).toFixed(1)}%</span>
              )}
            </div>
            {recipe.spices?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {recipe.spices.map((s, idx) => (
                  <span key={idx} className="text-[8px] font-black bg-violet-900/20 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                    {s.name} {s.amount} {s.unit}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {showFav && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(recipe.id); }}
              className="p-2 rounded-xl transition-all text-violet-500 hover:bg-violet-900/20"
              title="Usuń z ulubionych"
            >
              <Heart size={16} fill="currentColor" />
            </button>
          )}
          {recipe.ownerId === user?.uid && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenRecipeModal?.(recipe); }}
                className="p-2 text-[var(--text-dim)] hover:text-violet-500 rounded-xl transition-all"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-[var(--text-dim)] hover:text-red-500 rounded-xl transition-all"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {recipe.tech && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-center gap-1 py-1.5 border-t border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--text-dim)] hover:text-violet-400 transition-colors"
          >
            Procedura
            <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <div
              className="px-4 pb-3 text-[11px] text-[var(--text)] leading-relaxed [&_strong]:font-bold [&_em]:italic [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-1"
              dangerouslySetInnerHTML={{ __html: renderTech(recipe.tech) }}
            />
          )}
        </>
      )}
    </div>
  );
};

const MyRecipes = ({
  user,
  userProfile,
  myRecipes      = [],
  favoriteRecipes= [],
  favoriteIds    = [],
  plans,
  onSelectRecipe,
  onOpenRecipeModal,
  onToggleFavorite,
}) => {
  const effectivePlan = userProfile?.isTrialActive ? 'vip' : (userProfile?.plan || 'free');
  const planSource    = plans?.food ?? DEFAULT_PLANS;
  const planData      = planSource[effectivePlan] ?? DEFAULT_PLANS.free;
  const recipeLimit   = planData.limit;
  const canAdd        = myRecipes.length < recipeLimit;

  return (
    <main className="max-w-lg mx-auto p-4 animate-in fade-in duration-300 text-left">

      <div className="mt-4 mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--text)]">Moje receptury</h2>
          <p className="text-xs text-[var(--text-dim)] mt-1 font-medium">
            {myRecipes.length} / {recipeLimit} receptur
          </p>
        </div>
        {canAdd ? (
          <button
            onClick={() => onOpenRecipeModal?.(null)}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-violet-700 transition-all"
          >
            <Plus size={14} /> Dodaj
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-black text-violet-400 uppercase bg-violet-900/20 px-3 py-2 rounded-xl border border-violet-900/30">
            <Lock size={10} /> Limit osiągnięty
          </span>
        )}
      </div>

      {myRecipes.length === 0 ? (
        <div className="text-center py-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] mb-6">
          <FlaskConical size={36} className="mx-auto mb-3 text-violet-400 opacity-40" strokeWidth={1.25} />
          <p className="font-bold text-sm text-[var(--text-dim)] uppercase">Nie masz jeszcze receptur</p>
          {canAdd && (
            <button
              onClick={() => onOpenRecipeModal?.(null)}
              className="mt-4 text-violet-500 font-black text-xs uppercase underline underline-offset-4"
            >
              Dodaj pierwszą
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {myRecipes.map(r => (
            <RecipeRow key={r.id} recipe={r} user={user} userProfile={userProfile}
              onSelectRecipe={onSelectRecipe} onOpenRecipeModal={onOpenRecipeModal}
              onToggleFavorite={onToggleFavorite} />
          ))}
        </div>
      )}

      {favoriteRecipes.length > 0 && (
        <>
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--text)] flex items-center gap-2 mb-4 mt-6">
            <Heart size={16} className="text-violet-500" fill="currentColor" /> Ulubione receptury
          </h3>
          <div className="space-y-3">
            {favoriteRecipes.map(r => (
              <RecipeRow key={r.id} recipe={r} user={user} userProfile={userProfile}
                onSelectRecipe={onSelectRecipe} onOpenRecipeModal={onOpenRecipeModal}
                onToggleFavorite={onToggleFavorite} showFav />
            ))}
          </div>
        </>
      )}

      {favoriteRecipes.length === 0 && (
        <div className="mt-3 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] text-center">
          <Heart size={22} className="mx-auto mb-2 text-[var(--text-dim)]" />
          <p className="text-[11px] font-black text-[var(--text-dim)] uppercase tracking-widest">
            Dodaj ulubione klikając serduszko w zakładce Receptury
          </p>
        </div>
      )}
    </main>
  );
};

export default MyRecipes;
