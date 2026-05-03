import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Upload } from 'lucide-react';
import { MYDEVIL_URL } from '../firebase';

const FRUITS = [
  { name: 'Wiśnie',             yield: 65 },
  { name: 'Śliwki',             yield: 58 },
  { name: 'Maliny',             yield: 75 },
  { name: 'Truskawki',          yield: 78 },
  { name: 'Czarna porzeczka',   yield: 65 },
  { name: 'Czerwona porzeczka', yield: 70 },
  { name: 'Agrest',             yield: 68 },
  { name: 'Jabłka',             yield: 80 },
  { name: 'Gruszki',            yield: 75 },
  { name: 'Brzoskwinie',        yield: 68 },
  { name: 'Morele',             yield: 62 },
  { name: 'Pigwa',              yield: 52 },
  { name: 'Jeżyny',             yield: 72 },
  { name: 'Borówki',            yield: 70 },
  { name: 'Żurawina',           yield: 60 },
  { name: 'Winogrona',          yield: 75 },
  { name: 'Inne',               yield: 65 },
];

const SPICES_PRESETS = [
  { name: 'Goździki',           amount: 5,   unit: 'szt'    },
  { name: 'Cynamon',            amount: 1,   unit: 'laska'  },
  { name: 'Wanilia',            amount: 0.5, unit: 'laski'  },
  { name: 'Kardamon',           amount: 3,   unit: 'ziaren' },
  { name: 'Ziele angielskie',   amount: 4,   unit: 'ziaren' },
  { name: 'Pieprz czarny',      amount: 5,   unit: 'ziaren' },
  { name: 'Anyż gwiazdkowy',    amount: 1,   unit: 'szt'    },
  { name: 'Jałowiec',           amount: 5,   unit: 'jagód'  },
  { name: 'Liść laurowy',       amount: 2,   unit: 'liści'  },
  { name: 'Imbir (suszony)',    amount: 5,   unit: 'g'      },
  { name: 'Skórka cytryny',     amount: 10,  unit: 'g'      },
  { name: 'Skórka pomarańczy',  amount: 10,  unit: 'g'      },
  { name: 'Kolendra',           amount: 5,   unit: 'ziaren' },
];

const SPICE_UNITS = ['szt', 'g', 'łyżeczka', 'laska', 'laski', 'jagód', 'liści', 'ziaren'];

const initFruit  = (f) => ({ ...f, _custom: !FRUITS.find(fr => fr.name === f.name) });
const initSpice  = (s) => ({ ...s, _custom: !SPICES_PRESETS.find(sp => sp.name === s.name) });

const EMPTY_RECIPE = {
  name: '',
  category: '',
  spirit_volume: 500,
  target_strength: 40,
  fruits: [{ name: 'Wiśnie', weight_g: 500, juice_yield_pct: 65, _custom: false }],
  spices: [],
  sugar_g: 200,
  water_syrup_ml: 100,
  maceration_days: 30,
  maceration_temp_c: 18,
  aging_days: 30,
  imageUrl: '',
  tech: '',
};

