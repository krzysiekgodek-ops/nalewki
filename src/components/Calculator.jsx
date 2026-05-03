import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Printer, AlertTriangle, FlaskConical, Droplets, Grape, Candy } from 'lucide-react';

const FRUITS = [
  { name: 'Wiśnie',            yield: 65 },
  { name: 'Śliwki',            yield: 58 },
  { name: 'Maliny',            yield: 75 },
  { name: 'Truskawki',         yield: 78 },
  { name: 'Czarna porzeczka',  yield: 65 },
  { name: 'Czerwona porzeczka',yield: 70 },
  { name: 'Agrest',            yield: 68 },
  { name: 'Jabłka',            yield: 80 },
  { name: 'Gruszki',           yield: 75 },
  { name: 'Brzoskwinie',       yield: 68 },
  { name: 'Morele',            yield: 62 },
  { name: 'Pigwa',             yield: 52 },
  { name: 'Jeżyny',            yield: 72 },
  { name: 'Borówki',           yield: 70 },
  { name: 'Żurawina',          yield: 60 },
  { name: 'Winogrona',         yield: 75 },
  { name: 'Inne',              yield: 65 },
];

const SCALE_OPTIONS = [0.25, 0.5, 1, 2, 3, 5];

const DEFAULT_STATE = {
  spirit: 500,
  targetMoc: 40,
  fruits: [{ name: 'Wiśnie', weight: 500, yieldPct: 65 }],
  sugar: 200,
  wSyrup: 100,
  macerationDays: 30,
  macerationTemp: 18,
  agingDays: 30,
  scale: 1,
};

