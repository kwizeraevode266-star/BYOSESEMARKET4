(function(){
  // Bridge loader that ensures the account shared storage helpers are available across the site.
  // It loads the account-scoped storage implementation if present.
  try{
    if (window.handleAccountClick && window.isLoggedIn) return;
    function getSitePrefix() {
      var path = (window.location && window.location.pathname) || '';
      if (path.indexOf('/account/settings/') !== -1) return '../../';
      if (
        path.indexOf('/account/') !== -1 ||
        path.indexOf('/logout/') !== -1 ||
        path.indexOf('/components/') !== -1 ||
        path.indexOf('/details/') !== -1 ||
        path.indexOf('/shop/') !== -1 ||
        path.indexOf('/auth/') !== -1
      ) return '../';
      return '';
    }
    var s = document.createElement('script');
    s.src = getSitePrefix() + 'account/shared/storage.js';
    s.async = false;
    document.head.appendChild(s);
  }catch(e){console.error('Failed to load auth bridge',e)}
})();
