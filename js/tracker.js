/* Visitor Tracker — records visits to localStorage for admin analytics
   - Stores each visit with timestamp, path, userAgent, screen size
   - Attempts optional IP geolocation (best-effort)
   - Updates session duration on unload
*/
const Tracker = (function(){
  const KEY = 'byose_market_visitors_v1';

  function getStore(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch{ return []; }
  }
  function saveStore(v){ localStorage.setItem(KEY, JSON.stringify(v)); }

  function detectDevice(){
    const ua = navigator.userAgent || '';
    const width = window.innerWidth || 0;
    if(/Mobi|Android/i.test(ua) || width <= 640) return 'mobile';
    if(width <= 1024) return 'tablet';
    return 'desktop';
  }

  async function fetchGeo(){
    try{
      const resp = await fetch('https://ipapi.co/json/');
      if(!resp.ok) return null;
      return await resp.json();
    }catch(e){ return null; }
  }

  // Start tracking when called
  async function startVisit(){
    const start = Date.now();
    const path = location.pathname + location.search;
    const userAgent = navigator.userAgent;
    const device = detectDevice();

    const visitor = {
      id: 'v_' + start,
      timestamp: new Date(start).toISOString(),
      start,
      path,
      userAgent,
      device,
      ip: null,
      city: null,
      country: null,
      duration: 0,
      userId: null,
      referrer: document.referrer || null,
    };

    // If a logged-in user exists, attach id
    try{
      const currentUser = JSON.parse(localStorage.getItem('byose_market_current_user') || 'null');
      if(currentUser && currentUser.id) visitor.userId = currentUser.id;
    }catch(e){}

    const store = getStore();
    store.push(visitor);
    saveStore(store);

    // Attempt to enrich the stored visit with geolocation without blocking the write.
    fetchGeo().then((geo) => {
      if(!geo) return;
      try{
        const all = getStore();
        const idx = all.findIndex(v=>v.id===visitor.id);
        if(idx>-1){
          all[idx].ip = geo.ip || null;
          all[idx].city = geo.city || null;
          all[idx].country = geo.country_name || null;
          all[idx].org = geo.org || null;
          saveStore(all);
        }
      }catch(e){}
    }).catch(() => null);

    // on unload update duration for last visitor id
    window.addEventListener('beforeunload', () => {
      try{
        const now = Date.now();
        const all = getStore();
        const idx = all.findIndex(v=>v.id===visitor.id);
        if(idx>-1){
          all[idx].duration = Math.round((now - all[idx].start)/1000);
          saveStore(all);
        }
      }catch(e){}
    });
  }

  function getVisits(){ return getStore(); }
  function clearVisits(){ localStorage.removeItem(KEY); }

  return { startVisit, getVisits, clearVisits };
})();

// Expose globally
window.Tracker = Tracker;
