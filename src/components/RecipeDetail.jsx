import React from 'react';
import { ArrowLeft, FlaskConical, Pencil, Droplets, Grape, Candy, Clock } from 'lucide-react';

const RecipeDetail = ({ recipe, onBack, onModify, user, userProfile, onEdit }) => {
  if (!recipe) return null;

  const canEdit = userProfile?.isAdmin || recipe.ownerId === user?.uid;

  const techLines = recipe.tech
    ? recipe.tech.split('\n').map(l => l.trim()).filter(Boolean)
    : [];

  const sectionCls = "bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5";
  const labelCls   = "text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4";
  const rowCls     = "flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0";

  return (
    <div className="max-w-lg mx-auto p-4 pb-2 animate-in fade-in duration-300 text-left">

      {/* Nagłówek */}
      <div className="flex items-center gap-3 mt-4 mb-5">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-0.5">{recipe.category}</p>
          <h2 className="text-2xl font-black italic tracking-tighter text-[var(--text)] leading-tight">{recipe.name}</h2>
        </div>
        {canEdit && (
          <button
            onClick={() => onEdit(recipe)}
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-dim)] hover:text-violet-400 transition-colors shrink-0"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {/* Zdjęcie */}
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="w-full h-52 object-cover rounded-2xl mb-4 border border-[var(--border)]"
        />
      )}

      <div className="space-y-4">

        {/* Parametry — 3 kafelki */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Objętość', value: recipe.calc_total_ml ? `${(recipe.calc_total_ml / 1000).toFixed(2)} L` : '—' },
            { label: 'Moc',     value: recipe.calc_final_strength ? `${recipe.calc_final_strength.toFixed(1)}%` : `${recipe.target_strength}%` },
            { label: 'Maceracja', value: `${recipe.maceration_days} dni` },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl text-center">
              <p className="text-[9px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-1">{label}</p>
              <p className="text-base font-black text-violet-500 leading-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* Składniki */}
        <div className={sectionCls}>
          <p className={labelCls}><Grape size={12} className="inline mr-1.5 mb-0.5" />Składniki</p>
          <div className="text-sm space-y-0">

            <div className={rowCls}>
              <span className="font-bold text-[var(--text-dim)]">Spirytus 96%</span>
              <span className="font-black text-[var(--text)]">{recipe.spirit_volume} ml</span>
            </div>

            {(recipe.fruits || []).map((f, i) => (
              <div key={i} className={rowCls}>
                <span className="font-bold text-[var(--text-dim)]">{f.name}</span>
                <span className="font-black text-[var(--text)]">{f.weight_g} g</span>
              </div>
            ))}

            {(recipe.spices || []).filter(s => s.name).map((s, i) => (
              <div key={i} className={rowCls}>
                <span className="font-bold text-[var(--text-dim)]">{s.name}</span>
                <span className="font-black text-[var(--text)]">{s.amount} {s.unit}</span>
              </div>
            ))}

            <div className={rowCls}>
              <span className="font-bold text-[var(--text-dim)]">Cukier</span>
              <span className="font-black text-[var(--text)]">{recipe.sugar_g} g</span>
            </div>
            <div className={rowCls}>
              <span className="font-bold text-[var(--text-dim)]">Woda do syropu</span>
              <span className="font-black text-[var(--text)]">{recipe.water_syrup_ml} ml</span>
            </div>
            <div className={rowCls}>
              <span className="font-bold text-[var(--text-dim)]">Woda do dolania</span>
              <span className="font-black text-violet-500">
                {recipe.calc_water_ml > 0 ? `${Math.round(recipe.calc_water_ml)} ml` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Maceracja i dojrzewanie */}
        <div className={sectionCls}>
          <p className={labelCls}><Clock size={12} className="inline mr-1.5 mb-0.5" />Czas i temperatura</p>
          <div className="text-sm space-y-0">
            <div className={rowCls}>
              <span className="font-bold text-[var(--text-dim)]">Maceracja</span>
              <span className="font-black text-[var(--text)]">{recipe.maceration_days} dni @ {recipe.maceration_temp_c}°C</span>
            </div>
            <div className={rowCls}>
              <span className="font-bold text-[var(--text-dim)]">Dojrzewanie</span>
              <span className="font-black text-[var(--text)]">{recipe.aging_days} dni</span>
            </div>
            <div className={rowCls}>
              <span className="font-bold text-[var(--text-dim)]">Łącznie</span>
              <span className="font-black text-violet-500">{Number(recipe.maceration_days) + Number(recipe.aging_days)} dni</span>
            </div>
          </div>
        </div>

        {/* Procedura wytworzenia */}
        {techLines.length > 0 && (
          <div className={sectionCls}>
            <p className={labelCls}>Procedura wytworzenia</p>
            <div className="text-sm text-[var(--text)] space-y-2 leading-relaxed">
              {techLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Przycisk */}
        <button
          onClick={onModify}
          className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2 text-sm"
        >
          <FlaskConical size={18} /> Zmodyfikuj przepis
        </button>

      </div>
    </div>
  );
};

export default RecipeDetail;
