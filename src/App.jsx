import React, { useState, useEffect, useRef, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getCountFromServer, onSnapshot, query, where, addDoc, serverTimestamp, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { auth, db, SUPER_ROOT, COL_RECIPES, COL_CATEGORIES } from './firebase';
import useTheme from './hooks/useTheme';

import Header      from './components/Header';
import BottomNav   from './components/BottomNav';
import AuthModal   from './components/AuthModal';
import RecipeModal from './components/RecipeModal';
import RecipeList   from './components/RecipeList';
import RecipeDetail  from './components/RecipeDetail';
import Calculator   from './components/Calculator';
import ClientPanel  from './components/ClientPanel';
import AdminPanel   from './components/AdminPanel';
import HomeScreen   from './components/HomeScreen';
import MyRecipes    from './components/MyRecipes';

const DEFAULT_PLANS = {
  food: {
    free:  { name: 'Free',  limit: 2,   price: '0 zł' },
    mini:  { name: 'Mini',  limit: 10,  price: '12 zł / rok' },
    midi:  { name: 'Midi',  limit: 20,  price: '20 zł / rok' },
    maxi:  { name: 'Maxi',  limit: 30,  price: '30 zł / rok' },
    max:   { name: 'Max',   limit: 30,  price: '30 zł / rok' },
    vip:   { name: 'VIP',   limit: 100, price: '60 zł / rok' },
  },
};

const App = () => {
  const { theme, toggleTheme } = useTheme();

  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [allUsers, setAllUsers]       = useState([]);
  const [recipes, setRecipes]         = useState({});
  const [categories, setCategories]   = useState([]);
  const [ads, setAds]                 = useState([]);
  const [plans, setPlans]             = useState(null);

  const [activeTab, setActiveTab]     = useState('home');
  const hashNavigated                 = useRef(false);
  const [selectedKey, setSelectedKey] = useState('');

  // Obsługa URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#receptury')   setActiveTab('recipes');
    else if (hash === '#moje')   setActiveTab('my');
    else if (hash === '#konto')  setActiveTab('account');
    else if (hash === '#kalkulator') setActiveTab('calculator');
    if (hash) {
      hashNavigated.current = true;
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen]   = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit]           = useState(null);

  // Firebase: auth + pricing
  useEffect(() => {
    const unsubPricing = onSnapshot(doc(db, 'settings', 'pricing'), s => {
      if (s.exists()) setPlans(s.data());
      else setDoc(doc(db, 'settings', 'pricing'), DEFAULT_PLANS);
    });

    const unsubAuth = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        setIsAuthModalOpen(false);
        const userRef  = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        let profileData;
        if (userSnap.exists()) {
          profileData = userSnap.data();
          if (profileData.recipeCount == null) {
            const countSnap = await getCountFromServer(
              query(collection(db, COL_RECIPES), where('ownerId', '==', u.uid))
            );
            const count = countSnap.data().count;
            await updateDoc(userRef, { recipeCount: count });
            profileData = { ...profileData, recipeCount: count };
          }
        } else {
          profileData = {
            email: u.email || 'Użytkownik',
            plan: 'free',
            tools: ['nalewkarz'],
            favorites: [],
            createdAt: new Date().toISOString(),
            isAdmin: u.email === SUPER_ROOT,
            recipeCount: 0,
          };
          await setDoc(userRef, profileData);
        }
        if (u.email === SUPER_ROOT) profileData.isAdmin = true;
        profileData.isTrialActive = Math.floor((new Date() - new Date(profileData.createdAt)) / 86400000) <= 21;
        if (!profileData.favorites) profileData.favorites = [];
        setUserProfile(profileData);
      } else {
        setUserProfile(null);
        if (!hashNavigated.current) setActiveTab('home');
      }
    });

    return () => { unsubPricing(); unsubAuth(); };
  }, []);

  // Firebase: użytkownicy + reklamy (tylko admin)
  useEffect(() => {
    if (!userProfile?.isAdmin) return;
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id, tools: d.data().tools || ['nalewkarz'] })));
    });
    const unsubAds = onSnapshot(collection(db, 'ads'), snap => {
      setAds(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => { unsubUsers(); unsubAds(); };
  }, [userProfile?.isAdmin]);

  // Firebase: receptury + kategorie
  useEffect(() => {
    const ownerIds = user ? ['ADMIN', user.uid] : ['ADMIN'];
    const q = query(collection(db, COL_RECIPES), where('ownerId', 'in', ownerIds));
    const unsubRecipes = onSnapshot(q, snapshot => {
      const docs = {};
      snapshot.forEach(d => docs[d.id] = { ...d.data(), id: d.id });
      setRecipes(docs);
    });
    const unsubCats = onSnapshot(collection(db, COL_CATEGORIES), snap => {
      setCategories(snap.docs.map(d => d.data().name).sort());
    });
    return () => { unsubRecipes(); unsubCats(); };
  }, [user]);

  // Kliknięcie receptury → widok szczegółów
  const handleSelectRecipe = (recipe) => {
    setSelectedKey(recipe.id);
    setActiveTab('recipe-detail');
  };

  // Z widoku szczegółów → kalkulator (modyfikacja)
  const handleModifyRecipe = () => {
    setActiveTab('calculator');
  };

  // Z kalkulatora → nowa receptura (ze zmodyfikowanymi danymi + oryginalną procedurą)
  const handleSaveAsNew = (calcState) => {
    const source = recipes[selectedKey] ?? null;
    const preFilled = {
      // brak id → nowa receptura
      name:              '',
      category:          source?.category || '',
      spirit_volume:     Number(calcState.spirit),
      target_strength:   Number(calcState.targetMoc),
      fruits:            calcState.fruits.map(f => ({
        name:           f.name,
        weight_g:       Number(f.weight),
        juice_yield_pct: Number(f.yieldPct),
      })),
      spices:            source?.spices || [],
      sugar_g:           Number(calcState.sugar),
      water_syrup_ml:    Number(calcState.wSyrup),
      maceration_days:   Number(calcState.macerationDays),
      maceration_temp_c: Number(calcState.macerationTemp),
      aging_days:        Number(calcState.agingDays),
      imageUrl:          '',
      tech:              source?.tech || '',
    };
    setRecipeToEdit(preFilled);
    setIsRecipeModalOpen(true);
  };

  // Toggle ulubionej
  const toggleFavorite = async (recipeId) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    const current = userProfile?.favorites || [];
    const updated = current.includes(recipeId)
      ? current.filter(id => id !== recipeId)
      : [...current, recipeId];
    await updateDoc(doc(db, 'users', user.uid), { favorites: updated });
    setUserProfile(prev => ({ ...prev, favorites: updated }));
  };

  // Modal receptury
  const openRecipeModal = (recipe = null) => {
    setRecipeToEdit(recipe);
    setIsRecipeModalOpen(true);
  };

  const handleSaveRecipe = async (formRecipe) => {
    if (!formRecipe.name || !formRecipe.category) return alert("Uzupełnij nazwę i kategorię!");
    try {
      // Oblicz wartości kalkulatora
      const spiritScaled = Number(formRecipe.spirit_volume);
      const V_alkohol    = spiritScaled * 0.96;
      const V_juice      = (formRecipe.fruits || []).reduce((acc, f) => acc + Number(f.weight_g) * (Number(f.juice_yield_pct) / 100), 0);
      const V_syrup      = Number(formRecipe.sugar_g) * 0.63 + Number(formRecipe.water_syrup_ml);
      const mocRatio     = Number(formRecipe.target_strength) / 100;
      const V_woda       = mocRatio > 0 ? (V_alkohol / mocRatio) - spiritScaled - V_juice - V_syrup : 0;
      const V_total      = spiritScaled + Math.max(0, V_woda) + V_juice + V_syrup;
      const finalMoc     = V_total > 0 ? (V_alkohol / V_total) * 100 : 0;

      const payload = {
        name:               formRecipe.name,
        category:           formRecipe.category,
        spirit_volume:      Number(formRecipe.spirit_volume),
        target_strength:    Number(formRecipe.target_strength),
        fruits:             formRecipe.fruits || [],
        spices:             formRecipe.spices || [],
        sugar_g:            Number(formRecipe.sugar_g),
        water_syrup_ml:     Number(formRecipe.water_syrup_ml),
        maceration_days:    Number(formRecipe.maceration_days),
        maceration_temp_c:  Number(formRecipe.maceration_temp_c),
        aging_days:         Number(formRecipe.aging_days),
        calc_water_ml:      Math.max(0, V_woda),
        calc_total_ml:      V_total,
        calc_final_strength: finalMoc,
        calc_juice_ml:      V_juice,
        imageUrl:           formRecipe.imageUrl || '',
        tech:               formRecipe.tech || '',
        updatedAt:          serverTimestamp(),
        ownerId:            userProfile?.isAdmin ? 'ADMIN' : user.uid,
      };

      if (formRecipe.id) {
        await updateDoc(doc(db, COL_RECIPES, formRecipe.id), payload);
      } else {
        await addDoc(collection(db, COL_RECIPES), payload);
        if (!userProfile?.isAdmin) {
          await updateDoc(doc(db, 'users', user.uid), { recipeCount: increment(1) });
        }
      }
      setIsRecipeModalOpen(false);
    } catch (e) { alert(e.message); }
  };

  // Funkcje admina
  const updatePlayerPlan = async (userId, newPlan) =>
    await updateDoc(doc(db, 'users', userId), { plan: newPlan });

  const toggleAdmin = async (userId, currentStatus) => {
    if (userProfile.email !== SUPER_ROOT) return alert("Tylko Właściciel.");
    await updateDoc(doc(db, 'users', userId), { isAdmin: !currentStatus });
  };

  const deleteUserAccount = async (userId, userEmail) => {
    if (userProfile.email !== SUPER_ROOT) return alert("Tylko Właściciel może usuwać konta.");
    if (userEmail === SUPER_ROOT) return alert("Nie możesz usunąć konta Właściciela!");
    if (window.confirm(`Usunąć z bazy użytkownika ${userEmail || 'Brak emaila'}?`)) {
      try { await deleteDoc(doc(db, 'users', userId)); } catch (e) { alert("Błąd: " + e.message); }
    }
  };

  const allRecipesList = useMemo(() => Object.values(recipes), [recipes]);
  const currentRecipe  = recipes[selectedKey] ?? null;
  const adminRecipes   = useMemo(() => Object.values(recipes).filter(r => r.ownerId === 'ADMIN' && !r.blocked), [recipes]);
  const myRecipes      = useMemo(() => Object.values(recipes).filter(r => r.ownerId === user?.uid && !r.blocked), [recipes, user]);
  const favoriteIds    = userProfile?.favorites || [];
  const favoriteRecipes = useMemo(() => adminRecipes.filter(r => favoriteIds.includes(r.id)), [adminRecipes, favoriteIds]);

  const recipeLimit = useMemo(() => {
    if (userProfile?.isTrialActive) return 100;
    const plan = userProfile?.plan || 'free';
    return ((plans?.food ?? DEFAULT_PLANS.food)[plan] ?? DEFAULT_PLANS.food.free).limit;
  }, [userProfile, plans]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans">
      <style>{`
        @media print {
          .no-print, header, footer, nav { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-container { display: block !important; width: 100% !important; }
          @page { size: auto; margin: 15mm; }
        }
      `}</style>

      <Header
        user={user}
        userProfile={userProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsAuthModalOpen={setIsAuthModalOpen}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main
        className="max-w-2xl mx-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
      >
        {activeTab === 'home' && (
          <HomeScreen setActiveTab={setActiveTab} ads={ads} />
        )}

        {activeTab === 'recipes' && (
          <RecipeList
            recipes={adminRecipes}
            categories={categories}
            ads={ads}
            user={user}
            userProfile={userProfile}
            favoriteIds={favoriteIds}
            onSelectRecipe={handleSelectRecipe}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {activeTab === 'recipe-detail' && currentRecipe && (
          <RecipeDetail
            recipe={currentRecipe}
            onBack={() => setActiveTab('recipes')}
            onModify={handleModifyRecipe}
            onEdit={openRecipeModal}
            user={user}
            userProfile={userProfile}
          />
        )}

        {activeTab === 'my' && userProfile && (
          <MyRecipes
            user={user}
            userProfile={userProfile}
            myRecipes={myRecipes}
            favoriteRecipes={favoriteRecipes}
            favoriteIds={favoriteIds}
            plans={plans}
            onSelectRecipe={handleSelectRecipe}
            onOpenRecipeModal={openRecipeModal}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {activeTab === 'calculator' && (
          <Calculator
            user={user}
            userProfile={userProfile}
            recipe={currentRecipe}
            onSaveAsNew={user ? handleSaveAsNew : null}
          />
        )}

        {activeTab === 'account' && userProfile && (
          <ClientPanel
            user={user}
            userProfile={userProfile}
            myRecipes={myRecipes}
            plans={plans}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'superadmin' && userProfile?.isAdmin && (
          <AdminPanel
            allUsers={allUsers}
            categories={categories}
            ads={ads}
            allRecipes={allRecipesList}
            updatePlayerPlan={updatePlayerPlan}
            toggleAdmin={toggleAdmin}
            deleteUserAccount={deleteUserAccount}
            onAddRecipe={() => openRecipeModal(null)}
          />
        )}
      </main>

      {activeTab !== 'superadmin' && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          setIsAuthModalOpen={setIsAuthModalOpen}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {isRecipeModalOpen && (
        <RecipeModal
          user={user}
          categories={categories}
          initialRecipe={recipeToEdit}
          onClose={() => setIsRecipeModalOpen(false)}
          onSave={handleSaveRecipe}
          recipeCount={myRecipes.length}
          recipeLimit={recipeLimit}
        />
      )}
    </div>
  );
};

export default App;
