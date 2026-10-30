// Effectra – Rückkehr nach der Anmeldung bei Spotify oder Google.
// Gibt das Ergebnis an das Effectra-Fenster weiter (gleiche Adresse) und schließt sich bzw. springt zurück.
// Der Zustand („state“) wird in der App geprüft – fremde Ergebnisse werden dort verworfen.
(function () {
  var q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#/, ''));
  var res = {
    state: String(q.get('state') || h.get('state') || '').slice(0, 200),
    code: String(q.get('code') || '').slice(0, 2000),
    token: String(h.get('access_token') || '').slice(0, 4000),
    expires: Number(h.get('expires_in')) || 0,
    error: String(q.get('error') || h.get('error') || '').slice(0, 100),
    at: Date.now()
  };
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  try { localStorage.setItem('effectra.oauth', JSON.stringify(res)); } catch (e) {}
  try { var bc = new BroadcastChannel('effectra-oauth'); bc.postMessage(res); bc.close(); } catch (e) {}
  var popup = res.state.split('.')[1] === 'p';
  var msg = document.getElementById('msg');
  if (popup) {
    if (msg) msg.textContent = res.error ? 'Abgebrochen. Du kannst dieses Fenster schließen.' : 'Verbunden! Du kannst dieses Fenster schließen.';
    setTimeout(function () { window.close(); }, 400);
  } else {
    location.replace('./');
  }
})();
