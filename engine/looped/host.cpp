#include "looped/host.h"

#include <emscripten.h>

namespace {

// Wraps the page's window.loopedHost once (looped/host.h).
EM_JS(void, looped_install_host, (), {
  var page = window['loopedHost'] || {};
  if (page['__looped']) return;  // already wrapped
  var parts = ['net', 'audio', 'voice', 'bridge', 'log', 'account', 'settings'];
  var told = {};
  // A missing part: any method of it does nothing and returns undefined.
  var nothing = new Proxy(function () { return undefined; }, {
    get: function (t, k) { return k === 'then' ? undefined : nothing; },
    apply: function () { return undefined; }
  });
  window['loopedHost'] = new Proxy(page, {
    get: function (t, k) {
      if (k === '__looped') return true;
      if (k === 'has') return function (name) { return !!t[name]; };
      var v = t[k];
      if (v || parts.indexOf(k) < 0) return v;
      if (!told[k]) { told[k] = 1; console.log('Looped: this page gives no "' + k + '" (its calls do nothing).'); }
      return nothing;
    }
  });
});

}  // namespace

namespace engine::host {

void install() { looped_install_host(); }

}  // namespace engine::host
