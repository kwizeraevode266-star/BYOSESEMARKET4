(function(){
  // Bridge loader that ensures the account shared storage helpers are available across the site.
  // It loads the account-scoped storage implementation if present.
  try{
    if (window.handleAccountClick && window.isLoggedIn) return;
    var s = document.createElement('script');
    s.src = '/account/shared/storage.js';
    s.async = false;
    document.head.appendChild(s);
  }catch(e){console.error('Failed to load auth bridge',e)}
})();