const RecipeModal = ({ user, categories, initialRecipe, onClose, onSave, recipeCount = 0, recipeLimit = Infinity }) => {
  const isNew = !initialRecipe?.id;
  const overLimit = isNew && recipeCount >= recipeLimit;

  const [form, setForm] = useState(() => {
    if (!initialRecipe) return EMPTY_RECIPE;
    return {
      ...EMPTY_RECIPE,
      ...initialRecipe,
      fruits: Array.isArray(initialRecipe.fruits) && initialRecipe.fruits.length > 0
        ? initialRecipe.fruits.map(initFruit)
        : EMPTY_RECIPE.fruits,
      spices: Array.isArray(initialRecipe.spices) && initialRecipe.spices.length > 0
        ? initialRecipe.spices.map(initSpice)
        : EMPTY_RECIPE.spices,
    };
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!user) return alert("Musisz być zalogowany.");
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return alert("Dozwolone formaty: JPG, PNG, WEBP.");
    if (file.size > 5 * 1024 * 1024) return alert("Maks. rozmiar: 5 MB.");
    setIsUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res  = await fetch(MYDEVIL_URL, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, imageUrl: data.url }));
    } catch { alert("Błąd uploadu."); } finally { setIsUploading(false); }
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // --- Fruits ---
  const updateFruit = (i, field, val) => {
    const fruits = [...form.fruits];
    if (field === '__custom__') {
      fruits[i] = { ...fruits[i], _custom: true, name: '' };
    } else if (field === '_returnToSelect') {
      fruits[i] = { ...fruits[i], _custom: false, name: 'Wiśnie', juice_yield_pct: 65 };
    } else {
      fruits[i] = { ...fruits[i], [field]: val };
      if (field === 'name') {
        const found = FRUITS.find(f => f.name === val);
        if (found) fruits[i].juice_yield_pct = found.yield;
      }
    }
    setForm(f => ({ ...f, fruits }));
  };
  const addFruit    = () => setForm(f => ({ ...f, fruits: [...f.fruits, { name: 'Wiśnie', weight_g: 200, juice_yield_pct: 65, _custom: false }] }));
  const removeFruit = (i) => setForm(f => ({ ...f, fruits: f.fruits.filter((_, idx) => idx !== i) }));

  // --- Spices ---
  const updateSpice = (i, field, val) => {
    const spices = [...form.spices];
    if (field === '__custom__') {
      spices[i] = { ...spices[i], _custom: true, name: '' };
    } else if (field === '_returnToSelect') {
      spices[i] = { ...spices[i], _custom: false, name: '' };
    } else if (field === 'selectName') {
      const preset = SPICES_PRESETS.find(sp => sp.name === val);
      spices[i] = { ...spices[i], name: val, amount: preset ? preset.amount : spices[i].amount, unit: preset ? preset.unit : spices[i].unit };
    } else {
      spices[i] = { ...spices[i], [field]: val };
    }
    setForm(f => ({ ...f, spices }));
  };
  const addSpice    = () => setForm(f => ({ ...f, spices: [...f.spices, { name: '', amount: 1, unit: 'szt', _custom: false }] }));
  const removeSpice = (i) => setForm(f => ({ ...f, spices: f.spices.filter((_, idx) => idx !== i) }));

  const handleSave = () => {
    if (overLimit) return;
    // eslint-disable-next-line no-unused-vars
    const cleanFruits = form.fruits.map(({ _custom, ...f }) => f);
    // eslint-disable-next-line no-unused-vars
    const cleanSpices = form.spices.map(({ _custom, ...s }) => s);
    onSave({ ...form, fruits: cleanFruits, spices: cleanSpices });
  };

  const inputCls  = "w-full p-4 border border-[var(--border)] rounded-2xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] focus:border-violet-500 outline-none text-sm";
  const smInputCls = "p-3 border border-[var(--border)] rounded-xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none text-sm";
  const labelCls  = "block text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-1 ml-1";

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in zoom-in-95 duration-200"
      style={{ background: 'var(--bg-overlay)' }}
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-[var(--bg-input)] text-[var(--text-dim)] hover:text-[var(--text)] rounded-full transition-colors">
          <X />
        </button>
        <h2 className="text-2xl font-black uppercase mb-6 italic text-left leading-none tracking-tighter text-[var(--text)]">
          {isNew ? 'Nowa receptura' : 'Edytuj recepturę'}
        </h2>

        <div className="space-y-4 text-left">

          {/* Nazwa */}
          <div>
            <label className={labelCls}>Nazwa nalewki</label>
            <input placeholder="Np. Wiśniówka domowa" className={inputCls} value={form.name}
              onChange={e => setField('name', e.target.value)} />
          </div>

          {/* Kategoria */}
          <div>
            <label className={labelCls}>Kategoria</label>
            <select className={`${inputCls} cursor-pointer`} value={form.category}
              onChange={e => setField('category', e.target.value)}>
              <option value="">Wybierz...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Baza alkoholowa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Spirytus 96% (ml)</label>
              <input type="number" className={inputCls} value={form.spirit_volume} min={0}
                onChange={e => setField('spirit_volume', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Docelowa moc (%)</label>
              <input type="number" className={inputCls} value={form.target_strength} min={15} max={75}
                onChange={e => setField('target_strength', Number(e.target.value))} />
            </div>
          </div>

          {/* Owoce */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>Owoce</label>
              <button onClick={addFruit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-violet-700 transition-all">
                <Plus size={12} /> Dodaj
              </button>
            </div>
            <div className="space-y-2">
              {form.fruits.map((f, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex gap-2 items-center">
                    {f._custom ? (
                      <>
                        <input className={`flex-1 ${smInputCls}`} placeholder="Nazwa owocu..."
                          value={f.name} onChange={e => updateFruit(i, 'name', e.target.value)} />
                        <button onClick={() => updateFruit(i, '_returnToSelect', null)}
                          title="Wróć do listy"
                          className="px-3 py-3 text-xs font-black text-[var(--text-dim)] hover:text-violet-400 border border-[var(--border)] rounded-xl transition-colors">
                          ↩
                        </button>
                      </>
                    ) : (
                      <select className={`flex-1 ${smInputCls}`} value={f.name}
                        onChange={e => e.target.value === '__custom__'
                          ? updateFruit(i, '__custom__', null)
                          : updateFruit(i, 'name', e.target.value)}>
                        {FRUITS.map(fr => <option key={fr.name} value={fr.name}>{fr.name}</option>)}
                        <option disabled value="">──────────────</option>
                        <option value="__custom__">✏️ Własny owoc...</option>
                      </select>
                    )}
                    <button onClick={() => removeFruit(i)} className="text-[var(--text-dim)] hover:text-red-500 transition-colors shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input type="number" className={`${smInputCls} w-full pr-5`} value={f.weight_g} min={0}
                        onChange={e => updateFruit(i, 'weight_g', Number(e.target.value))} />
                      <span className="absolute right-2 top-3.5 text-[9px] font-black text-[var(--text-dim)]">g</span>
                    </div>
                    <div className="w-20 relative">
                      <input type="number" className={`${smInputCls} w-full pr-5`} value={f.juice_yield_pct} min={1} max={100}
                        onChange={e => updateFruit(i, 'juice_yield_pct', Number(e.target.value))} />
                      <span className="absolute right-2 top-3.5 text-[9px] font-black text-[var(--text-dim)]">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Przyprawy i dodatki */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>Przyprawy i dodatki</label>
              <button onClick={addSpice}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-violet-700 transition-all">
                <Plus size={12} /> Dodaj
              </button>
            </div>
            {form.spices.length === 0 ? (
              <p className="text-[10px] text-[var(--text-dim)] ml-1 font-bold">Brak — opcjonalne</p>
            ) : (
              <div className="space-y-3">
                {form.spices.map((s, i) => {
                  const preset = SPICES_PRESETS.find(sp => sp.name === s.name);
                  const hint   = preset ? (form.spirit_volume / 1000 * preset.amount).toFixed(1) : null;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex gap-2 items-center">
                        {s._custom ? (
                          <>
                            <input className={`flex-1 ${smInputCls}`} placeholder="Nazwa przyprawy..."
                              value={s.name} onChange={e => updateSpice(i, 'name', e.target.value)} />
                            <button onClick={() => updateSpice(i, '_returnToSelect', null)}
                              title="Wróć do listy"
                              className="px-3 py-3 text-xs font-black text-[var(--text-dim)] hover:text-violet-400 border border-[var(--border)] rounded-xl transition-colors">
                              ↩
                            </button>
                          </>
                        ) : (
                          <select className={`flex-1 ${smInputCls}`} value={s.name}
                            onChange={e => e.target.value === '__custom__'
                              ? updateSpice(i, '__custom__', null)
                              : updateSpice(i, 'selectName', e.target.value)}>
                            <option value="">Wybierz...</option>
                            {SPICES_PRESETS.map(sp => <option key={sp.name} value={sp.name}>{sp.name}</option>)}
                            <option disabled value="">──────────────</option>
                            <option value="__custom__">✏️ Własna przyprawa...</option>
                          </select>
                        )}
                        <button onClick={() => removeSpice(i)} className="text-[var(--text-dim)] hover:text-red-500 transition-colors shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input type="number" step="0.5" min={0}
                            className={`w-24 ${smInputCls}`}
                            value={s.amount}
                            onChange={e => updateSpice(i, 'amount', Number(e.target.value))} />
                          {hint && (
                            <span className="text-[10px] text-[var(--text-dim)] font-bold whitespace-nowrap">
                              (≈ {hint} {preset.unit})
                            </span>
                          )}
                        </div>
                        <select className={`w-28 ${smInputCls}`} value={s.unit}
                          onChange={e => updateSpice(i, 'unit', e.target.value)}>
                          {SPICE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Słodzenie */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cukier (g)</label>
              <input type="number" className={inputCls} value={form.sugar_g} min={0}
                onChange={e => setField('sugar_g', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Woda do syropu (ml)</label>
              <input type="number" className={inputCls} value={form.water_syrup_ml} min={0}
                onChange={e => setField('water_syrup_ml', Number(e.target.value))} />
            </div>
          </div>

          {/* Maceracja */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Maceracja (dni)</label>
              <input type="number" className={inputCls} value={form.maceration_days} min={1}
                onChange={e => setField('maceration_days', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Temp. (°C)</label>
              <input type="number" className={inputCls} value={form.maceration_temp_c} min={0} max={30}
                onChange={e => setField('maceration_temp_c', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Dojrzewanie (dni)</label>
              <input type="number" className={inputCls} value={form.aging_days} min={0}
                onChange={e => setField('aging_days', Number(e.target.value))} />
            </div>
          </div>

          {/* Procedura wytworzenia */}
          <div>
            <label className={labelCls}>Procedura wytworzenia (opcjonalnie)</label>
            <textarea
              rows={6}
              placeholder={'1. Umyj i wypestkuj owoce...\n2. Zalej spirytusem w słoju...\n3. Maceruj przez X dni w temp. Y°C...\n4. Odcedź owoce, dodaj syrop cukrowy...\n5. Odstawiaj do dojrzewania przez X dni...'}
              className={`${inputCls} resize-y`}
              value={form.tech}
              onChange={e => setField('tech', e.target.value)}
            />
          </div>

          {/* Zdjęcie */}
          <div className="bg-[var(--bg)] p-5 rounded-[2rem] border border-dashed border-[var(--border)] text-center min-h-[100px] flex items-center justify-center relative overflow-hidden">
            {form.imageUrl ? (
              <>
                <img src={form.imageUrl} className="w-full h-28 object-cover rounded-2xl" alt="Podgląd" />
                <button onClick={() => setField('imageUrl', '')} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg"><X size={12} /></button>
              </>
            ) : (
              <label className="cursor-pointer w-full text-[var(--text-dim)]">
                <Upload size={32} className="mx-auto mb-2 opacity-30" />
                <span className="text-[9px] font-black uppercase tracking-widest">{isUploading ? 'Wgrywanie...' : 'Wgraj zdjęcie'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
              </label>
            )}
          </div>
        </div>

        {overLimit && (
          <p className="mt-6 text-center text-sm font-bold text-red-500">
            Osiągnięto limit {recipeLimit} receptur. Kup wyższy plan, aby dodać więcej.
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={overLimit}
          className={`w-full mt-5 py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl transition-all ${
            overLimit
              ? 'bg-[var(--bg-input)] text-[var(--text-dim)] cursor-not-allowed'
              : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95'
          }`}
        >
          <Save className="inline mr-2" size={16} /> Zapisz recepturę
        </button>
      </div>
    </div>
  );
};

export default RecipeModal;
