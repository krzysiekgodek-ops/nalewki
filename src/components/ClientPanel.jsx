import React from 'react';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Power, Lock, CheckCircle2, LayoutDashboard, Star, FlaskConical } from 'lucide-react';
import { STRIPE_PLANS } from '../stripe';

const DEFAULT_PLANS = {
  free: { name: 'Free',  limit: 2   },
  mini: { name: 'Mini',  limit: 10  },
  midi: { name: 'Midi',  limit: 20  },
  maxi: { name: 'Maxi',  limit: 30  },
  max:  { name: 'Max',   limit: 30  },
  vip:  { name: 'VIP',   limit: 100 },
};

const ClientPanel = ({
  user,
  userProfile,
  myRecipes   = [],
  plans,
  setActiveTab,
}) => {
  const effectivePlan = userProfile?.isTrialActive ? 'vip' : (userProfile?.plan || 'free');
  const planSource    = plans?.food ?? DEFAULT_PLANS;
  const planData      = planSource[effectivePlan] ?? DEFAULT_PLANS.free;
  const recipeLimit   = planData.limit;

  const trialDaysLeft = (() => {
    if (!userProfile?.createdAt) return 0;
    const created = new Date(userProfile.createdAt);
    if (isNaN(created.getTime())) return 0;
    return Math.max(0, 21 - Math.floor((new Date() - created) / 86400000));
  })();

  const handleCheckout = (plan) => {
    if (!plan.paymentLink || !user) return;
    const url = new URL(plan.paymentLink);
    url.searchParams.set('client_reference_id', user.uid);
    url.searchParams.set('prefilled_email', user.email);
    window.open(url.toString(), '_blank');
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('Link do resetowania hasła został wysłany na ' + user.email);
    } catch (e) { alert(e.message); }
  };

  return (
    <main className="max-w-lg mx-auto p-4 animate-in fade-in duration-300 text-left">
      <div className="space-y-4 mt-4">

        {/* Profil */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5 flex items-center gap-5">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg rotate-3 shrink-0">
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[var(--text)] truncate text-sm">{user?.email}</p>
            <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase mt-1 tracking-wider">
              Dołączono: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('pl-PL') : '—'}
            </p>
          </div>
        </div>

        {/* Subskrypcja */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Subskrypcja</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--text)]">Aktywny plan</span>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
              userProfile?.isTrialActive
                ? 'bg-violet-600 text-white'
                : userProfile?.plan === 'free'
                  ? 'bg-[var(--bg-input)] text-[var(--text-dim)]'
                  : 'bg-green-600 text-white'
            }`}>
              {userProfile?.isTrialActive ? 'Trial MAX' : (planData?.name || 'Free')}
            </span>
          </div>
          {userProfile?.isTrialActive && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-dim)]">Pozostało w trialu</span>
              <span className="font-black text-orange-400 text-sm">
                {trialDaysLeft} {trialDaysLeft === 1 ? 'dzień' : 'dni'}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[var(--text-dim)]">Wykorzystane receptury</span>
            <span className="font-black text-[var(--text)] text-sm">{myRecipes.length} / {recipeLimit}</span>
          </div>
          <div className="bg-[var(--bg)] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${myRecipes.length >= recipeLimit ? 'bg-red-500' : 'bg-violet-600'}`}
              style={{ width: `${recipeLimit >= 9999 ? 5 : Math.min(100, (myRecipes.length / Math.max(1, recipeLimit)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Kup plan */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Kup plan roczny</p>
          <div className="space-y-3">
            {STRIPE_PLANS.map(plan => {
              const isActive = effectivePlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => handleCheckout(plan)}
                  disabled={!plan.paymentLink}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                    isActive
                      ? 'bg-violet-600 text-white border-violet-600 shadow-lg'
                      : 'bg-[var(--bg)] border-[var(--border)] hover:border-violet-600 hover:bg-violet-900/10 text-[var(--text)]'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-3">
                    {plan.id === 'vip' && (
                      <Star size={14} className={isActive ? 'text-yellow-300' : 'text-yellow-500'} fill="currentColor" />
                    )}
                    <div>
                      <p className="font-black text-sm uppercase tracking-wide">{plan.label}</p>
                      <p className={`text-[10px] font-bold ${isActive ? 'text-violet-100' : 'text-[var(--text-dim)]'}`}>
                        {`do ${plan.limit} receptur`}{plan.scope ? ` · ${plan.scope}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-sm ${isActive ? 'text-white' : 'text-violet-500'}`}>{plan.price}</span>
                    {isActive && <CheckCircle2 size={15} />}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[var(--text-dim)] text-center mt-4 leading-relaxed">
            Po opłaceniu subskrypcji plan zostanie aktywowany w ciągu kilku minut.
          </p>
        </div>

        {/* Zakupione kalkulatory */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Zakupione kalkulatory</p>
          <div className="space-y-2">
            {(userProfile?.tools || ['nalewkarz']).map(tool => (
              <div key={tool} className="flex items-center gap-3 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl">
                <div className="w-9 h-9 bg-violet-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <FlaskConical size={15} className="text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--text)]">
                    {tool === 'nalewkarz' ? 'Nalewkarz Master' : tool === 'masarski' ? 'Masarski Master' : tool}
                  </p>
                  <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-wider">Aktywny</p>
                </div>
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Ustawienia */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Ustawienia konta</p>
          <button
            onClick={handleResetPassword}
            className="w-full flex items-center justify-between p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl font-bold text-[var(--text)] hover:border-[var(--text-dim)] transition-all text-sm group"
          >
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-[var(--text-dim)] group-hover:text-violet-500 transition-colors" />
              <span>Zmień hasło</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-dim)]"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {userProfile?.isAdmin && (
          <button
            onClick={() => setActiveTab?.('superadmin')}
            className="w-full p-4 bg-[var(--bg-input)] text-[var(--text)] rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:opacity-80 transition-all shadow-lg"
          >
            <LayoutDashboard size={16} /> Panel Administratora
          </button>
        )}

        <button
          onClick={() => signOut(auth)}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-900/20 text-red-400 rounded-2xl border border-red-900/30 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all"
        >
          <Power size={16} /> Wyloguj się
        </button>

      </div>
    </main>
  );
};

export default ClientPanel;
