/* Effectra – App-Logik (läuft komplett im Browser, Daten liegen in Supabase) */
(function () {
  'use strict';

  /* ================= Konstanten ================= */
  var SL = { offen: 'Offen', arbeit: 'In Arbeit', erledigt: 'Erledigt' };
  var NEXT = { offen: 'arbeit', arbeit: 'erledigt', erledigt: 'offen' };
  var STATUS = [{ k: 'offen', l: 'Offen' }, { k: 'arbeit', l: 'In Arbeit' }, { k: 'erledigt', l: 'Erledigt' }];
  var PRIO = [{ k: 1, l: 'Niedrig' }, { k: 2, l: 'Normal' }, { k: 3, l: 'Hoch' }];
  var COLORS = ['blue', 'green', 'orange', 'red', 'purple', 'teal', 'pink', 'gray'];
  var COLOR_NAMES = { blue: 'Blau', green: 'Grün', orange: 'Orange', red: 'Rot', purple: 'Lila', teal: 'Türkis', pink: 'Pink', gray: 'Grau' };
  var LS_WS = 'effectra.ws';

  var I = {
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    tick: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12l2.8 2.8L16.5 9"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.6-4.6"/></svg>',
    up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    calm: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>'
  };

  /* ================= Zustand ================= */
  var S = {
    sb: null, uid: null, email: '', screen: 'loading', authMode: 'login', recovery: false,
    workspaces: [], ws: null, members: [], profiles: {}, projects: [], tasks: [], subtasks: [], comments: [], activity: [],
    tab: 'heute', scope: 'me', boardStatus: 'offen', filterMine: false, filterProject: '', search: '', showAllDone: false,
    sheet: null, armed: null, draftSubs: [], channel: null, live: true, lastLoad: 0, loadSeq: 0,
    hold: 0, pending: false, animNext: true, toastTimer: 0, closeTimer: 0, busy: {}, onbBack: false
  };
  function $(id) { return document.getElementById(id); }

  /* ================= Hilfen ================= */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pl(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function colorOf(c) { return COLORS.indexOf(c) >= 0 ? c : 'blue'; }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function today() { return ymd(new Date()); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return ymd(d); }
  var fmtDay = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  var fmtShort = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });
  var fmtLong = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  var fmtWd = new Intl.DateTimeFormat('de-DE', { weekday: 'short' });
  var rtf = new Intl.RelativeTimeFormat('de-DE', { numeric: 'auto' });
  function dueLabel(due) {
    var t = today();
    if (due === t) return 'Heute';
    if (due === addDays(t, 1)) return 'Morgen';
    if (due === addDays(t, -1)) return 'Gestern';
    return fmtDay.format(parse(due)).replace(',', '');
  }
  function ago(ts) {
    var s = (new Date(ts).getTime() - Date.now()) / 1000;
    var a = Math.abs(s);
    if (a < 45) return 'gerade eben';
    if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
    if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
    if (a < 86400 * 7) return rtf.format(Math.round(s / 86400), 'day');
    return fmtShort.format(new Date(ts));
  }
  function ls(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {}
    return null;
  }

  /* ================= Personen ================= */
  function hash(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function who(id) {
    var p = S.profiles[id];
    var isMe = !!id && id === S.uid;
    var nm = (p && p.display_name) || (isMe ? S.email.split('@')[0] : '');
    var name = nm || 'Teammitglied';
    return { id: id, name: name, label: isMe ? name + ' (du)' : name, first: name.split(' ')[0], isMe: isMe };
  }
  function initials(name) {
    var parts = String(name).trim().split(/\s+/);
    var s = (parts[0] || '?').charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '');
    return s.toUpperCase();
  }
  function avatar(id, size) {
    var w = who(id);
    return '<span class="av ' + (size || '') + '" style="--c:var(--c-' + COLORS[hash(id) % 7] + ')" aria-hidden="true">' + esc(initials(w.name)) + '</span>';
  }
  function memberRole(id) { for (var i = 0; i < S.members.length; i++) if (S.members[i].user_id === id) return S.members[i].role; return null; }
  function currentWs() { return byId(S.workspaces, S.ws); }
  function iAmOwner() { return memberRole(S.uid) === 'owner'; }

  /* ================= Fehlertexte ================= */
  function errText(e) {
    var m = (e && (e.message || e.error_description)) || '';
    var c = e && e.code;
    if (c === 'P0002' || c === '22023' || c === '54000' || (c === '42501' && /Besitzer/.test(m))) return m;
    if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Keine Verbindung. Prüfe dein Internet und versuche es erneut.';
    if (/row-level security|permission denied/i.test(m) || c === '42501') return 'Dafür fehlt dir die Berechtigung.';
    if (/violates check constraint/i.test(m)) return 'Eine Eingabe ist zu lang oder ungültig.';
    if (/JWT|session/i.test(m)) return 'Deine Sitzung ist abgelaufen. Melde dich neu an.';
    return 'Das hat nicht geklappt. Versuche es erneut.';
  }
  function authErr(e) {
    var m = (e && e.message) || '';
    var c = e && (e.code || '');
    if (/invalid login credentials|invalid_credentials/i.test(m + c)) return 'E-Mail oder Passwort ist falsch.';
    if (/email not confirmed|email_not_confirmed/i.test(m + c)) return 'Bitte bestätige zuerst deine E-Mail über den Link, den wir dir geschickt haben.';
    if (/already registered|user_already_exists/i.test(m + c)) return 'Für diese E-Mail gibt es schon ein Konto. Melde dich an.';
    if (/rate limit|too many|over_email_send_rate_limit/i.test(m + c) || e.status === 429) return 'Zu viele Versuche. Warte ein paar Minuten.';
    if (/password/i.test(m) && /(short|least|weak)/i.test(m)) return 'Das Passwort ist zu schwach. Nimm mindestens 8 Zeichen.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Keine Verbindung. Prüfe dein Internet.';
    return 'Das hat nicht geklappt. Versuche es erneut.';
  }
  function run(q) { return Promise.resolve(q).then(function (r) { if (r && r.error) throw r.error; return r ? r.data : null; }); }

  /* ================= Rückmeldung ================= */
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(function () { t.hidden = true; }, 4000);
  }
  function copyText(text, okMsg) {
    var done = function () { toast(okMsg); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { toast('Kopieren nicht möglich. Markiere den Code und kopiere ihn.'); });
    } else toast('Kopieren nicht möglich. Markiere den Code und kopiere ihn.');
  }

  /* ================= Bildschirme ohne App ================= */
  function showScreen(html) {
    $('app').hidden = true; $('fab').hidden = true;
    document.body.classList.add('plain');
    $('screen').hidden = false;
    $('screen').innerHTML = html;
  }

  function setupScreen() {
    showScreen('<div class="setup"><h1 class="large">Fast geschafft</h1><p class="subtitle">Effectra ist noch nicht mit deiner Datenbank verbunden.</p>' +
      '<div class="group"><div class="row-btn static"><span class="grow">Trage in <code>config.js</code> die Werte <code>supabaseUrl</code> und <code>supabaseAnonKey</code> aus deinem Supabase-Projekt ein (Project Settings → API). Die Schritte stehen in der README.</span></div></div></div>');
  }

  function authScreen(msg, kind) {
    var m = S.authMode;
    var title = { login: 'Anmelden', signup: 'Konto erstellen', forgot: 'Passwort vergessen', reset: 'Neues Passwort' }[m];
    var fields = '';
    if (m === 'signup') fields += '<label class="vh" for="a-name">Name</label><input class="field" id="a-name" type="text" autocomplete="name" maxlength="60" placeholder="Dein Name" required>';
    if (m !== 'reset') fields += '<label class="vh" for="a-email">E-Mail</label><input class="field" id="a-email" type="email" autocomplete="email" inputmode="email" maxlength="200" placeholder="E-Mail" required>';
    if (m !== 'forgot') fields += '<label class="vh" for="a-pass">Passwort</label><input class="field" id="a-pass" type="password" minlength="8" maxlength="72" autocomplete="' + (m === 'login' ? 'current-password' : 'new-password') + '" placeholder="' + (m === 'login' ? 'Passwort' : 'Passwort (mind. 8 Zeichen)') + '" required>';
    var btn = { login: 'Anmelden', signup: 'Konto erstellen', forgot: 'Link senden', reset: 'Passwort speichern' }[m];
    var links = '';
    if (m === 'login') links = '<button type="button" class="txt-btn small" data-auth="signup">Konto erstellen</button><button type="button" class="txt-btn small" data-auth="forgot">Passwort vergessen?</button>';
    else if (m !== 'reset') links = '<button type="button" class="txt-btn small" data-auth="login">Zurück zur Anmeldung</button>';
    showScreen('<div class="auth"><img class="logo" src="icons/icon-192.png" alt="" width="72" height="72"><h1>Effectra</h1><p class="tag">Gemeinsam fokussiert arbeiten.</p>' +
      '<form id="auth-form" novalidate><h2 class="vh">' + title + '</h2>' + fields +
      (msg ? '<div class="msg ' + (kind || 'err') + '" role="alert">' + esc(msg) + '</div>' : '') +
      '<button class="btn-p block" id="auth-btn" type="submit">' + btn + '</button></form><div class="switch-line">' + links + '</div></div>');
    var f = $('screen').querySelector('input'); if (f && window.innerWidth >= 760) f.focus();
  }

  function onboardingScreen(msg) {
    var me = who(S.uid);
    showScreen('<div class="onb">' + (S.onbBack ? '<button type="button" class="txt-btn" data-action="onb-back">‹ Zurück</button>' : '') +
      '<h1 class="large">Hallo ' + esc(me.first) + '</h1><p class="subtitle">Gründe ein Team oder tritt dem Team deines Kollegen bei.</p>' +
      (msg ? '<div class="msg err" role="alert">' + esc(msg) + '</div>' : '') +
      '<div class="card"><h2>Team gründen</h2><p>Du bist Besitzer und bekommst einen Einladungscode für deinen Kollegen.</p>' +
      '<form class="inline-form" id="create-form" novalidate><label class="vh" for="o-name">Teamname</label><input class="field" id="o-name" type="text" maxlength="60" placeholder="z. B. Studio Nord" autocomplete="off"><button class="btn-p" type="submit">Gründen</button></form></div>' +
      '<div class="card"><h2>Team beitreten</h2><p>Gib den 10-stelligen Code ein, den du bekommen hast.</p>' +
      '<form class="inline-form" id="join-form" novalidate><label class="vh" for="o-code">Einladungscode</label><input class="field code-in" id="o-code" type="text" maxlength="14" placeholder="ABCDE-FGHJK" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn-t" type="submit">Beitreten</button></form></div>' +
      '<div class="switch-line" style="margin-top:20px"><button type="button" class="txt-btn small danger" data-action="logout">Abmelden</button></div></div>');
  }

  /* ================= Auth ================= */
  function authSubmit(form) {
    var g = function (id) { var el = form.querySelector('#' + id); return el ? el.value.trim() : ''; };
    var m = S.authMode, email = g('a-email'), pass = form.querySelector('#a-pass') ? form.querySelector('#a-pass').value : '', name = g('a-name');
    if (m !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return authScreenKeep('Bitte gib eine gültige E-Mail ein.');
    if ((m === 'signup' || m === 'reset') && pass.length < 8) return authScreenKeep('Das Passwort braucht mindestens 8 Zeichen.');
    if (m === 'signup' && !name) return authScreenKeep('Bitte gib deinen Namen ein.');
    if (m === 'login' && !pass) return authScreenKeep('Bitte gib dein Passwort ein.');
    $('auth-btn').disabled = true;
    var redirect = location.origin + location.pathname;
    var p;
    if (m === 'login') p = S.sb.auth.signInWithPassword({ email: email, password: pass });
    else if (m === 'signup') p = S.sb.auth.signUp({ email: email, password: pass, options: { data: { display_name: name }, emailRedirectTo: redirect } });
    else if (m === 'forgot') p = S.sb.auth.resetPasswordForEmail(email, { redirectTo: redirect });
    else p = S.sb.auth.updateUser({ password: pass });
    p.then(function (r) {
      if (r.error) throw r.error;
      if (m === 'signup' && !(r.data && r.data.session)) { S.authMode = 'login'; authScreen('Fast fertig: Wir haben dir eine E-Mail geschickt. Bestätige den Link und melde dich dann an.', 'ok'); }
      else if (m === 'forgot') { S.authMode = 'login'; authScreen('Wenn es ein Konto mit dieser E-Mail gibt, ist ein Link zum Zurücksetzen unterwegs.', 'ok'); }
      else if (m === 'reset') { S.recovery = false; toast('Passwort geändert'); start(); }
    }).catch(function (e) { authScreenKeep(authErr(e)); });
  }
  function authScreenKeep(msg) {
    var vals = {};
    ['a-name', 'a-email'].forEach(function (id) { var el = $(id); if (el) vals[id] = el.value; });
    authScreen(msg, 'err');
    Object.keys(vals).forEach(function (id) { var el = $(id); if (el) el.value = vals[id]; });
  }

  /* ================= Daten laden ================= */
  function start() {
    var seq = ++S.loadSeq;
    return run(S.sb.from('workspaces').select('id,name,invite_code,owner_id,created_at').order('created_at')).then(function (list) {
      if (seq !== S.loadSeq) return;
      S.workspaces = list || [];
      return run(S.sb.from('profiles').select('id,display_name').eq('id', S.uid)).then(function (p) {
        if (p && p[0]) S.profiles[S.uid] = p[0];
        if (!S.workspaces.length) { S.screen = 'onboarding'; unsubscribe(); onboardingScreen(); return; }
        var saved = ls(LS_WS);
        var ws = byId(S.workspaces, saved) ? saved : S.workspaces[0].id;
        return openWs(ws);
      });
    }).catch(function (e) {
      showScreen('<div class="setup"><h1 class="large">Keine Verbindung</h1><p class="subtitle">' + esc(errText(e)) + '</p><button class="btn-p" type="button" data-action="retry">Erneut versuchen</button></div>');
    });
  }

  function openWs(id) {
    var changed = S.ws !== id;
    S.ws = id; ls(LS_WS, id);
    if (changed) { S.filterProject = ''; S.search = ''; S.tasks = []; S.projects = []; }
    return loadWs().then(function () { if (changed || !S.channel) subscribe(); });
  }

  function loadWs() {
    var id = S.ws, seq = ++S.loadSeq;
    var q = function (t, cols) { return run(S.sb.from(t).select(cols).eq('workspace_id', id)); };
    return Promise.all([
      q('workspace_members', 'workspace_id,user_id,role,joined_at'),
      q('projects', '*'),
      q('tasks', '*'),
      q('subtasks', '*'),
      q('comments', '*'),
      run(S.sb.from('activity').select('*').eq('workspace_id', id).order('id', { ascending: false }).limit(60))
    ]).then(function (r) {
      if (seq !== S.loadSeq || id !== S.ws) return;
      S.members = r[0] || []; S.projects = r[1] || []; S.tasks = r[2] || []; S.subtasks = r[3] || []; S.comments = r[4] || []; S.activity = r[5] || [];
      S.lastLoad = Date.now();
      if (!S.members.some(function (m) { return m.user_id === S.uid; })) { ls(LS_WS, null); S.ws = null; return start(); }
      return loadProfiles().then(function () { S.screen = 'app'; S.animNext = true; render(); refreshSheet(); });
    });
  }

  function loadProfiles() {
    var ids = S.members.map(function (m) { return m.user_id; });
    if (!ids.length) return Promise.resolve();
    return run(S.sb.from('profiles').select('id,display_name').in('id', ids)).then(function (list) {
      (list || []).forEach(function (p) { S.profiles[p.id] = p; });
    }).catch(function () {});
  }

  /* ================= Echtzeit ================= */
  var LISTS = { tasks: 'tasks', projects: 'projects', subtasks: 'subtasks', comments: 'comments', activity: 'activity' };
  function unsubscribe() { if (S.channel) { try { S.sb.removeChannel(S.channel); } catch (e) {} S.channel = null; } }
  function subscribe() {
    unsubscribe();
    var id = S.ws;
    var ch = S.sb.channel('ws-' + id);
    ['tasks', 'projects', 'subtasks', 'comments', 'workspace_members', 'activity'].forEach(function (t) {
      ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: t, filter: 'workspace_id=eq.' + id }, function (p) { onChange(t, p); });
      ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: t, filter: 'workspace_id=eq.' + id }, function (p) { onChange(t, p); });
      ch.on('postgres_changes', { event: 'DELETE', schema: 'public', table: t }, function (p) { onChange(t, p); });
    });
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces', filter: 'id=eq.' + id }, function (p) {
      if (p.eventType === 'DELETE') { toast('Das Team wurde gelöscht.'); start(); return; }
      var w = byId(S.workspaces, p.new.id); if (w) Object.assign(w, p.new);
      queue();
    });
    var first = true;
    ch.subscribe(function (status) {
      if (status === 'SUBSCRIBED') { if (!first) loadWs(); first = false; setLive(true); }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setLive(false);
    });
    S.channel = ch;
  }
  function setLive(on) {
    if (S.live === on) return;
    S.live = on;
    var b = $('banner');
    b.hidden = on;
    b.textContent = on ? '' : 'Offline – Änderungen anderer erscheinen, sobald die Verbindung zurück ist.';
  }
  function onChange(table, p) {
    var ev = p.eventType, row = p.new || {}, old = p.old || {};
    if (table === 'workspace_members') {
      if (ev === 'DELETE') {
        if (old.user_id === S.uid && (!old.workspace_id || old.workspace_id === S.ws)) { toast('Du bist nicht mehr in diesem Team.'); ls(LS_WS, null); start(); return; }
        S.members = S.members.filter(function (m) { return !(m.user_id === old.user_id && (!old.workspace_id || m.workspace_id === old.workspace_id)); });
      } else if (row.workspace_id === S.ws) {
        S.members = S.members.filter(function (m) { return m.user_id !== row.user_id; }).concat([row]);
        loadProfiles().then(queue);
      }
      queue(); return;
    }
    var key = LISTS[table]; if (!key) return;
    if (ev === 'DELETE') {
      var before = S[key].length;
      S[key] = S[key].filter(function (r) { return r.id !== old.id; });
      if (S[key].length === before) return;
      if (table === 'tasks' && S.sheet && S.sheet.kind === 'task' && S.sheet.id === old.id) { closeSheet(); toast('Diese Aufgabe wurde gerade gelöscht.'); }
    } else {
      if (row.workspace_id !== S.ws) return;
      upsert(key, row);
      if (table === 'activity') { S.activity.sort(function (a, b) { return b.id - a.id; }); S.activity = S.activity.slice(0, 60); }
    }
    queue();
    if (S.sheet && S.sheet.kind === 'task' && (table === 'subtasks' || table === 'comments')) refreshSheet();
  }
  function upsert(key, row) {
    var arr = S[key];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === row.id) { arr[i] = row; return; }
    arr.push(row);
  }

  /* ================= Bausteine ================= */
  function pbar(p, color) {
    return '<div class="pbar' + (p === 100 ? ' done' : '') + '" style="--p:' + p + '%' + (color ? ';--c:var(--c-' + colorOf(color) + ')' : '') + '" role="img" aria-label="' + p + ' Prozent erledigt"><i></i></div>';
  }
  function stats(list) {
    var d = 0, a = 0;
    list.forEach(function (t) { if (t.status === 'erledigt') d++; else if (t.status === 'arbeit') a++; });
    return { done: d, work: a, open: list.length - d - a, total: list.length, pct: list.length ? Math.round(d / list.length * 100) : 0 };
  }
  function subsOf(taskId) {
    return S.subtasks.filter(function (s) { return s.task_id === taskId; })
      .sort(function (a, b) { return (a.position - b.position) || (a.created_at < b.created_at ? -1 : 1); });
  }
  function commentsOf(taskId) {
    return S.comments.filter(function (c) { return c.task_id === taskId; }).sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
  }

  function row(t) {
    var done = t.status === 'erledigt';
    var overdue = !done && t.due && t.due < today();
    var p = t.project_id ? byId(S.projects, t.project_id) : null;
    var parts = [];
    if (p) parts.push('<span class="it"><i class="dot" style="--c:var(--c-' + colorOf(p.color) + ')"></i>' + esc(p.name) + '</span>');
    if (t.due) parts.push('<span class="it' + (overdue ? ' bad' : '') + '">' + esc(dueLabel(t.due)) + '</span>');
    var subs = subsOf(t.id);
    if (subs.length) parts.push('<span class="it">' + I.list + subs.filter(function (s) { return s.done; }).length + '/' + subs.length + '</span>');
    var cc = commentsOf(t.id).length;
    if (cc) parts.push('<span class="it">' + I.chat + cc + '</span>');
    var next = NEXT[t.status] || 'offen';
    return '<div class="row task' + (done ? ' is-done' : '') + '">' +
      '<button type="button" class="state" data-action="cycle" data-id="' + esc(t.id) + '" data-s="' + esc(t.status) + '" aria-label="' + esc('Status: ' + (SL[t.status] || 'Offen') + '. Wechseln zu ' + SL[next] + '.') + '"><i>' + (done ? I.check : '') + '</i></button>' +
      '<button type="button" class="main" data-action="open-task" data-id="' + esc(t.id) + '"><span class="txt"><span class="ttl">' +
      (t.priority === 3 ? '<span class="prio" title="Hohe Priorität">! </span>' : '') + esc(t.title) + '</span>' +
      (parts.length ? '<span class="sub">' + parts.join('') + '</span>' : '') + '</span>' +
      (t.assignee ? avatar(t.assignee, 's') : '') + '</button></div>';
  }
  function group(list) { return '<div class="group">' + list.map(row).join('') + '</div>'; }
  function sortActive(a, b) {
    if ((b.priority || 2) !== (a.priority || 2)) return (b.priority || 2) - (a.priority || 2);
    if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
    if (a.due && !b.due) return -1;
    if (!a.due && b.due) return 1;
    return a.created_at < b.created_at ? -1 : 1;
  }
  function emptyState(title, text) {
    return '<div class="empty"><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><div class="row-actions">' +
      '<button class="btn-p" type="button" data-action="new-task">Aufgabe anlegen</button><button class="btn-t" type="button" data-action="new-project">Projekt anlegen</button></div></div>';
  }
  function segc(o) {
    var idx = 0;
    o.list.forEach(function (x, i) { if (String(x.k) === String(o.sel)) idx = i; });
    var h = '<div class="segc ' + (o.cls || '') + '" role="radiogroup" aria-label="' + esc(o.label || '') + '"' + (o.id ? ' data-for="' + o.id + '"' : '') + ' style="--n:' + o.list.length + ';--i:' + idx + '"><span class="thumb"></span>';
    o.list.forEach(function (x, i) {
      h += '<button type="button" role="radio" aria-checked="' + (i === idx) + '" data-seg="' + esc(x.k) + '" data-i="' + i + '"' + (o.action ? ' data-action="' + o.action + '"' : '') + '>' + esc(x.l) + '</button>';
    });
    h += '</div>';
    if (o.id) h += '<input type="hidden" id="' + o.id + '" value="' + esc(o.list[idx].k) + '">';
    return h;
  }
  function segSelect(btn) {
    var g = btn.closest('.segc');
    g.style.setProperty('--i', btn.dataset.i);
    var bs = g.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-checked', String(bs[i] === btn));
    if (g.dataset.for) $(g.dataset.for).value = btn.dataset.seg;
  }
  function ring(pct) {
    var C = 2 * Math.PI * 52, d = (pct / 100 * C).toFixed(1);
    return '<div class="ring-wrap"><svg viewBox="0 0 128 128" role="img" aria-label="' + pct + ' Prozent erledigt">' +
      '<circle class="ring-bg" cx="64" cy="64" r="52" fill="none" stroke-width="14"/>' +
      (pct > 0 ? '<circle class="ring-fg' + (pct === 100 ? ' full' : '') + '" cx="64" cy="64" r="52" fill="none" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + d + ' 327" transform="rotate(-90 64 64)"/>' : '') +
      '</svg><div class="ring-num"><span>' + pct + '<small>%</small></span></div></div>';
  }
  function weekBars(list) {
    var t0 = today(), days = [], i;
    for (i = 6; i >= 0; i--) days.push(addDays(t0, -i));
    var counts = days.map(function (d) { return list.filter(function (t) { return t.status === 'erledigt' && t.done_at && ymd(new Date(t.done_at)) === d; }).length; });
    var max = Math.max(1, Math.max.apply(null, counts)), total = counts.reduce(function (a, b) { return a + b; }, 0);
    var html = days.map(function (d, k) {
      var c = counts[k];
      return '<div class="bcol' + (d === t0 ? ' today' : '') + '"><span class="n">' + (c || '') + '</span><div class="btrack"><i class="bar-i' + (c ? '' : ' zero') + '" style="--h:' + Math.round(c / max * 100) + '%;--k:' + k + '"></i></div><span class="d">' + esc(fmtWd.format(parse(d)).replace('.', '').slice(0, 2)) + '</span></div>';
    }).join('');
    return { html: html, total: total };
  }

  /* ================= Ansicht: Heute ================= */
  function viewHeute() {
    var me = who(S.uid), h = new Date().getHours();
    var greet = h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
    var head = '<h1 class="large">' + greet + ', ' + esc(me.first) + '</h1><p class="subtitle">' + esc(fmtLong.format(new Date())) + '</p>';
    if (!S.tasks.length) return head + emptyState('Los geht’s', 'Legt eure ersten Aufgaben an. Hier seht ihr dann jeden Tag, was ansteht und wie weit ihr seid.');
    var mine = S.scope === 'me';
    var L = mine ? S.tasks.filter(function (t) { return t.assignee === S.uid; }) : S.tasks;
    var st = stats(L), wk = weekBars(L), t0 = today();
    var active = L.filter(function (t) { return t.status !== 'erledigt'; });
    var overdue = active.filter(function (t) { return t.due && t.due < t0; }).sort(sortActive);
    var dueToday = active.filter(function (t) { return t.due === t0; }).sort(sortActive);
    var working = active.filter(function (t) { return t.status === 'arbeit' && !(t.due && t.due <= t0); }).sort(sortActive);
    var shown = {}; overdue.concat(dueToday, working).forEach(function (t) { shown[t.id] = true; });
    var next = active.filter(function (t) { return !shown[t.id] && (t.priority === 3 || (t.due && t.due <= addDays(t0, 7))); }).sort(sortActive).slice(0, 5);

    var lists = '';
    if (overdue.length) lists += '<section><div class="sec-h red"><span>Überfällig</span><span>' + overdue.length + '</span></div>' + group(overdue) + '</section>';
    if (dueToday.length) lists += '<section><div class="sec-h"><span>Heute fällig</span><span>' + dueToday.length + '</span></div>' + group(dueToday) + '</section>';
    if (working.length) lists += '<section><div class="sec-h"><span>In Arbeit</span><span>' + working.length + '</span></div>' + group(working) + '</section>';
    if (next.length) lists += '<section><div class="sec-h"><span>Als Nächstes</span></div>' + group(next) + '</section>';
    if (!lists) lists = '<div class="calm">' + I.calm + '<div><b>Alles im Griff</b><span>' + (mine ? 'Für dich ist heute nichts Dringendes offen.' : 'Im Team ist heute nichts Dringendes offen.') + '</span></div></div>';

    return head + '<div class="scope">' + segc({ list: [{ k: 'me', l: 'Ich' }, { k: 'team', l: 'Team' }], sel: S.scope, action: 'scope', label: 'Ansicht' }) + '</div>' +
      '<div class="widgets"><section class="widget"><div class="w-head"><span class="w-title">' + (mine ? 'Deine Aufgaben' : 'Team gesamt') + '</span><span class="w-sub">' + st.done + ' von ' + st.total + '</span></div>' +
      '<div class="ring-line">' + ring(st.pct) + '<div class="legend">' +
      '<div class="lg"><i class="dot" style="--c:var(--accent)"></i><span>Erledigt</span><b>' + st.done + '</b></div>' +
      '<div class="lg"><i class="dot" style="--c:var(--c-orange)"></i><span>In Arbeit</span><b>' + st.work + '</b></div>' +
      '<div class="lg"><i class="dot" style="--c:var(--label3)"></i><span>Offen</span><b>' + st.open + '</b></div></div></div></section>' +
      '<section class="widget"><div class="w-head"><span class="w-title">Letzte 7 Tage</span><span class="w-sub">' + pl(wk.total, 'Aufgabe', 'Aufgaben') + ' erledigt</span></div><div class="bars">' + wk.html + '</div></section></div>' +
      '<div class="grid2">' + lists + '</div>';
  }

  /* ================= Ansicht: Board ================= */
  function boardCols() {
    var q = S.search.toLowerCase();
    var L = S.tasks.filter(function (t) {
      if (S.filterMine && t.assignee !== S.uid) return false;
      if (S.filterProject && t.project_id !== S.filterProject) return false;
      if (q && (t.title + ' ' + t.notes).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    function sect(key) {
      var all = L.filter(function (t) { return t.status === key; });
      var items = all.slice(), more = '';
      if (key === 'erledigt') {
        items.sort(function (a, b) { return (b.done_at || '') < (a.done_at || '') ? -1 : 1; });
        if (items.length > 5 && !q) {
          more = '<button type="button" class="row-btn center" data-action="toggle-done">' + (S.showAllDone ? 'Weniger anzeigen' : 'Alle ' + items.length + ' anzeigen') + '</button>';
          if (!S.showAllDone) items = items.slice(0, 5);
        }
      } else items.sort(sortActive);
      if (q && !all.length) return '';
      return '<section data-col="' + key + '" class="' + (S.boardStatus === key ? 'active' : '') + '"><div class="sec-h"><span>' + SL[key] + '</span><span>' + all.length + '</span></div>' +
        (items.length ? '<div class="group">' + items.map(row).join('') + more + '</div>' : '<p class="empty-col">Keine Aufgaben</p>') + '</section>';
    }
    var html = sect('offen') + sect('arbeit') + sect('erledigt');
    return html || '<p class="empty-col">Keine Treffer für „' + esc(S.search) + '“</p>';
  }
  function viewBoard() {
    var title = '<h1 class="large title-only">Board</h1>';
    if (!S.tasks.length) return title + emptyState('Das Board ist leer', 'Sobald ihr Aufgaben anlegt, erscheinen sie hier nach Status sortiert.');
    var projOpts = '<option value="">Alle Projekte</option>' + S.projects.slice().sort(byName).map(function (p) {
      return '<option value="' + esc(p.id) + '"' + (S.filterProject === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>';
    }).join('');
    return title + '<div class="board-bar"><div class="search">' + I.search + '<label class="vh" for="f-search">Aufgaben suchen</label><input id="f-search" type="search" placeholder="Suchen" autocomplete="off" value="' + esc(S.search) + '"></div>' +
      '<div class="statseg">' + segc({ list: STATUS, sel: S.boardStatus, action: 'board-status', label: 'Status' }) + '</div>' +
      '<div class="filters">' + segc({ list: [{ k: 'all', l: 'Alle' }, { k: 'mine', l: 'Meine' }], sel: S.filterMine ? 'mine' : 'all', action: 'board-filter', cls: 'auto', label: 'Zuständigkeit' }) +
      '<label class="vh" for="f-project">Projekt filtern</label><select class="pill" id="f-project">' + projOpts + '</select></div></div>' +
      '<div class="cols' + (S.search ? ' searching' : '') + '" id="board-cols">' + boardCols() + '</div>';
  }
  function byName(a, b) { return String(a.name).localeCompare(String(b.name), 'de'); }

  /* ================= Ansicht: Projekte ================= */
  function viewProjekte() {
    var title = '<h1 class="large title-only">Projekte</h1>';
    var rows = S.projects.slice().sort(byName).map(function (p) {
      var list = S.tasks.filter(function (t) { return t.project_id === p.id; }), st = stats(list);
      var late = p.due && p.due < today() && st.pct < 100;
      var dl = p.due ? '<span class="it' + (late ? ' bad' : '') + '">bis ' + esc(fmtShort.format(parse(p.due))) + '</span>' : '';
      return '<button type="button" class="row-btn proj-row" data-action="open-project" data-id="' + esc(p.id) + '"><span class="txt">' +
        '<span class="p-name"><b><i class="dot" style="--c:var(--c-' + colorOf(p.color) + ');margin-right:8px"></i>' + esc(p.name) + '</b><span>' + st.pct + ' %</span></span>' + pbar(st.pct, p.color) +
        '<span class="sub">' + (list.length ? '<span class="it">' + st.open + ' offen · ' + st.work + ' in Arbeit · ' + st.done + ' erledigt</span>' : '<span class="it">Noch keine Aufgaben</span>') + dl + '</span></span><i class="chev"></i></button>';
    });
    var orphans = S.tasks.filter(function (t) { return !t.project_id; });
    if (orphans.length) {
      var st = stats(orphans);
      rows.push('<div class="row-btn static proj-row"><span class="txt"><span class="p-name"><b>Ohne Projekt</b><span>' + st.pct + ' %</span></span>' + pbar(st.pct, 'gray') +
        '<span class="sub"><span class="it">' + st.open + ' offen · ' + st.work + ' in Arbeit · ' + st.done + ' erledigt</span></span></span></div>');
    }
    if (!rows.length) return title + emptyState('Noch kein Projekt', 'Ein Projekt fasst Aufgaben zusammen und zeigt ihren Fortschritt. Legt das erste an.');
    return title + '<div class="link-row"><button class="txt-btn strong" type="button" data-action="new-project">+ Neues Projekt</button></div><div class="group">' + rows.join('') + '</div>';
  }

  /* ================= Ansicht: Team ================= */
  function activityText(a) {
    var n = esc(who(a.actor).name), t = '<q>' + esc(a.title) + '</q>';
    switch (a.kind) {
      case 'created': return '<b>' + n + '</b> hat ' + t + ' angelegt';
      case 'done': return '<b>' + n + '</b> hat ' + t + ' erledigt';
      case 'started': return '<b>' + n + '</b> arbeitet an ' + t;
      case 'reopened': return '<b>' + n + '</b> hat ' + t + ' wieder geöffnet';
      case 'deleted': return '<b>' + n + '</b> hat ' + t + ' gelöscht';
      case 'comment': return '<b>' + n + '</b> hat ' + t + ' kommentiert';
      case 'joined': return '<b>' + n + '</b> ist dem Team beigetreten';
      default: return '<b>' + n + '</b> hat etwas geändert';
    }
  }
  function viewTeam() {
    var ws = currentWs(), owner = iAmOwner();
    var code = ws ? ws.invite_code : '';
    var shown = code.slice(0, 5) + '-' + code.slice(5);
    var invite = '<section class="invite"><div class="w-title">Kollegen einladen</div><p>Er erstellt in Effectra ein Konto und gibt diesen Code ein. Teilt ihn nur mit Leuten, die ins Team sollen.</p>' +
      '<div class="code-line"><span class="code" id="invite-code">' + esc(shown) + '</span><button class="btn-t" type="button" data-action="copy-code" style="height:44px">Kopieren</button>' +
      (owner ? '<button class="txt-btn small" type="button" data-action="rotate-code">Neuen Code erzeugen</button>' : '') + '</div></section>';
    var members = S.members.slice().sort(function (a, b) { return a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : (a.joined_at < b.joined_at ? -1 : 1); }).map(function (m) {
      var w = who(m.user_id), st = stats(S.tasks.filter(function (t) { return t.assignee === m.user_id; }));
      var kick = owner && m.user_id !== S.uid ? '<button type="button" class="txt-btn small danger" data-action="kick" data-id="' + esc(m.user_id) + '">' + (S.armed === 'kick:' + m.user_id ? 'Wirklich?' : 'Entfernen') + '</button>' : '';
      return '<div class="row person">' + avatar(m.user_id, 'l') + '<div class="txt"><div class="p-name"><b>' + esc(w.label) + (m.role === 'owner' ? '<span class="badge">Besitzer</span>' : '') + '</b><span>' + st.done + ' von ' + st.total + '</span></div>' + pbar(st.pct) +
        '<span class="sub"><span class="it">' + st.open + ' offen · ' + st.work + ' in Arbeit · ' + st.done + ' erledigt</span></span></div>' + kick + '</div>';
    }).join('');
    var feed = S.activity.length ? '<div class="group feed">' + S.activity.slice(0, 30).map(function (a) {
      var exists = a.task_id && byId(S.tasks, a.task_id);
      var inner = avatar(a.actor, 's') + '<span class="txt"><span>' + activityText(a) + '</span><span class="when">' + esc(ago(a.created_at)) + '</span></span>';
      return exists ? '<button type="button" class="row-btn" data-action="open-task" data-id="' + esc(a.task_id) + '" style="--inset:54px">' + inner + '</button>' : '<div class="row-btn static" style="--inset:54px">' + inner + '</div>';
    }).join('') + '</div>' : '<p class="empty-col">Noch keine Aktivität</p>';
    return '<h1 class="large title-only">' + esc(ws ? ws.name : 'Team') + '</h1>' + invite +
      '<div class="grid2"><section><div class="sec-h"><span>Mitglieder</span><span>' + S.members.length + '</span></div><div class="group">' + members + '</div></section>' +
      '<section><div class="sec-h"><span>Aktivität</span></div>' + feed + '</section></div>';
  }

  /* ================= Zeichnen ================= */
  function render() {
    if (S.screen !== 'app') return;
    $('screen').hidden = true; $('screen').innerHTML = '';
    $('app').hidden = false; $('fab').hidden = false;
    document.body.classList.remove('plain');
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].dataset.tab === S.tab) tabs[i].setAttribute('aria-current', 'page'); else tabs[i].removeAttribute('aria-current');
    }
    var ws = currentWs();
    $('ws-name').textContent = ws ? ws.name : 'Effectra';
    $('me-btn').innerHTML = avatar(S.uid);
    var active = document.activeElement, keepSearch = active && active.id === 'f-search', caret = keepSearch ? active.selectionStart : 0;
    var v = $('view');
    v.classList.toggle('anim', S.animNext); S.animNext = false;
    v.innerHTML = S.tab === 'board' ? viewBoard() : S.tab === 'projekte' ? viewProjekte() : S.tab === 'team' ? viewTeam() : viewHeute();
    if (keepSearch) { var f = $('f-search'); if (f) { f.focus(); try { f.setSelectionRange(caret, caret); } catch (e) {} } }
  }
  function queue() {
    if (S.pending) return;
    S.pending = true;
    setTimeout(function () { S.pending = false; render(); }, Math.max(16, S.hold - Date.now()));
  }

  /* ================= Eingabeblätter ================= */
  function opts(list, sel) {
    return list.map(function (o) { return '<option value="' + esc(o.k) + '"' + (String(o.k) === String(sel) ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('');
  }
  function head(title, saveLabel, cancel) {
    return '<div class="grab" aria-hidden="true"></div><header class="sh-head"><button type="button" class="txt-btn" data-action="close-sheet">' + (cancel || 'Abbrechen') + '</button>' +
      '<h2 id="sheet-title">' + esc(title) + '</h2>' + (saveLabel ? '<button type="submit" class="txt-btn strong" id="save-btn">' + saveLabel + '</button>' : '<span></span>') + '</header>';
  }
  function wrapForm(id, dataId, inner) {
    return '<div class="backdrop" data-action="close-sheet"></div><form class="panel" id="' + id + '" data-id="' + esc(dataId || '') + '" novalidate role="dialog" aria-modal="true" aria-labelledby="sheet-title">' + inner + '</form>';
  }

  function taskSheet(id) {
    var t = id ? byId(S.tasks, id) : null;
    if (id && !t) return '';
    var v = t || { title: '', notes: '', status: S.tab === 'board' ? S.boardStatus : 'offen', priority: 2, due: '', project_id: S.filterProject || '', assignee: S.uid };
    var projects = [{ k: '', l: 'Ohne Projekt' }].concat(S.projects.slice().sort(byName).map(function (p) { return { k: p.id, l: p.name }; }));
    var people = [{ k: '', l: 'Niemand' }].concat(S.members.map(function (m) { return { k: m.user_id, l: who(m.user_id).label }; }));
    var meta = t ? '<p class="meta-line">Angelegt ' + (t.created_by ? 'von ' + esc(who(t.created_by).name) + ' ' : '') + esc(ago(t.created_at)) + (t.done_at ? ' · erledigt ' + esc(ago(t.done_at)) : '') + '</p>' : '';
    return wrapForm('task-form', id, head(t ? 'Aufgabe' : 'Neue Aufgabe', t ? 'Sichern' : 'Hinzufügen') +
      '<div class="group first"><div class="f row"><input id="t-title" type="text" maxlength="200" autocomplete="off" placeholder="Titel" aria-label="Titel" value="' + esc(v.title) + '"></div>' +
      '<div class="f row"><textarea id="t-notes" rows="3" maxlength="5000" placeholder="Notizen" aria-label="Notizen">' + esc(v.notes) + '</textarea></div></div>' +
      '<div class="group" style="margin-top:18px">' +
      '<label class="f row" for="t-project"><span class="lbl">Projekt</span><span class="val"><select id="t-project">' + opts(projects, v.project_id || '') + '</select><i class="chev"></i></span></label>' +
      '<label class="f row" for="t-assignee"><span class="lbl">Zuständig</span><span class="val"><select id="t-assignee">' + opts(people, v.assignee || '') + '</select><i class="chev"></i></span></label>' +
      '<label class="f row" for="t-due"><span class="lbl">Fällig am</span><span class="val"><button type="button" class="txt-btn" id="clear-due" data-action="clear-due"' + (v.due ? '' : ' hidden') + '>Entfernen</button><input id="t-due" type="date" value="' + esc(v.due || '') + '"></span></label></div>' +
      '<div class="sec-h"><span>Status</span></div>' + segc({ id: 't-status', list: STATUS, sel: v.status, label: 'Status' }) +
      '<div class="sec-h"><span>Priorität</span></div>' + segc({ id: 't-priority', list: PRIO, sel: v.priority, label: 'Priorität' }) +
      '<div class="sec-h"><span>Unteraufgaben</span><span id="sub-count"></span></div><div class="group" id="subs"></div>' +
      (t ? '<div class="sec-h"><span>Kommentare</span></div><div class="group" id="comments"></div>' : '') +
      '<div class="form-error" id="form-error" role="alert"></div>' + meta +
      (t ? '<div class="group" style="margin-top:18px"><button type="button" class="row-btn destructive" data-action="delete-task">Aufgabe löschen</button></div>' : ''));
  }
  function renderSubs() {
    var box = $('subs'); if (!box || !S.sheet) return;
    var id = S.sheet.id;
    var list = id ? subsOf(id) : S.draftSubs.map(function (title, i) { return { id: 'd' + i, title: title, done: false }; });
    var doneN = list.filter(function (s) { return s.done; }).length;
    $('sub-count').textContent = list.length ? doneN + '/' + list.length : '';
    box.innerHTML = list.map(function (s) {
      return '<div class="subrow' + (s.done ? ' done' : '') + '">' +
        (id ? '<button type="button" class="state" data-action="sub-toggle" data-id="' + esc(s.id) + '" data-s="' + (s.done ? 'erledigt' : 'offen') + '" aria-label="' + esc((s.done ? 'Als offen markieren: ' : 'Abhaken: ') + s.title) + '"><i>' + (s.done ? I.check : '') + '</i></button>' : '<span class="state" data-s="offen" aria-hidden="true"><i></i></span>') +
        '<span class="st-title">' + esc(s.title) + '</span><button type="button" class="x-btn" data-action="sub-del" data-id="' + esc(s.id) + '" aria-label="' + esc('Entfernen: ' + s.title) + '">×</button></div>';
    }).join('') +
      '<div class="add-sub"><span class="plus" aria-hidden="true">+</span><label class="vh" for="sub-new">Unteraufgabe hinzufügen</label><input id="sub-new" type="text" maxlength="200" placeholder="Unteraufgabe hinzufügen" autocomplete="off" enterkeyhint="done"></div>';
  }
  function renderComments() {
    var box = $('comments'); if (!box || !S.sheet || !S.sheet.id) return;
    var draft = $('c-new') ? $('c-new').value : '';
    var hadFocus = document.activeElement && document.activeElement.id === 'c-new';
    var owner = iAmOwner();
    box.innerHTML = commentsOf(S.sheet.id).map(function (c) {
      var w = who(c.author), mine = c.author === S.uid;
      return '<div class="comment">' + avatar(c.author, 's') + '<div class="body"><div class="head"><b>' + esc(w.name) + '</b><span>' + esc(ago(c.created_at)) + '</span>' +
        (mine || owner ? '<button type="button" class="txt-btn danger" data-action="comment-del" data-id="' + esc(c.id) + '">' + (S.armed === 'c:' + c.id ? 'Wirklich löschen?' : 'Löschen') + '</button>' : '') +
        '</div><p>' + esc(c.body) + '</p></div></div>';
    }).join('') +
      '<div class="composer"><label class="vh" for="c-new">Kommentar schreiben</label><textarea id="c-new" rows="1" maxlength="2000" placeholder="Kommentar schreiben …"></textarea>' +
      '<button type="button" class="send" id="c-send" data-action="comment-send" aria-label="Kommentar senden" disabled>' + I.up + '</button></div>';
    var ta = $('c-new'); ta.value = draft; $('c-send').disabled = !draft.trim(); autoGrow(ta);
    if (hadFocus) ta.focus();
  }
  function autoGrow(ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; }
  function refreshSheet() {
    if (!S.sheet || S.sheet.kind !== 'task') return;
    if (S.sheet.id && !byId(S.tasks, S.sheet.id)) return;
    renderSubs(); renderComments();
  }

  function projectSheet(id) {
    var p = id ? byId(S.projects, id) : null;
    if (id && !p) return '';
    var color = p ? colorOf(p.color) : COLORS[S.projects.length % COLORS.length];
    var sw = COLORS.map(function (c) {
      return '<button type="button" class="sw" role="radio" aria-checked="' + (c === color) + '" aria-label="' + COLOR_NAMES[c] + '" data-action="pick-color" data-color="' + c + '" style="--c:var(--c-' + c + ')"></button>';
    }).join('');
    return wrapForm('project-form', id, head(p ? 'Projekt' : 'Neues Projekt', p ? 'Sichern' : 'Anlegen') +
      '<div class="group first"><div class="f row"><input id="p-name" type="text" maxlength="80" autocomplete="off" placeholder="Name" aria-label="Name" value="' + esc(p ? p.name : '') + '"></div>' +
      '<label class="f row" for="p-due"><span class="lbl">Deadline</span><span class="val"><button type="button" class="txt-btn" id="clear-pdue" data-action="clear-pdue"' + (p && p.due ? '' : ' hidden') + '>Entfernen</button><input id="p-due" type="date" value="' + esc(p && p.due ? p.due : '') + '"></span></label></div>' +
      '<div class="sec-h"><span>Farbe</span></div><div class="group"><div class="swatches" role="radiogroup" aria-label="Farbe">' + sw + '</div></div><input type="hidden" id="p-color" value="' + color + '">' +
      '<div class="form-error" id="form-error" role="alert"></div>' +
      (p ? '<div class="group" style="margin-top:18px"><button type="button" class="row-btn accent" data-action="project-board" data-id="' + esc(p.id) + '"><span class="grow">Aufgaben im Board zeigen</span><i class="chev"></i></button></div>' +
        '<div class="group" style="margin-top:18px"><button type="button" class="row-btn destructive" data-action="delete-project">Projekt löschen</button></div><p class="meta-line">Beim Löschen bleiben die Aufgaben erhalten, sie stehen dann ohne Projekt da.</p>' : ''));
  }

  function settingsSheet() {
    var ws = currentWs(), owner = iAmOwner(), me = S.profiles[S.uid] || {};
    var switcher = S.workspaces.map(function (w) {
      return '<button type="button" class="row-btn" data-action="switch-ws" data-id="' + esc(w.id) + '"><span class="grow">' + esc(w.name) + '</span>' + (w.id === S.ws ? '<span class="check-mark">' + I.tick + '</span>' : '') + '</button>';
    }).join('');
    return wrapForm('settings-form', '', head('Einstellungen', '', 'Fertig') +
      '<div class="sec-h"><span>Profil</span></div><div class="group"><div class="f row"><label class="vh" for="s-name">Dein Name</label><input id="s-name" type="text" maxlength="60" placeholder="Dein Name" value="' + esc(me.display_name || '') + '"><button type="button" class="txt-btn strong" data-action="save-name">Sichern</button></div>' +
      '<div class="row-btn static"><span class="grow muted">' + esc(S.email) + '</span></div></div>' +
      (owner ? '<div class="sec-h"><span>Teamname</span></div><div class="group"><div class="f row"><label class="vh" for="s-ws">Teamname</label><input id="s-ws" type="text" maxlength="60" value="' + esc(ws ? ws.name : '') + '"><button type="button" class="txt-btn strong" data-action="save-ws">Sichern</button></div></div>' : '') +
      '<div class="sec-h"><span>Teams</span></div><div class="group">' + switcher + '<button type="button" class="row-btn accent" data-action="onboard"><span class="grow">Team gründen oder beitreten</span><i class="chev"></i></button></div>' +
      '<div class="form-error" id="form-error" role="alert"></div>' +
      '<div class="group" style="margin-top:8px">' + (owner ? '<button type="button" class="row-btn destructive" data-action="delete-ws">Team „' + esc(ws ? ws.name : '') + '“ löschen</button>' : '<button type="button" class="row-btn destructive" data-action="leave-ws">Team verlassen</button>') + '</div>' +
      '<div class="group" style="margin-top:18px"><button type="button" class="row-btn destructive" data-action="logout">Abmelden</button></div>' +
      '<p class="meta-line">Effectra · Deine Daten liegen in eurer eigenen Supabase-Datenbank.</p>');
  }

  function openSheet(kind, id) {
    var html = kind === 'task' ? taskSheet(id) : kind === 'project' ? projectSheet(id) : settingsSheet();
    if (!html) return;
    clearTimeout(S.closeTimer);
    S.armed = null; S.sheet = { kind: kind, id: id || '' }; S.last = document.activeElement; S.draftSubs = [];
    var el = $('sheet');
    el.classList.remove('closing');
    el.innerHTML = html; el.hidden = false;
    document.documentElement.classList.add('lock');
    if (kind === 'task') refreshSheet();
    if (!id && kind !== 'settings') { var first = el.querySelector('input[type="text"]'); if (first) first.focus(); }
  }
  function closeSheet() {
    if (!S.sheet) return;
    S.sheet = null; S.armed = null;
    var el = $('sheet');
    el.classList.add('closing');
    document.documentElement.classList.remove('lock');
    clearTimeout(S.closeTimer);
    S.closeTimer = setTimeout(function () { el.hidden = true; el.innerHTML = ''; el.classList.remove('closing'); }, 230);
    if (S.last && S.last.focus && document.body.contains(S.last)) { try { S.last.focus({ preventScroll: true }); } catch (e) {} }
  }
  function formError(msg) { var e = $('form-error'); if (e) e.textContent = msg; }
  function lockSave(on) { var b = $('save-btn'); if (b) b.disabled = on; }
  function arm(btn, key, label) {
    if (S.armed === key) return true;
    S.armed = key; btn.textContent = label; btn.classList.add('armed');
    return false;
  }

  /* ================= Schreiben ================= */
  function saveTask(form) {
    var g = function (id) { return form.querySelector('#' + id).value; };
    var title = g('t-title').trim();
    if (!title) { formError('Bitte einen Titel eingeben.'); form.querySelector('#t-title').focus(); return; }
    var data = { title: title, notes: g('t-notes').trim(), project_id: g('t-project') || null, assignee: g('t-assignee') || null,
      status: g('t-status'), priority: Number(g('t-priority')), due: g('t-due') || null };
    var id = form.dataset.id;
    lockSave(true);
    var job;
    if (id) {
      job = run(S.sb.from('tasks').update(data).eq('id', id).select().single()).then(function (row) { if (row) upsert('tasks', row); });
    } else {
      data.workspace_id = S.ws;
      var subs = S.draftSubs.slice();
      job = run(S.sb.from('tasks').insert(data).select().single()).then(function (row) {
        upsert('tasks', row);
        if (!subs.length) return;
        return run(S.sb.from('subtasks').insert(subs.map(function (t, i) { return { task_id: row.id, workspace_id: S.ws, title: t, position: i }; })).select())
          .then(function (rows) { (rows || []).forEach(function (r) { upsert('subtasks', r); }); });
      });
    }
    job.then(function () { closeSheet(); toast(id ? 'Gesichert' : 'Aufgabe angelegt'); queue(); }, function (e) { lockSave(false); formError(errText(e)); });
  }
  function saveProject(form) {
    var name = form.querySelector('#p-name').value.trim();
    if (!name) { formError('Bitte einen Namen eingeben.'); return; }
    var data = { name: name, color: colorOf(form.querySelector('#p-color').value), due: form.querySelector('#p-due').value || null };
    var id = form.dataset.id;
    lockSave(true);
    var job = id ? run(S.sb.from('projects').update(data).eq('id', id).select().single())
      : run(S.sb.from('projects').insert(Object.assign({ workspace_id: S.ws }, data)).select().single());
    job.then(function (row) { if (row) upsert('projects', row); closeSheet(); queue(); }, function (e) { lockSave(false); formError(errText(e)); });
  }
  function cycle(btn) {
    var id = btn.dataset.id, t = byId(S.tasks, id);
    if (!t || S.busy[id]) return;
    var prev = t.status, next = NEXT[prev] || 'offen';
    t.status = next;
    btn.dataset.s = next;
    btn.querySelector('i').innerHTML = next === 'erledigt' ? I.check : '';
    var r = btn.closest('.row'); if (r) r.classList.toggle('is-done', next === 'erledigt');
    S.hold = Date.now() + 450;
    S.busy[id] = true;
    run(S.sb.from('tasks').update({ status: next }).eq('id', id).select().single())
      .then(function (row) { if (row) upsert('tasks', row); queue(); })
      .catch(function (e) { t.status = prev; S.hold = 0; toast(errText(e)); queue(); })
      .then(function () { delete S.busy[id]; });
  }
  function addSub(input) {
    var title = input.value.trim(); if (!title) return;
    input.value = '';
    if (!S.sheet.id) { S.draftSubs.push(title.slice(0, 200)); renderSubs(); $('sub-new').focus(); return; }
    var list = subsOf(S.sheet.id), pos = list.length ? list[list.length - 1].position + 1 : 0;
    run(S.sb.from('subtasks').insert({ task_id: S.sheet.id, workspace_id: S.ws, title: title, position: pos }).select().single())
      .then(function (row) { upsert('subtasks', row); renderSubs(); queue(); var n = $('sub-new'); if (n) n.focus(); })
      .catch(function (e) { toast(errText(e)); });
  }
  function toggleSub(id) {
    var s = byId(S.subtasks, id); if (!s || S.busy[id]) return;
    s.done = !s.done; renderSubs(); S.busy[id] = true;
    run(S.sb.from('subtasks').update({ done: s.done }).eq('id', id))
      .catch(function (e) { s.done = !s.done; renderSubs(); toast(errText(e)); })
      .then(function () { delete S.busy[id]; queue(); });
  }
  function delSub(id) {
    if (!S.sheet.id) { S.draftSubs.splice(Number(id.slice(1)), 1); renderSubs(); return; }
    var s = byId(S.subtasks, id); if (!s) return;
    S.subtasks = S.subtasks.filter(function (x) { return x.id !== id; }); renderSubs();
    run(S.sb.from('subtasks').delete().eq('id', id)).then(queue, function (e) { S.subtasks.push(s); renderSubs(); toast(errText(e)); });
  }
  function sendComment() {
    var ta = $('c-new'), body = ta.value.trim(); if (!body || !S.sheet.id) return;
    $('c-send').disabled = true;
    run(S.sb.from('comments').insert({ task_id: S.sheet.id, workspace_id: S.ws, body: body }).select().single())
      .then(function (row) { upsert('comments', row); ta.value = ''; renderComments(); queue(); })
      .catch(function (e) { $('c-send').disabled = false; toast(errText(e)); });
  }

  /* ================= Ereignisse ================= */
  document.addEventListener('click', function (e) {
    var authLink = e.target.closest('[data-auth]');
    if (authLink) { S.authMode = authLink.dataset.auth; authScreen(); return; }
    var tab = e.target.closest('[data-tab]');
    if (tab) { if (S.tab !== tab.dataset.tab) { S.tab = tab.dataset.tab; S.animNext = true; render(); window.scrollTo(0, 0); } return; }
    var sb = e.target.closest('.segc button');
    if (sb) segSelect(sb);
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var a = el.dataset.action, id = el.dataset.id;
    switch (a) {
      case 'new-task': openSheet('task'); break;
      case 'new-project': openSheet('project'); break;
      case 'open-task': openSheet('task', id); break;
      case 'open-project': openSheet('project', id); break;
      case 'settings': openSheet('settings'); break;
      case 'close-sheet': closeSheet(); break;
      case 'cycle': cycle(el); break;
      case 'scope': S.scope = el.dataset.seg; setTimeout(render, 180); break;
      case 'board-status':
        S.boardStatus = el.dataset.seg;
        document.querySelectorAll('.cols > section').forEach(function (s) { s.classList.toggle('active', s.dataset.col === S.boardStatus); });
        break;
      case 'board-filter': S.filterMine = el.dataset.seg === 'mine'; $('board-cols').innerHTML = boardCols(); break;
      case 'toggle-done': S.showAllDone = !S.showAllDone; $('board-cols').innerHTML = boardCols(); break;
      case 'clear-due': $('t-due').value = ''; el.hidden = true; break;
      case 'clear-pdue': $('p-due').value = ''; el.hidden = true; break;
      case 'pick-color':
        $('p-color').value = el.dataset.color;
        document.querySelectorAll('.sw').forEach(function (b) { b.setAttribute('aria-checked', String(b === el)); });
        break;
      case 'sub-toggle': toggleSub(id); break;
      case 'sub-del': delSub(id); break;
      case 'comment-send': sendComment(); break;
      case 'comment-del':
        if (!arm(el, 'c:' + id, 'Wirklich löschen?')) break;
        S.armed = null;
        run(S.sb.from('comments').delete().eq('id', id)).then(function () { S.comments = S.comments.filter(function (c) { return c.id !== id; }); renderComments(); queue(); }, function (er) { toast(errText(er)); });
        break;
      case 'delete-task':
        if (!arm(el, 'del-task', 'Wirklich löschen?')) break;
        el.disabled = true;
        var tid = S.sheet.id;
        run(S.sb.from('tasks').delete().eq('id', tid)).then(function () { S.tasks = S.tasks.filter(function (t) { return t.id !== tid; }); closeSheet(); toast('Aufgabe gelöscht'); queue(); }, function (er) { el.disabled = false; formError(errText(er)); });
        break;
      case 'delete-project':
        if (!arm(el, 'del-project', 'Wirklich löschen?')) break;
        el.disabled = true;
        var pid = S.sheet.id;
        run(S.sb.from('projects').delete().eq('id', pid)).then(function () {
          S.projects = S.projects.filter(function (p) { return p.id !== pid; });
          S.tasks.forEach(function (t) { if (t.project_id === pid) t.project_id = null; });
          if (S.filterProject === pid) S.filterProject = '';
          closeSheet(); queue();
        }, function (er) { el.disabled = false; formError(errText(er)); });
        break;
      case 'project-board': S.filterProject = id; S.tab = 'board'; S.search = ''; closeSheet(); S.animNext = true; render(); window.scrollTo(0, 0); break;
      case 'copy-code': var w = currentWs(); if (w) copyText(w.invite_code, 'Code kopiert'); break;
      case 'rotate-code':
        if (!arm(el, 'rotate', 'Alter Code wird ungültig. Sicher?')) break;
        S.armed = null;
        run(S.sb.rpc('rotate_invite_code', { p_ws: S.ws })).then(function (code) { var w2 = currentWs(); if (w2) w2.invite_code = code; toast('Neuer Code erstellt'); render(); }, function (er) { toast(errText(er)); render(); });
        break;
      case 'kick':
        if (S.armed !== 'kick:' + id) { S.armed = 'kick:' + id; render(); break; }
        S.armed = null;
        run(S.sb.from('workspace_members').delete().eq('workspace_id', S.ws).eq('user_id', id)).then(function () {
          S.members = S.members.filter(function (m) { return m.user_id !== id; });
          S.tasks.forEach(function (t) { if (t.assignee === id) t.assignee = null; });
          toast('Mitglied entfernt'); render();
        }, function (er) { toast(errText(er)); render(); });
        break;
      case 'save-name':
        var nm = $('s-name').value.trim().slice(0, 60);
        run(S.sb.from('profiles').update({ display_name: nm }).eq('id', S.uid)).then(function () {
          S.profiles[S.uid] = Object.assign({}, S.profiles[S.uid], { id: S.uid, display_name: nm }); toast('Name gesichert'); render();
        }, function (er) { formError(errText(er)); });
        break;
      case 'save-ws':
        var wn = $('s-ws').value.trim();
        if (!wn) { formError('Der Teamname darf nicht leer sein.'); break; }
        run(S.sb.from('workspaces').update({ name: wn }).eq('id', S.ws)).then(function () { var w3 = currentWs(); if (w3) w3.name = wn; toast('Teamname gesichert'); render(); }, function (er) { formError(errText(er)); });
        break;
      case 'switch-ws': if (id !== S.ws) { closeSheet(); S.tab = 'heute'; openWs(id); } break;
      case 'onboard': closeSheet(); S.onbBack = true; S.screen = 'onboarding'; onboardingScreen(); break;
      case 'onb-back': S.onbBack = false; S.screen = 'app'; S.animNext = true; render(); break;
      case 'delete-ws':
        if (!arm(el, 'del-ws', 'Alles endgültig löschen?')) break;
        el.disabled = true;
        run(S.sb.from('workspaces').delete().eq('id', S.ws)).then(function () { closeSheet(); ls(LS_WS, null); S.ws = null; unsubscribe(); toast('Team gelöscht'); start(); }, function (er) { el.disabled = false; formError(errText(er)); });
        break;
      case 'leave-ws':
        if (!arm(el, 'leave', 'Wirklich verlassen?')) break;
        el.disabled = true;
        run(S.sb.from('workspace_members').delete().eq('workspace_id', S.ws).eq('user_id', S.uid)).then(function () { closeSheet(); ls(LS_WS, null); S.ws = null; unsubscribe(); start(); }, function (er) { el.disabled = false; formError(errText(er)); });
        break;
      case 'logout': closeSheet(); unsubscribe(); S.sb.auth.signOut(); break;
      case 'retry': start(); break;
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'f-search') { S.search = e.target.value; var c = $('board-cols'); c.classList.toggle('searching', !!S.search); c.innerHTML = boardCols(); }
    else if (e.target.id === 'c-new') { $('c-send').disabled = !e.target.value.trim(); autoGrow(e.target); }
  });
  document.addEventListener('change', function (e) {
    var id = e.target.id;
    if (id === 'f-project') { S.filterProject = e.target.value; $('board-cols').innerHTML = boardCols(); }
    else if (id === 't-due') { var c = $('clear-due'); if (c) c.hidden = !e.target.value; }
    else if (id === 'p-due') { var c2 = $('clear-pdue'); if (c2) c2.hidden = !e.target.value; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && S.sheet) { closeSheet(); return; }
    if (e.key === 'Enter' && e.target.id === 'sub-new') { e.preventDefault(); addSub(e.target); return; }
    if (e.key === 'Enter' && e.target.id === 'c-new' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendComment(); }
  });
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.id === 'auth-form') authSubmit(f);
    else if (f.id === 'task-form') saveTask(f);
    else if (f.id === 'project-form') saveProject(f);
    else if (f.id === 'create-form') {
      var name = $('o-name').value.trim();
      if (!name) { onboardingScreen('Bitte gib einen Teamnamen ein.'); return; }
      f.querySelector('button').disabled = true;
      run(S.sb.rpc('create_workspace', { p_name: name })).then(function (ws) { S.onbBack = false; ls(LS_WS, ws); S.tab = 'team'; start(); }, function (er) { onboardingScreen(errText(er)); });
    } else if (f.id === 'join-form') {
      var code = $('o-code').value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (code.length !== 10) { onboardingScreen('Der Code hat 10 Zeichen, zum Beispiel ABCDE-FGHJK.'); return; }
      f.querySelector('button').disabled = true;
      run(S.sb.rpc('join_workspace', { p_code: code })).then(function (ws) { S.onbBack = false; ls(LS_WS, ws); S.tab = 'heute'; start(); }, function (er) { onboardingScreen(errText(er)); });
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && S.screen === 'app' && Date.now() - S.lastLoad > 20000) loadWs();
  });
  window.addEventListener('online', function () { if (S.screen === 'app') loadWs(); });

  /* ================= Start ================= */
  function boot() {
    var cfg = window.EFFECTRA_CONFIG || {};
    if (!window.supabase || !window.supabase.createClient) {
      showScreen('<div class="setup"><h1 class="large">Keine Verbindung</h1><p class="subtitle">Effectra konnte nicht geladen werden. Prüfe deine Internetverbindung und lade die Seite neu.</p></div>');
      return;
    }
    if (!cfg.supabaseUrl || /DEIN-PROJEKT/.test(cfg.supabaseUrl) || !cfg.supabaseAnonKey || /DEIN-/.test(cfg.supabaseAnonKey)) { setupScreen(); return; }
    S.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    S.sb.auth.onAuthStateChange(function (event, session) {
      if (event === 'PASSWORD_RECOVERY') { S.recovery = true; S.authMode = 'reset'; S.screen = 'auth'; authScreen('Lege jetzt dein neues Passwort fest.', 'ok'); return; }
      if (S.recovery) return;
      var uid = session && session.user ? session.user.id : null;
      if (!uid) {
        unsubscribe(); S.uid = null; S.ws = null; S.workspaces = []; S.profiles = {}; S.screen = 'auth';
        if (event === 'SIGNED_OUT') S.authMode = 'login';
        authScreen(); return;
      }
      S.email = session.user.email || '';
      if (uid !== S.uid) { S.uid = uid; setTimeout(start, 0); }
    });
  }
  boot();
})();