const Calculator = ({ recipe }) => {
  const [state, setState] = useState(() => {
    if (recipe) {
      return {
        spirit: recipe.spirit_volume || DEFAULT_STATE.spirit,
        targetMoc: recipe.target_strength || DEFAULT_STATE.targetMoc,
        fruits: recipe.fruits?.length
          ? recipe.fruits.map(f => ({ name: f.name, weight: f.weight_g, yieldPct: f.juice_yield_pct, _custom: !FRUITS.find(fr => fr.name === f.name) }))
          : DEFAULT_STATE.fruits,
        sugar: recipe.sugar_g || DEFAULT_STATE.sugar,
        wSyrup: recipe.water_syrup_ml || DEFAULT_STATE.wSyrup,
        macerationDays: recipe.maceration_days || DEFAULT_STATE.macerationDays,
        macerationTemp: recipe.maceration_temp_c || DEFAULT_STATE.macerationTemp,
        agingDays: recipe.aging_days || DEFAULT_STATE.agingDays,
        scale: 1,
      };
    }
    return DEFAULT_STATE;
  });

  const set = useCallback((key, val) => setState(s => ({ ...s, [key]: val })), []);

  const addFruit = () =>
    setState(s => ({ ...s, fruits: [...s.fruits, { name: 'Wiśnie', weight: 200, yieldPct: 65, _custom: false }] }));

  const updateFruit = (i, field, val) =>
    setState(s => {
      const fruits = [...s.fruits];
      if (field === '__custom__') {
        fruits[i] = { ...fruits[i], _custom: true, name: '' };
      } else if (field === '_returnToSelect') {
        fruits[i] = { ...fruits[i], _custom: false, name: 'Wiśnie', yieldPct: 65 };
      } else {
        fruits[i] = { ...fruits[i], [field]: val };
        if (field === 'name') {
          const found = FRUITS.find(f => f.name === val);
          if (found) fruits[i].yieldPct = found.yield;
        }
      }
      return { ...s, fruits };
    });

  const removeFruit = (i) =>
    setState(s => ({ ...s, fruits: s.fruits.filter((_, idx) => idx !== i) }));

  // Obliczenia
  const calc = useMemo(() => {
    const { spirit, targetMoc, fruits, sugar, wSyrup, scale } = state;
    const spiritScaled = Number(spirit) * scale;
    const V_alkohol = spiritScaled * 0.96;
    const V_juice   = fruits.reduce((acc, f) => acc + Number(f.weight) * scale * (Number(f.yieldPct) / 100), 0);
    const V_syrup   = Number(sugar) * scale * 0.63 + Number(wSyrup) * scale;
    const mocRatio  = Number(targetMoc) / 100;
    const V_woda    = mocRatio > 0 ? (V_alkohol / mocRatio) - spiritScaled - V_juice - V_syrup : 0;
    const V_total   = spiritScaled + Math.max(0, V_woda) + V_juice + V_syrup;
    const finalMoc  = V_total > 0 ? (V_alkohol / V_total) * 100 : 0;
    const warning   = V_woda < -0.5;

    return { V_alkohol, V_juice, V_syrup, V_woda, V_total, finalMoc, warning, spiritScaled };
  }, [state]);

  // Szacowana data gotowości
  const readyDate = useMemo(() => {
    const totalDays = Number(state.macerationDays) + Number(state.agingDays);
    const d = new Date();
    d.setDate(d.getDate() + totalDays);
    return { totalDays, date: d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) };
  }, [state.macerationDays, state.agingDays]);

  // Objętość syropu (sekcja 3)
  const syrupVol = useMemo(() =>
    (Number(state.sugar) * 0.63 + Number(state.wSyrup)).toFixed(0),
    [state.sugar, state.wSyrup]
  );

  const inputCls = "w-full p-3 border border-[var(--border)] rounded-xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] focus:border-violet-500 outline-none text-sm";
  const smInputCls = "p-3 border border-[var(--border)] rounded-xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none text-sm";
  const labelCls = "block text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-1";
  const sectionCls = "bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5";

  return (
    <div className="max-w-lg mx-auto p-4 pb-2 animate-in fade-in duration-300 text-left">
      <div className="mt-4 mb-5">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--text)]">Kalkulator Nalewek</h2>
        <p className="text-xs text-[var(--text-dim)] mt-1 font-medium">Obliczenia na żywo · skala ×{state.scale}</p>
      </div>

      <div className="space-y-4">

        {/* 1. Baza alkoholowa */}
        <div className={sectionCls}>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4">1. Baza alkoholowa</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Spirytus 96% (ml)</label>
              <input type="number" className={inputCls} value={state.spirit} min={0}
                onChange={e => set('spirit', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Docelowa moc (%)</label>
              <input type="number" className={inputCls} value={state.targetMoc} min={15} max={75}
                onChange={e => set('targetMoc', e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <input type="range" min={15} max={75} value={state.targetMoc}
              onChange={e => set('targetMoc', Number(e.target.value))}
              className="w-full accent-violet-600 h-2 rounded-full cursor-pointer" />
            <div className="flex justify-between text-[9px] text-[var(--text-dim)] font-bold mt-1">
              <span>15%</span><span className="text-violet-500 font-black">{state.targetMoc}%</span><span>75%</span>
            </div>
          </div>
        </div>

        {/* 2. Owoce */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">2. Owoce i macerat</p>
            <button onClick={addFruit}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-violet-700 transition-all">
              <Plus size={12} /> Dodaj owoc
            </button>
          </div>
          <div className="space-y-3">
            {state.fruits.map((f, i) => (
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
                  <button onClick={() => removeFruit(i)}
                    className="p-2 text-[var(--text-dim)] hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input type="number" className={`${smInputCls} w-full pr-6`} value={f.weight} min={0}
                      onChange={e => updateFruit(i, 'weight', e.target.value)} placeholder="g" />
                    <span className="absolute right-2 top-3.5 text-[9px] font-black text-[var(--text-dim)]">g</span>
                  </div>
                  <div className="w-20 relative">
                    <input type="number" className={`${smInputCls} w-full pr-5`} value={f.yieldPct} min={1} max={100}
                      onChange={e => updateFruit(i, 'yieldPct', e.target.value)} />
                    <span className="absolute right-2 top-3.5 text-[9px] font-black text-[var(--text-dim)]">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Słodzenie */}
        <div className={sectionCls}>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4">3. Słodzenie</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls}>Cukier (g)</label>
              <input type="number" className={inputCls} value={state.sugar} min={0}
                onChange={e => set('sugar', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Woda do syropu (ml)</label>
              <input type="number" className={inputCls} value={state.wSyrup} min={0}
                onChange={e => set('wSyrup', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-dim)]">
            <span>Objętość syropu:</span>
            <span className="text-violet-500 font-black">{syrupVol} ml</span>
          </div>
        </div>

        {/* 4. Maceracja */}
        <div className={sectionCls}>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4">4. Maceracja i dojrzewanie</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className={labelCls}>Maceracja (dni)</label>
              <input type="number" className={inputCls} value={state.macerationDays} min={1}
                onChange={e => set('macerationDays', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Temp. (°C)</label>
              <input type="number" className={inputCls} value={state.macerationTemp} min={0} max={30}
                onChange={e => set('macerationTemp', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Dojrzewanie (dni)</label>
              <input type="number" className={inputCls} value={state.agingDays} min={0}
                onChange={e => set('agingDays', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs">
            <div className="flex justify-between font-bold text-[var(--text-dim)]">
              <span>Łączny czas:</span>
              <span className="text-[var(--text)] font-black">{readyDate.totalDays} dni</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--text-dim)]">
              <span>Szacowana data gotowości:</span>
              <span className="text-violet-500 font-black">{readyDate.date}</span>
            </div>
          </div>
        </div>

        {/* 5. Skalowanie */}
        <div className={sectionCls}>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-3">5. Skalowanie receptury</p>
          <div className="flex flex-wrap gap-2">
            {SCALE_OPTIONS.map(s => (
              <button key={s} onClick={() => set('scale', s)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                  state.scale === s
                    ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-900/30'
                    : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-dim)] hover:border-violet-600'
                }`}>
                ×{s}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Wyniki */}
        <div className={`${sectionCls} border-violet-500/30`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">6. Wyniki</p>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-dim)] rounded-xl text-[10px] font-black uppercase hover:text-[var(--text)] transition-all">
              <Printer size={12} /> Drukuj
            </button>
          </div>

          {calc.warning && (
            <div className="flex items-center gap-2 p-3 bg-orange-900/20 border border-orange-500/30 rounded-xl mb-4 text-xs font-bold text-orange-400">
              <AlertTriangle size={15} className="shrink-0" />
              Zmniejsz moc docelową lub dodaj mniej spirytusu
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Woda do dolania', value: calc.V_woda < 0 ? '—' : `${calc.V_woda.toFixed(0)} ml`, highlight: !calc.warning },
              { label: 'Objętość całkowita', value: `${(calc.V_total / 1000).toFixed(3)} L`, highlight: true },
              { label: 'Faktyczna moc', value: `${calc.finalMoc.toFixed(1)}%`, highlight: true },
              { label: 'Czysty alkohol', value: `${calc.V_alkohol.toFixed(0)} ml` },
              { label: 'Sok z owoców', value: `${calc.V_juice.toFixed(0)} ml` },
              { label: 'Objętość syropu', value: `${calc.V_syrup.toFixed(0)} ml` },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                <p className="text-[9px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-1">{label}</p>
                <p className={`text-lg font-black ${highlight ? 'text-violet-500' : 'text-[var(--text)]'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Pasek składu */}
          {calc.V_total > 0 && !calc.warning && (
            <div>
              <p className="text-[9px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-2">Skład objętościowy</p>
              <div className="flex h-6 rounded-xl overflow-hidden border border-[var(--border)]">
                {[
                  { val: calc.spiritScaled, color: 'bg-violet-600', label: 'Spirytus' },
                  { val: Math.max(0, calc.V_woda), color: 'bg-blue-500', label: 'Woda' },
                  { val: calc.V_juice, color: 'bg-pink-500', label: 'Sok' },
                  { val: calc.V_syrup, color: 'bg-green-500', label: 'Syrop' },
                ].filter(s => s.val > 0).map(({ val, color, label }) => (
                  <div
                    key={label}
                    className={`${color} flex items-center justify-center transition-all`}
                    style={{ width: `${(val / calc.V_total) * 100}%` }}
                    title={`${label}: ${val.toFixed(0)} ml`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {[
                  { color: 'bg-violet-600', label: `Spirytus ${((calc.spiritScaled / calc.V_total) * 100).toFixed(0)}%` },
                  { color: 'bg-blue-500',   label: `Woda ${((Math.max(0, calc.V_woda) / calc.V_total) * 100).toFixed(0)}%` },
                  { color: 'bg-pink-500',   label: `Sok ${((calc.V_juice / calc.V_total) * 100).toFixed(0)}%` },
                  { color: 'bg-green-500',  label: `Syrop ${((calc.V_syrup / calc.V_total) * 100).toFixed(0)}%` },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                    <span className="text-[9px] font-bold text-[var(--text-dim)]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print container */}
      <div className="print-container hidden">
        <h1 style={{ fontFamily: 'serif', fontWeight: 900, fontSize: '1.5rem', marginBottom: '1rem' }}>
          Nalewkarz Master — Kalkulator Nalewek
        </h1>
        <p><strong>Spirytus 96%:</strong> {state.spirit} ml × {state.scale}</p>
        <p><strong>Docelowa moc:</strong> {state.targetMoc}%</p>
        <p><strong>Owoce:</strong> {state.fruits.map(f => `${f.name} ${f.weight}g (${f.yieldPct}%)`).join(', ')}</p>
        <p><strong>Cukier:</strong> {state.sugar}g | <strong>Woda do syropu:</strong> {state.wSyrup}ml</p>
        <p><strong>Maceracja:</strong> {state.macerationDays} dni @ {state.macerationTemp}°C | <strong>Dojrzewanie:</strong> {state.agingDays} dni</p>
        <hr style={{ margin: '1rem 0' }} />
        <p><strong>Woda do dolania:</strong> {calc.V_woda < 0 ? '—' : `${calc.V_woda.toFixed(0)} ml`}</p>
        <p><strong>Objętość całkowita:</strong> {(calc.V_total / 1000).toFixed(3)} L</p>
        <p><strong>Faktyczna moc:</strong> {calc.finalMoc.toFixed(1)}%</p>
        <p><strong>Czysty alkohol:</strong> {calc.V_alkohol.toFixed(0)} ml</p>
        <p><strong>Sok z owoców:</strong> {calc.V_juice.toFixed(0)} ml</p>
        <p><strong>Objętość syropu:</strong> {calc.V_syrup.toFixed(0)} ml</p>
        <p><strong>Gotowe ok.:</strong> {readyDate.date}</p>
      </div>
    </div>
  );
};

export default Calculator;
