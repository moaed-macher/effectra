/* Effectra – App-Logik (läuft komplett im Browser, Daten liegen in Supabase) */
(function () {
  'use strict';

  /* ================= Konstanten ================= */
  var SL = { offen: 'Offen', arbeit: 'In Arbeit', erledigt: 'Erledigt' };
  var NEXT = { offen: 'arbeit', arbeit: 'erledigt', erledigt: 'offen' };
  var STATUS = [{ k: 'offen', l: 'Offen' }, { k: 'arbeit', l: 'In Arbeit' }, { k: 'erledigt', l: 'Erledigt' }];
  var REPEAT = [{ k: '', l: 'Nie' }, { k: 'daily', l: 'Täglich' }, { k: 'weekdays', l: 'Werktags (Mo–Fr)' }, { k: 'weekly', l: 'Wöchentlich' }, { k: 'monthly', l: 'Monatlich' }];
  var REPEAT_L = { daily: 'täglich', weekdays: 'werktags', weekly: 'wöchentlich', monthly: 'monatlich' };
  var PRIO = [{ k: 1, l: 'Niedrig' }, { k: 2, l: 'Normal' }, { k: 3, l: 'Hoch' }];
  var COLORS = ['blue', 'green', 'orange', 'red', 'purple', 'teal', 'pink', 'gray'];
  var COLOR_NAMES = { blue: 'Blau', green: 'Grün', orange: 'Orange', red: 'Rot', purple: 'Lila', teal: 'Türkis', pink: 'Pink', gray: 'Grau' };
  var LS_WS = 'effectra.ws';
  var LS_THEME = 'effectra.theme';
  var LS_FOCUS = 'effectra.focus';
  var TABS = ['heute', 'board', 'kalender', 'projekte', 'berichte', 'team'];
  var THEMES = [{ k: 'auto', l: 'Automatisch' }, { k: 'light', l: 'Hell' }, { k: 'dark', l: 'Dunkel' }];
  var WD = { mo: 1, montag: 1, di: 2, dienstag: 2, mi: 3, mittwoch: 3, do: 4, donnerstag: 4, fr: 5, freitag: 5, sa: 6, samstag: 6, sonntag: 0 };

  var I = {
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    tick: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12l2.8 2.8L16.5 9"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.6-4.6"/></svg>',
    up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    calm: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
    flame: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5c.6 3-1 4.8-2.6 6.6C7.8 10.9 6 12.8 6 15.6 6 19 8.7 21.5 12 21.5s6-2.5 6-5.9c0-2.4-1.2-4.2-2.6-5.6-.2 1.6-.9 2.7-2 3.2.5-3.6-.3-7.2-1.4-10.7z"/></svg>',
    left: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    trendUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 17l6-6 4 4 6-7"/><path d="M14 8h6v6"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/></svg>',
    timer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M9.5 2.5h5"/></svg>',
    cloud: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9a4.75 4.75 0 0 1-.5 9.5z"/><path d="M12 11.5v5M9.8 14.3l2.2 2.2 2.2-2.2"/></svg>',
    trendDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7l6 6 4-4 6 7"/><path d="M14 16h6v-6"/></svg>'
  };

  /* ================= Zustand ================= */
  var S = {
    sb: null, uid: null, email: '', screen: 'loading', authMode: 'login', recovery: false,
    workspaces: [], ws: null, members: [], profiles: {}, projects: [], tasks: [], subtasks: [], comments: [], activity: [],
    tab: 'heute', scope: 'me', boardStatus: 'offen', filterMine: false, filterProject: '', search: '', showAllDone: false,
    sheet: null, armed: null, draftSubs: [], channel: null, live: true, lastLoad: 0, loadSeq: 0,
    hold: 0, pending: false, animNext: true, toastTimer: 0, closeTimer: 0, busy: {}, onbBack: false,
    calMonth: '', calDay: '', calMine: false, preset: null, dragId: null, focusEnd: 0,
    time_entries: [], sel: {}, boardView: 'cols', filterDue: '', filterPrio: '', sortKey: 'due', sortDir: 1, repScope: 'team', backups: null, backupErr: '', mine: {}, pal: null
  };
  var LS_NOTIFY = 'effectra.notify';
  var LS_REMIND = 'effectra.remind';
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
  function monthStart(s) { return s.slice(0, 8) + '01'; }
  function nextWeekday(n) { var d = new Date(), diff = (n - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + diff); return ymd(d); }

  /* ================= Design (hell/dunkel) ================= */
  function theme() { var t = ls(LS_THEME); return t === 'light' || t === 'dark' ? t : 'auto'; }
  function applyTheme() {
    var t = theme(), root = document.documentElement;
    if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
  }
  applyTheme();

  /* ================= Schnell-Eingabe: „Mail an Kunde morgen #Website @Max !“ ================= */
  function squash(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }
  function parseQuick(text) {
    var r = { title: '', due: null, priority: 2, project: null, assignee: null, repeat: '' };
    var words = String(text).split(/\s+/).filter(Boolean), keep = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i], lw = w.toLowerCase().replace(/[.,]$/, ''), m;
      if (/^!+$/.test(w)) { r.priority = 3; continue; }
      if (lw === 'täglich' || lw === 'tägl' || (lw === 'jeden' && /^tag$/i.test(words[i + 1] || ''))) { r.repeat = 'daily'; if (lw === 'jeden') i++; r.due = r.due || today(); continue; }
      if (lw === 'werktags') { r.repeat = 'weekdays'; r.due = r.due || today(); continue; }
      if (lw === 'wöchentlich') { r.repeat = 'weekly'; r.due = r.due || today(); continue; }
      if (lw === 'monatlich') { r.repeat = 'monthly'; r.due = r.due || today(); continue; }
      if (lw === 'jeden' && words[i + 1] && Object.prototype.hasOwnProperty.call(WD, words[i + 1].toLowerCase().replace(/[.,]$/, ''))) { r.repeat = 'weekly'; r.due = nextWeekday(WD[words[i + 1].toLowerCase().replace(/[.,]$/, '')]); i++; continue; }
      if (lw === 'heute') { r.due = today(); continue; }
      if (lw === 'morgen') { r.due = addDays(today(), 1); continue; }
      if (lw === 'übermorgen') { r.due = addDays(today(), 2); continue; }
      if (lw === 'nächste' && words[i + 1] && /^woche/i.test(words[i + 1])) { r.due = nextWeekday(1); i++; continue; }
      if (Object.prototype.hasOwnProperty.call(WD, lw)) { r.due = nextWeekday(WD[lw]); continue; }
      if ((m = w.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})?$/))) {
        var y = m[3] ? Number(m[3].length === 2 ? '20' + m[3] : m[3]) : new Date().getFullYear();
        var d = new Date(y, Number(m[2]) - 1, Number(m[1]));
        if (d.getMonth() === Number(m[2]) - 1) {
          if (!m[3] && ymd(d) < today()) d.setFullYear(y + 1);
          r.due = ymd(d); continue;
        }
      }
      if (w.charAt(0) === '#' && w.length > 1) {
        var pq = squash(w.slice(1)), proj = null;
        S.projects.forEach(function (p) { if (!proj && squash(p.name).indexOf(pq) === 0) proj = p; });
        if (proj) { r.project = proj.id; continue; }
      }
      if (w.charAt(0) === '@' && w.length > 1) {
        var mq = squash(w.slice(1)), mem = null;
        if (mq === 'ich' || mq === 'mich') mem = S.uid;
        S.members.forEach(function (x) { if (!mem && squash(who(x.user_id).name).indexOf(mq) === 0) mem = x.user_id; });
        if (mem) { r.assignee = mem; continue; }
      }
      keep.push(w);
    }
    r.title = keep.join(' ');
    return r;
  }

  /* ================= Kleine Freuden ================= */
  function celebrate(x, y) {
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    var box = document.createElement('div'), cols = ['blue', 'green', 'orange', 'red', 'purple', 'teal', 'pink'];
    box.className = 'confetti'; box.style.left = x + 'px'; box.style.top = y + 'px';
    for (var i = 0; i < 18; i++) {
      var p = document.createElement('i'), a = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 70;
      p.style.setProperty('--dx', Math.round(Math.cos(a) * dist) + 'px');
      p.style.setProperty('--dy', Math.round(Math.sin(a) * dist - 30) + 'px');
      p.style.setProperty('--r', Math.round(Math.random() * 540 - 270) + 'deg');
      p.style.setProperty('--k', 'var(--c-' + cols[i % cols.length] + ')');
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 1000);
  }
  function celebrateAt(el) { if (!el) return; var r = el.getBoundingClientRect(); celebrate(r.left + r.width / 2, r.top + r.height / 2); }

  /* ================= Statistik ================= */
  function doneDays(list) {
    var days = {};
    list.forEach(function (t) { if (t.status === 'erledigt' && t.done_at) { var d = ymd(new Date(t.done_at)); days[d] = (days[d] || 0) + 1; } });
    return days;
  }
  function streak(list) {
    var days = doneDays(list), d = today(), n = 0;
    if (!days[d]) d = addDays(d, -1);
    while (days[d]) { n++; d = addDays(d, -1); }
    return n;
  }
  function doneBetween(list, from, to) {
    var days = doneDays(list), n = 0;
    Object.keys(days).forEach(function (d) { if (d >= from && d <= to) n += days[d]; });
    return n;
  }

  /* ================= Fokus-Timer ================= */
  S.focusEnd = Number(ls(LS_FOCUS)) || 0;
  if (S.focusEnd && S.focusEnd < Date.now()) { S.focusEnd = 0; ls(LS_FOCUS, null); }
  function focusLeft() { return Math.max(0, S.focusEnd - Date.now()); }
  function mmss(ms) { var s = Math.ceil(ms / 1000); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function focusTick() {
    var pill = $('focus-pill');
    if (!S.focusEnd) { if (pill) pill.hidden = true; return; }
    var left = focusLeft(), txt = mmss(left);
    if (pill) { pill.hidden = false; pill.textContent = 'Fokus ' + txt; }
    var els = document.querySelectorAll('[data-focus-time]');
    for (var i = 0; i < els.length; i++) els[i].textContent = txt;
    if (!left) {
      S.focusEnd = 0; ls(LS_FOCUS, null);
      if (pill) pill.hidden = true;
      toast('Fokuszeit vorbei – gönn dir eine kurze Pause!');
      celebrate(window.innerWidth / 2, window.innerHeight / 3);
      queue();
    }
  }
  setInterval(focusTick, 1000);

  /* ================= Export ================= */
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // verhindert Formeln in Excel
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function exportCsv() {
    var rows = [['Titel', 'Status', 'Priorität', 'Fällig', 'Projekt', 'Zuständig', 'Unteraufgaben', 'Notizen', 'Angelegt', 'Erledigt']];
    S.tasks.slice().sort(sortActive).forEach(function (t) {
      var p = t.project_id ? byId(S.projects, t.project_id) : null, subs = subsOf(t.id);
      rows.push([t.title, SL[t.status] || t.status, (PRIO[(t.priority || 2) - 1] || PRIO[1]).l, t.due || '', p ? p.name : '', t.assignee ? who(t.assignee).name : '',
        subs.length ? subs.filter(function (s) { return s.done; }).length + '/' + subs.length : '', t.notes || '', t.created_at ? ymd(new Date(t.created_at)) : '', t.done_at ? ymd(new Date(t.done_at)) : '']);
    });
    var csv = '﻿' + rows.map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url; a.download = 'effectra-aufgaben-' + today() + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    toast(pl(S.tasks.length, 'Aufgabe', 'Aufgaben') + ' exportiert');
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
  function missingTable(e) { var m = (e && e.message) || ''; return (e && (e.code === 'PGRST205' || e.code === '42P01' || e.code === 'PGRST202' || e.code === '42883')) || /schema cache|does not exist/i.test(m); }
  function run(q) { return Promise.resolve(q).then(function (r) { if (r && r.error) throw r.error; return r ? r.data : null; }); }

  /* ================= Rückmeldung ================= */
  function toast(msg, action) {
    var t = $('toast');
    S.toastFn = action ? action.fn : null;
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button type="button" class="toast-btn" data-action="toast-act">' + esc(action.label) + '</button>' : '');
    t.hidden = false; t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(function () { t.hidden = true; S.toastFn = null; }, action ? 6000 : 4000);
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
    var title = { login: 'Anmelden', signup: 'Konto erstellen', forgot: 'Passwort vergessen', reset: 'Neues Passwort'}[m];
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
      run(S.sb.from('activity').select('*').eq('workspace_id', id).order('id', { ascending: false }).limit(60)),
      q('time_entries', '*').catch(function () { return []; })
    ]).then(function (r) {
      if (seq !== S.loadSeq || id !== S.ws) return;
      S.members = r[0] || []; S.projects = r[1] || []; S.tasks = r[2] || []; S.subtasks = r[3] || []; S.comments = r[4] || []; S.activity = r[5] || []; S.time_entries = r[6] || [];
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
  var LISTS = { tasks: 'tasks', projects: 'projects', subtasks: 'subtasks', comments: 'comments', activity: 'activity', time_entries: 'time_entries' };
  function unsubscribe() { if (S.channel) { try { S.sb.removeChannel(S.channel); } catch (e) {} S.channel = null; } }
  function subscribe() {
    unsubscribe();
    var id = S.ws;
    var ch = S.sb.channel('ws-' + id);
    ['tasks', 'projects', 'subtasks', 'comments', 'workspace_members', 'activity', 'time_entries'].forEach(function (t) {
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
      if (pendingDel && (row.id === pendingDel.task.id || row.task_id === pendingDel.task.id)) return;
      var prevRow = byId(S[key], row.id); prevRow = prevRow ? Object.assign({}, prevRow) : null;
      upsert(key, row);
      notifyChange(table, ev, row, prevRow);
      if (table === 'activity') { S.activity.sort(function (a, b) { return b.id - a.id; }); S.activity = S.activity.slice(0, 60); }
    }
    queue();
    if (S.sheet && S.sheet.kind === 'task' && (table === 'subtasks' || table === 'comments' || table === 'time_entries')) refreshSheet();
    if (table === 'time_entries') timerTick();
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

  function row(t, drag) {
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
    var tms = totalMs(timesOf(t.id));
    if (tms) parts.push('<span class="it">' + I.timer + esc(fmtDur(tms)) + '</span>');
    if (t.repeat) parts.push('<span class="it" title="Wiederholt sich ' + esc(REPEAT_L[t.repeat] || '') + '">' + I.repeat + esc(REPEAT_L[t.repeat] || '') + '</span>');
    var next = NEXT[t.status] || 'offen';
    return '<div class="row task' + (done ? ' is-done' : '') + (t.priority === 3 && !done ? ' is-hot' : '') + '" data-task="' + esc(t.id) + '"' + (drag ? ' draggable="true"' : '') + '>' +
      '<button type="button" class="state" data-action="cycle" data-id="' + esc(t.id) + '" data-s="' + esc(t.status) + '" aria-label="' + esc('Status: ' + (SL[t.status] || 'Offen') + '. Wechseln zu ' + SL[next] + '.') + '"><i>' + (done ? I.check : '') + '</i></button>' +
      '<button type="button" class="main" data-action="open-task" data-id="' + esc(t.id) + '"><span class="txt"><span class="ttl">' +
      (t.priority === 3 ? '<span class="prio" title="Hohe Priorität">! </span>' : '') + esc(t.title) + '</span>' +
      (parts.length ? '<span class="sub">' + parts.join('') + '</span>' : '') + '</span>' +
      (t.assignee ? avatar(t.assignee, 's') : '') + '</button></div>';
  }
  function group(list) { return '<div class="group">' + list.map(function (t) { return row(t); }).join('') + '</div>'; }
  function quickAdd() {
    return '<form class="quick" id="quick-form" novalidate><span class="plus" aria-hidden="true">+</span><label class="vh" for="q-title">Aufgabe schnell hinzufügen</label>' +
      '<input id="q-title" type="text" maxlength="250" autocomplete="off" enterkeyhint="done" placeholder="Neue Aufgabe … z. B. „Anrufen morgen !“">' +
      aiBtn('ai-parse', 'KI', ' title="Mit KI in eine Aufgabe umwandeln" id="q-ai"') + '<button type="submit" class="txt-btn strong" id="q-add" disabled>Hinzufügen</button></form><div class="q-hint" id="q-hint" aria-live="polite"></div>';
  }
  function quickHint() {
    var inp = $('q-title'), h = $('q-hint'); if (!inp || !h) return;
    var v = inp.value.trim();
    $('q-add').disabled = !v;
    if (!v) { h.innerHTML = '<span class="muted">Tipp: <b>morgen</b> · <b>fr</b> · <b>24.12.</b> · <b>#Projekt</b> · <b>@Person</b> · <b>!</b> für wichtig · <b>jeden mo</b></span>'; return; }
    var q = parseQuick(v), c = [];
    if (q.due) c.push('<span class="chip">Fällig: ' + esc(dueLabel(q.due)) + '</span>');
    if (q.project) { var p = byId(S.projects, q.project); if (p) c.push('<span class="chip"><i class="dot" style="--c:var(--c-' + colorOf(p.color) + ')"></i>' + esc(p.name) + '</span>'); }
    if (q.assignee) c.push('<span class="chip">' + avatar(q.assignee, 'xs') + esc(who(q.assignee).first) + '</span>');
    if (q.priority === 3) c.push('<span class="chip hot">Wichtig</span>');
    if (q.repeat) c.push('<span class="chip">' + I.repeat + esc(REPEAT_L[q.repeat]) + '</span>');
    h.innerHTML = c.join('');
  }
  function quickSubmit() {
    var inp = $('q-title'), q = parseQuick(inp.value);
    if (!q.title) { toast('Bitte einen Titel eingeben.'); return; }
    var data = { workspace_id: S.ws, title: q.title.slice(0, 200), notes: '', project_id: q.project || (S.tab === 'board' && S.filterProject) || null,
      assignee: q.assignee || S.uid, status: S.tab === 'board' ? S.boardStatus : 'offen', priority: q.priority, due: q.due, repeat: q.repeat };
    $('q-add').disabled = true;
    run(S.sb.from('tasks').insert(data).select().single()).then(function (r) {
      upsert('tasks', r); inp.value = ''; quickHint(); toast('Aufgabe angelegt'); queue();
    }, function (e) { $('q-add').disabled = false; toast(errText(e)); });
  }
  function setStatus(id, next, el) {
    var t = byId(S.tasks, id);
    if (!t || t.status === next || S.busy[id]) return;
    var prev = t.status;
    t.status = next; S.busy[id] = true;
    if (next === 'erledigt') { celebrateAt(el); rewardDone(); }
    queue();
    run(S.sb.from('tasks').update({ status: next }).eq('id', id).select().single())
      .then(function (r) { if (r) upsert('tasks', r); queue(); })
      .catch(function (e) { t.status = prev; toast(errText(e)); queue(); })
      .then(function () { delete S.busy[id]; });
  }
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
    if (!S.tasks.length) return head + quickAdd() + emptyState('Los geht’s', 'Legt eure ersten Aufgaben an. Hier seht ihr dann jeden Tag, was ansteht und wie weit ihr seid.');
    var mine = S.scope === 'me';
    var L = mine ? S.tasks.filter(isMine) : S.tasks;
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

    // Kennzahlen-Kacheln
    var thisWeek = doneBetween(L, addDays(t0, -6), t0), lastWeek = doneBetween(L, addDays(t0, -13), addDays(t0, -7));
    var trend = thisWeek === lastWeek ? '' : '<span class="trend ' + (thisWeek > lastWeek ? 'up' : 'down') + '">' + (thisWeek > lastWeek ? I.trendUp : I.trendDown) + Math.abs(thisWeek - lastWeek) + '</span>';
    var sk = streak(L);
    var kpis = '<div class="kpis">' +
      '<div class="kpi"><span class="k-lbl">Offen</span><b>' + (st.open + st.work) + '</b><span class="k-sub">' + st.work + ' in Arbeit</span></div>' +
      '<div class="kpi' + (overdue.length ? ' bad' : '') + '"><span class="k-lbl">Überfällig</span><b>' + overdue.length + '</b><span class="k-sub">' + dueToday.length + ' heute fällig</span></div>' +
      '<div class="kpi"><span class="k-lbl">Diese Woche</span><b>' + thisWeek + trend + '</b><span class="k-sub">' + lastWeek + ' letzte Woche</span></div>' +
      '<div class="kpi streak"><span class="k-lbl">Serie</span><b>' + (sk ? I.flame : '') + sk + '</b><span class="k-sub">' + (sk === 1 ? 'Tag' : 'Tage') + ' in Folge erledigt</span></div></div>';

    // Fokus-Timer
    var focus = '<section class="widget focus-w"><div class="w-head"><span class="w-title">' + I.timer + ' Fokus-Timer</span><span class="w-sub">Konzentriert arbeiten</span></div>' +
      (S.focusEnd ? '<div class="focus-run"><span class="focus-big" data-focus-time>' + mmss(focusLeft()) + '</span><button type="button" class="btn-t" data-action="focus-stop">Beenden</button></div>'
        : '<div class="focus-opts"><button type="button" class="btn-t" data-action="focus-start" data-min="15">15 Min</button><button type="button" class="btn-p" data-action="focus-start" data-min="25">25 Min</button><button type="button" class="btn-t" data-action="focus-start" data-min="50">50 Min</button></div>') + '</section>';

    // Auslastung im Team oder anstehende Projekt-Deadlines
    var side = '';
    if (!mine && S.members.length > 1) {
      var load = S.members.map(function (m) { return { id: m.user_id, n: S.tasks.filter(function (t) { return t.assignee === m.user_id && t.status !== 'erledigt'; }).length }; })
        .sort(function (a, b) { return b.n - a.n; });
      var mx = Math.max(1, load[0] ? load[0].n : 1);
      side = '<section class="widget"><div class="w-head"><span class="w-title">Auslastung</span><span class="w-sub">offene Aufgaben</span></div><div class="loadlist">' +
        load.map(function (x) { return '<div class="load">' + avatar(x.id, 's') + '<span class="ln">' + esc(who(x.id).first) + '</span><div class="pbar" style="--p:' + Math.round(x.n / mx * 100) + '%"><i></i></div><b>' + x.n + '</b></div>'; }).join('') + '</div></section>';
    } else {
      var dl = S.projects.filter(function (p) { return p.due && stats(S.tasks.filter(function (t) { return t.project_id === p.id; })).pct < 100; })
        .sort(function (a, b) { return a.due < b.due ? -1 : 1; }).slice(0, 4);
      side = '<section class="widget"><div class="w-head"><span class="w-title">Projekt-Deadlines</span><span class="w-sub">' + (dl.length ? 'als Nächstes' : '') + '</span></div>' +
        (dl.length ? '<div class="loadlist">' + dl.map(function (p) {
          var days = Math.round((parse(p.due) - parse(t0)) / 86400000), pst = stats(S.tasks.filter(function (t) { return t.project_id === p.id; }));
          return '<button type="button" class="load link" data-action="open-project" data-id="' + esc(p.id) + '"><i class="dot" style="--c:var(--c-' + colorOf(p.color) + ')"></i><span class="ln">' + esc(p.name) + '</span>' + pbar(pst.pct, p.color) +
            '<b class="' + (days < 0 ? 'bad' : days <= 3 ? 'warn' : '') + '">' + (days < 0 ? Math.abs(days) + ' T drüber' : days === 0 ? 'heute' : 'in ' + days + ' T') + '</b></button>';
        }).join('') + '</div>' : '<p class="empty-col">Keine offenen Deadlines</p>') + '</section>';
    }

    return head + goalCard() + planCard() + quickAdd() + '<div class="scope-row"><span class="scope-ai">' + aiBtn('ai-plan', 'Tag planen') + '</span><div class="scope">' + segc({ list: [{ k: 'me', l: 'Ich' }, { k: 'team', l: 'Team' }], sel: S.scope, action: 'scope', label: 'Ansicht' }) + '</div></div>' + kpis +
      '<div class="widgets"><section class="widget"><div class="w-head"><span class="w-title">' + (mine ? 'Deine Aufgaben' : 'Team gesamt') + '</span><span class="w-sub">' + st.done + ' von ' + st.total + '</span></div>' +
      '<div class="ring-line">' + ring(st.pct) + '<div class="legend">' +
      '<div class="lg"><i class="dot" style="--c:var(--accent)"></i><span>Erledigt</span><b>' + st.done + '</b></div>' +
      '<div class="lg"><i class="dot" style="--c:var(--c-orange)"></i><span>In Arbeit</span><b>' + st.work + '</b></div>' +
      '<div class="lg"><i class="dot" style="--c:var(--label3)"></i><span>Offen</span><b>' + st.open + '</b></div></div></div></section>' +
      '<section class="widget"><div class="w-head"><span class="w-title">Letzte 7 Tage</span><span class="w-sub">' + pl(wk.total, 'Aufgabe', 'Aufgaben') + ' erledigt</span></div><div class="bars">' + wk.html + '</div></section>' + focus + side + '</div>' +
      '<div class="grid2">' + lists + '</div>';
  }

  /* ================= Ansicht: Board ================= */
  function boardCols() {
    if (S.boardView === 'list') return listView();
    var q = S.search.toLowerCase();
    var L = filterTasks();
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
        (items.length ? '<div class="group">' + items.map(function (t) { return row(t, true); }).join('') + more + '</div>' : '<p class="empty-col">Keine Aufgaben</p>') + '</section>';
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
    return title + quickAdd() + '<div class="board-bar"><div class="search">' + I.search + '<label class="vh" for="f-search">Aufgaben suchen</label><input id="f-search" type="search" placeholder="Suchen" autocomplete="off" value="' + esc(S.search) + '"></div>' +
      (S.boardView === 'list' ? '' : '<div class="statseg">' + segc({ list: STATUS, sel: S.boardStatus, action: 'board-status', label: 'Status' }) + '</div>') +
      '<div class="filters">' + segc({ list: [{ k: 'all', l: 'Alle' }, { k: 'mine', l: 'Meine' }], sel: S.filterMine ? 'mine' : 'all', action: 'board-filter', cls: 'auto', label: 'Zuständigkeit' }) +
      '<label class="vh" for="f-project">Projekt filtern</label><select class="pill" id="f-project">' + projOpts + '</select>' +
      '<label class="vh" for="f-due">Fälligkeit filtern</label><select class="pill" id="f-due">' + opts(DUE_F, S.filterDue) + '</select>' +
      '<label class="vh" for="f-prio">Priorität filtern</label><select class="pill" id="f-prio">' + opts(PRIO_F, S.filterPrio) + '</select>' +
      '<span class="spacer"></span>' + segc({ list: [{ k: 'cols', l: 'Spalten' }, { k: 'list', l: 'Liste' }], sel: S.boardView, action: 'board-view', cls: 'auto', label: 'Ansicht' }) + '</div></div>' +
      '<div class="cols' + (S.search ? ' searching' : '') + (S.boardView === 'list' ? ' listmode' : '') + '" id="board-cols">' + boardCols() + '</div>';
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
      case 'restored': return '<b>' + n + '</b> hat eine Sicherung wiederhergestellt';
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

  /* ================= Ansicht: Kalender ================= */
  var fmtMonth = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
  function viewKalender() {
    var t0 = today();
    if (!S.calMonth) S.calMonth = monthStart(t0);
    if (!S.calDay) S.calDay = t0;
    var first = parse(S.calMonth), lead = (first.getDay() + 6) % 7, start = addDays(S.calMonth, -lead);
    var L = S.tasks.filter(function (t) { return t.due && (!S.calMine || isMine(t)); });
    var byDay = {};
    L.forEach(function (t) { (byDay[t.due] = byDay[t.due] || []).push(t); });
    var cells = '';
    for (var i = 0; i < 42; i++) {
      var d = addDays(start, i), list = (byDay[d] || []).sort(sortActive), inMonth = d.slice(0, 7) === S.calMonth.slice(0, 7);
      if (i === 35 && !inMonth) break;
      var chips = list.slice(0, 3).map(function (t) {
        var p = t.project_id ? byId(S.projects, t.project_id) : null;
        return '<span class="cal-chip' + (t.status === 'erledigt' ? ' done' : '') + '" draggable="true" data-task="' + esc(t.id) + '" style="--c:var(--c-' + colorOf(p ? p.color : 'blue') + ')">' + esc(t.title) + '</span>';
      }).join('');
      var late = list.some(function (t) { return t.status !== 'erledigt' && d < t0; });
      cells += '<div role="button" tabindex="0" class="cal-day' + (inMonth ? '' : ' out') + (d === t0 ? ' today' : '') + (d === S.calDay ? ' sel' : '') + (late ? ' late' : '') + '" data-action="cal-day" data-day="' + d + '">' +
        '<span class="cal-n">' + parse(d).getDate() + '</span>' + chips + (list.length > 3 ? '<span class="cal-more">+' + (list.length - 3) + '</span>' : '') +
        (list.length ? '<span class="cal-dots">' + list.slice(0, 4).map(function () { return '<i></i>'; }).join('') + '</span>' : '') + '</div>';
    }
    var dayList = (byDay[S.calDay] || []).sort(sortActive);
    var noDue = S.tasks.filter(function (t) { return !t.due && t.status !== 'erledigt' && (!S.calMine || isMine(t)); }).sort(sortActive);
    return '<h1 class="large title-only">Kalender</h1>' +
      '<div class="cal-bar"><div class="cal-nav"><button type="button" class="icon-btn" data-action="cal-prev" aria-label="Voriger Monat">' + I.left + '</button>' +
      '<b class="cal-title">' + esc(fmtMonth.format(first)) + '</b><button type="button" class="icon-btn" data-action="cal-next" aria-label="Nächster Monat">' + I.right + '</button>' +
      '<button type="button" class="txt-btn small" data-action="cal-today">Heute</button></div>' +
      segc({ list: [{ k: 'all', l: 'Alle' }, { k: 'mine', l: 'Meine' }], sel: S.calMine ? 'mine' : 'all', action: 'cal-filter', cls: 'auto', label: 'Zuständigkeit' }) + '</div>' +
      '<div class="cal-head">' + ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>' +
      '<div class="cal-grid">' + cells + '</div>' +
      '<div class="grid2"><section><div class="sec-h"><span>' + esc(fmtLong.format(parse(S.calDay))) + '</span><button type="button" class="txt-btn small" data-action="new-task-day">+ Aufgabe</button></div>' +
      (dayList.length ? group(dayList) : '<p class="empty-col">Nichts geplant</p>') + '</section>' +
      (noDue.length ? '<section><div class="sec-h"><span>Ohne Datum</span><span>' + noDue.length + '</span></div>' + group(noDue.slice(0, 8)) + '</section>' : '') + '</div>' +
      '<p class="meta-line">Tipp: Am PC kannst du Aufgaben auf einen anderen Tag ziehen.</p>';
  }
  function moveDue(id, day) {
    var t = byId(S.tasks, id); if (!t || t.due === day) return;
    var prev = t.due; t.due = day; S.mine[id] = Date.now(); queue();
    run(S.sb.from('tasks').update({ due: day }).eq('id', id).select().single())
      .then(function (r) { if (r) upsert('tasks', r); toast('Verschoben auf ' + dueLabel(day)); queue(); })
      .catch(function (e) { t.due = prev; toast(errText(e)); queue(); });
  }

  /* ================= Schnellsuche (Strg+K) ================= */
  function palItems(q) {
    q = q.trim().toLowerCase();
    var acts = [
      { l: 'Neue Aufgabe', h: 'N', run: function () { openSheet('task'); } },
      { l: 'Neues Projekt', run: function () { openSheet('project'); } },
      { l: 'Zu „Heute“', h: '1', run: function () { goTab('heute'); } },
      { l: 'Zum Board', h: '2', run: function () { goTab('board'); } },
      { l: 'Zum Kalender', h: '3', run: function () { goTab('kalender'); } },
      { l: 'Zu den Projekten', h: '4', run: function () { goTab('projekte'); } },
      { l: 'Zu den Berichten', h: '5', run: function () { goTab('berichte'); } },
      { l: 'Zum Team', h: '6', run: function () { goTab('team'); } },
      { l: runningEntry() ? 'Zeiterfassung stoppen' : 'Zeiten exportieren (CSV)', run: function () { runningEntry() ? timerStop() : exportTimes(); } },
      { l: S.focusEnd ? 'Fokus-Timer beenden' : 'Fokus-Timer starten (25 Min)', run: function () { S.focusEnd ? focusStop() : focusStart(25); } },
      { l: 'Aufgaben als Excel/CSV exportieren', run: exportCsv },
      { l: 'Sicherung als Datei herunterladen', run: exportJson },
      { l: 'Design wechseln (hell/dunkel)', run: function () { ls(LS_THEME, document.documentElement.getAttribute('data-theme') === 'dark' || (theme() === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'light' : 'dark'); applyTheme(); } },
      { l: 'Einstellungen', run: function () { openSheet('settings'); } }
    ].filter(function (a) { return !q || a.l.toLowerCase().indexOf(q) >= 0; }).map(function (a) { a.kind = 'Befehl'; return a; });
    var tasks = !q ? [] : S.tasks.filter(function (t) { return (t.title + ' ' + t.notes).toLowerCase().indexOf(q) >= 0; }).sort(sortActive).slice(0, 8)
      .map(function (t) { return { l: t.title, kind: SL[t.status], done: t.status === 'erledigt', run: function () { openSheet('task', t.id); } }; });
    var projs = !q ? [] : S.projects.filter(function (p) { return p.name.toLowerCase().indexOf(q) >= 0; }).slice(0, 4)
      .map(function (p) { return { l: p.name, kind: 'Projekt', color: p.color, run: function () { openSheet('project', p.id); } }; });
    return tasks.concat(projs, acts).slice(0, 14);
  }
  function openPalette() {
    if (S.screen !== 'app') return;
    if (S.sheet) closeSheet();
    var el = $('palette');
    el.innerHTML = '<div class="backdrop" data-action="pal-close"></div><div class="pal" role="dialog" aria-modal="true" aria-label="Schnellsuche"><div class="pal-in">' + I.search +
      '<input id="pal-q" type="text" autocomplete="off" spellcheck="false" placeholder="Aufgaben, Projekte oder Befehle suchen …" aria-label="Suchen"><kbd>Esc</kbd></div><div class="pal-list" id="pal-list" role="listbox"></div></div>';
    el.hidden = false; S.pal = { items: [], i: 0 };
    palRender(); $('pal-q').focus();
  }
  function closePalette() { var el = $('palette'); if (!S.pal) return; S.pal = null; el.hidden = true; el.innerHTML = ''; }
  function palRender() {
    if (!S.pal) return;
    S.pal.items = palItems($('pal-q').value);
    if (S.pal.i >= S.pal.items.length) S.pal.i = 0;
    $('pal-list').innerHTML = S.pal.items.length ? S.pal.items.map(function (x, i) {
      return '<button type="button" role="option" class="pal-it' + (i === S.pal.i ? ' on' : '') + (x.done ? ' done' : '') + '" aria-selected="' + (i === S.pal.i) + '" data-action="pal-run" data-i="' + i + '">' +
        (x.color ? '<i class="dot" style="--c:var(--c-' + colorOf(x.color) + ')"></i>' : '') + '<span class="grow">' + esc(x.l) + '</span><span class="pal-k">' + esc(x.kind) + '</span>' + (x.h ? '<kbd>' + esc(x.h) + '</kbd>' : '') + '</button>';
    }).join('') : '<p class="empty-col">Nichts gefunden</p>';
    var on = $('pal-list').querySelector('.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
  }
  function palRun(i) { var x = S.pal && S.pal.items[i]; closePalette(); if (x) x.run(); }
  // Weicher Wechsel zwischen den Bereichen (View Transitions, wo verfügbar)
  function smooth(fn) {
    var calm = false; try { calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (document.startViewTransition && !calm && document.visibilityState === 'visible') {
      S.animNext = false;
      try {
        var vt = document.startViewTransition(fn);
        [vt.ready, vt.finished, vt.updateCallbackDone].forEach(function (p) { if (p && p.catch) p.catch(function () {}); });
        // Sicherheitsnetz: ein Übergang darf die App nie blockieren
        setTimeout(function () { try { vt.skipTransition(); } catch (e) {} }, 700);
      } catch (e) { fn(); }
    } else { S.animNext = true; fn(); }
  }
  function goTab(t) {
    closeSheet(); if (S.tab === t) return;
    var dir = TABS.indexOf(t) > TABS.indexOf(S.tab) ? 'fwd' : 'back';
    document.documentElement.dataset.nav = dir;
    smooth(function () { S.tab = t; render(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  }

  /* ================= Fokus starten/stoppen ================= */
  function focusStart(min) { S.focusEnd = Date.now() + min * 60000; ls(LS_FOCUS, String(S.focusEnd)); toast('Fokus läuft: ' + min + ' Minuten'); render(); focusTick(); }
  function focusStop() { S.focusEnd = 0; ls(LS_FOCUS, null); render(); focusTick(); }

  /* ================= Benachrichtigungen ================= */
  function notifyOn() { return ls(LS_NOTIFY) === '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted'; }
  function notify(title, body, taskId) {
    if (!notifyOn()) return;
    if (document.visibilityState === 'visible' && document.hasFocus()) return; // App ist offen: Toast reicht
    try {
      var n = new Notification(title, { body: body, icon: 'icons/icon-192.png', tag: taskId || undefined });
      n.onclick = function () { window.focus(); if (taskId && byId(S.tasks, taskId)) openSheet('task', taskId); n.close(); };
    } catch (e) {}
  }
  function dailyReminder() {
    if (!notifyOn() || ls(LS_REMIND) === today()) return;
    var t0 = today(), mine = S.tasks.filter(function (t) { return isMine(t) && t.status !== 'erledigt' && t.due && t.due <= t0; });
    ls(LS_REMIND, t0);
    if (mine.length) {
      try { new Notification('Effectra: ' + pl(mine.length, 'Aufgabe', 'Aufgaben') + ' für heute', { body: mine.slice(0, 3).map(function (t) { return '• ' + t.title; }).join('\n'), icon: 'icons/icon-192.png' }); } catch (e) {}
    }
  }
  function toggleNotify() {
    if (typeof Notification === 'undefined') { toast('Dein Gerät unterstützt keine Benachrichtigungen.'); return; }
    if (ls(LS_NOTIFY) === '1') { ls(LS_NOTIFY, null); toast('Benachrichtigungen aus'); refreshSettings(); return; }
    Notification.requestPermission().then(function (p) {
      if (p === 'granted') { ls(LS_NOTIFY, '1'); ls(LS_REMIND, null); toast('Benachrichtigungen an'); dailyReminder(); }
      else toast('Benachrichtigungen wurden nicht erlaubt.');
      refreshSettings();
    });
  }
  function notifyChange(table, ev, row, prev) {
    if (table === 'tasks' && row.assignee === S.uid && row.workspace_id === S.ws) {
      var recent = S.mine[row.id] && Date.now() - S.mine[row.id] < 8000;
      if (!recent && ((ev === 'INSERT' && row.created_by !== S.uid && !row.repeat) || (ev === 'UPDATE' && prev && prev.assignee !== S.uid))) {
        toastIfOpen('Dir wurde „' + row.title + '“ zugewiesen');
        notify('Neue Aufgabe für dich', row.title, row.id);
      }
    }
    if (table === 'activity' && ev === 'INSERT' && row.actor && row.actor !== S.uid) {
      var t = row.task_id ? byId(S.tasks, row.task_id) : null;
      var relevant = t && (t.assignee === S.uid || t.created_by === S.uid);
      var name = who(row.actor).first;
      if (row.kind === 'comment' && relevant) notify(name + ' hat kommentiert', row.title, row.task_id);
      else if (row.kind === 'done' && relevant) notify(name + ' hat etwas erledigt', row.title, row.task_id);
      else if (row.kind === 'joined') notify('Neues Teammitglied', name + ' ist dem Team beigetreten');
    }
  }
  function toastIfOpen(msg) { if (document.visibilityState === 'visible') toast(msg); }

  /* ================= Sicherung (Backup) ================= */
  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type }));
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }
  function exportJson() {
    var ws = currentWs();
    var data = { app: 'Effectra', version: 1, exported_at: new Date().toISOString(), workspace: ws ? { id: ws.id, name: ws.name } : null,
      projects: S.projects, tasks: S.tasks, subtasks: S.subtasks, comments: S.comments };
    download('effectra-sicherung-' + today() + '.json', JSON.stringify(data, null, 2), 'application/json');
    toast('Sicherung heruntergeladen');
  }
  function loadBackups() {
    S.backups = null; S.backupErr = '';
    return run(S.sb.from('backups').select('id,created_at,kind,size_bytes,created_by').eq('workspace_id', S.ws).order('created_at', { ascending: false }).limit(10))
      .then(function (list) { S.backups = list || []; refreshSettings(); })
      .catch(function (e) { S.backups = []; S.backupErr = missingTable(e) ? 'setup' : errText(e); refreshSettings(); });
  }
  function backupNow(btn) {
    btn.disabled = true;
    run(S.sb.rpc('create_backup', { p_ws: S.ws })).then(function () { toast('Sicherung in Supabase erstellt'); loadBackups(); },
      function (e) { btn.disabled = false; toast(missingTable(e) ? 'Die Cloud-Sicherung ist noch nicht eingerichtet.' : errText(e)); });
  }
  function backupDownload(id) {
    run(S.sb.from('backups').select('data,created_at').eq('id', id).single()).then(function (b) {
      download('effectra-sicherung-' + ymd(new Date(b.created_at)) + '.json', JSON.stringify(b.data, null, 2), 'application/json');
    }, function (e) { toast(errText(e)); });
  }
  function backupRestore(id, btn) {
    btn.disabled = true;
    run(S.sb.rpc('restore_backup', { p_backup: id })).then(function () { toast('Sicherung wiederhergestellt'); closeSheet(); loadWs(); },
      function (e) { btn.disabled = false; toast(errText(e)); });
  }
  function backupList() {
    if (S.backups === null) return '<div class="row-btn static"><span class="grow muted">Sicherungen werden geladen …</span></div>';
    if (S.backupErr === 'setup') return '<div class="row-btn static"><span class="grow muted">Die automatische Cloud-Sicherung ist noch nicht eingerichtet.</span></div>';
    if (S.backupErr) return '<div class="row-btn static"><span class="grow muted">' + esc(S.backupErr) + '</span></div>';
    if (!S.backups.length) return '<div class="row-btn static"><span class="grow muted">Noch keine Sicherung vorhanden. Jede Nacht wird automatisch eine erstellt.</span></div>';
    var owner = iAmOwner();
    return S.backups.map(function (b) {
      var d = new Date(b.created_at);
      return '<div class="row backup-row"><span class="txt"><span>' + esc(fmtShort.format(d)) + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' Uhr</span><span class="sub">' + (b.kind === 'auto' ? 'automatisch' : 'von ' + esc(who(b.created_by).first)) + ' · ' + Math.max(1, Math.round((b.size_bytes || 0) / 1024)) + ' KB</span></span>' +
        '<button type="button" class="txt-btn small" data-action="backup-dl" data-id="' + esc(b.id) + '">Laden</button>' +
        (owner ? '<button type="button" class="txt-btn small danger" data-action="backup-restore" data-id="' + esc(b.id) + '">' + (S.armed === 'restore:' + b.id ? 'Sicher? Aktueller Stand wird ersetzt' : 'Wiederherstellen') + '</button>' : '') + '</div>';
    }).join('');
  }
  function refreshSettings() {
    if (!S.sheet || S.sheet.kind !== 'settings') return;
    var box = $('backup-list'); if (box) box.innerHTML = backupList();
    var nb = $('notify-state'); if (nb) nb.textContent = notifyOn() ? 'An' : 'Aus';
  }

  /* ================= Tagesziel & Rückmeldung beim Abhaken ================= */
  var LS_GOAL = 'effectra.goal', LS_SOUND = 'effectra.sound', LS_GOALDAY = 'effectra.goalday';
  function goal() { var g = Number(ls(LS_GOAL)); return g >= 1 && g <= 20 ? g : 3; }
  function soundOn() { return ls(LS_SOUND) === '1'; } // standardmäßig aus
  function isMine(t) { return t.assignee === S.uid || (!t.assignee && (S.members.length <= 1 || t.created_by === S.uid)); }
  function doneToday() { var t0 = today(); return S.tasks.filter(function (t) { return isMine(t) && t.status === 'erledigt' && t.done_at && ymd(new Date(t.done_at)) === t0; }).length; }

  var audio = null;
  function tone(seq) {
    if (!soundOn()) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      seq.forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.08, t + i * 0.08 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.3);
        o.connect(g); g.connect(audio.destination);
        o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.35);
      });
    } catch (e) {}
  }
  function rewardDone() { tone([784, 1175]); setTimeout(checkGoal, 300); }
  function checkGoal() {
    if (S.screen !== 'app' || !S.uid) return;
    var t0 = today();
    if (doneToday() >= goal() && ls(LS_GOALDAY) !== t0) {
      ls(LS_GOALDAY, t0);
      tone([523, 659, 784]);
      toast('Tagesziel erreicht: ' + goal() + ' von ' + goal() + ' Aufgaben erledigt');
    }
  }
  function goalCard() {
    var dt = doneToday(), g = goal(), pct = Math.min(100, Math.round(dt / g * 100));
    var C = 2 * Math.PI * 30, d = (pct / 100 * C).toFixed(1), t0 = today();
    var open = S.tasks.filter(function (t) { return isMine(t) && t.status !== 'erledigt'; });
    var dueNow = open.filter(function (t) { return t.due && t.due <= t0; }).length;
    var next = open.slice().sort(sortActive)[0];
    return '<section class="hero">' +
      '<div class="goal-ring' + (dt >= g ? ' full' : '') + '"><svg viewBox="0 0 72 72" role="img" aria-label="Tagesziel: ' + dt + ' von ' + g + '"><circle cx="36" cy="36" r="30" fill="none" stroke-width="8" class="ring-bg"/>' +
      (pct ? '<circle cx="36" cy="36" r="30" fill="none" stroke-width="8" stroke-linecap="round" class="ring-fg" stroke-dasharray="' + d + ' 189" transform="rotate(-90 36 36)"/>' : '') +
      '</svg><span>' + dt + '/' + g + '</span></div>' +
      '<div class="hero-txt"><span class="h-k">Tagesziel</span><b>' + (dt >= g ? 'Erreicht' : dt === 0 ? g + ' Aufgaben für heute' : 'Noch ' + (g - dt) + ' bis zum Ziel') + '</b>' +
      '<span class="h-q">' + (dueNow ? pl(dueNow, 'Aufgabe ist', 'Aufgaben sind') + ' heute fällig oder überfällig.' : 'Heute ist nichts überfällig.') + '</span></div>' +
      (next ? '<button type="button" class="hero-next" data-action="open-task" data-id="' + esc(next.id) + '"><span class="h-k">Als Nächstes</span><b>' + esc(next.title) + '</b><span class="h-q">' + (next.due ? esc(dueLabel(next.due)) : 'ohne Datum') + (next.priority === 3 ? ' · wichtig' : '') + '</span></button>' : '') +
      '</section>';
  }

  /* ================= Rückgängig ================= */
  var pendingDel = null;
  function flushDelete() {
    if (!pendingDel) return;
    var p = pendingDel; pendingDel = null; clearTimeout(p.timer);
    run(S.sb.from('tasks').delete().eq('id', p.task.id)).catch(function (e) {
      S.tasks.push(p.task); S.subtasks = S.subtasks.concat(p.subs); S.comments = S.comments.concat(p.comments); toast(errText(e)); queue();
    });
  }
  function deleteTask(id) {
    flushDelete();
    var t = byId(S.tasks, id); if (!t) return;
    pendingDel = { task: t, subs: subsOf(id), comments: commentsOf(id) };
    S.tasks = S.tasks.filter(function (x) { return x.id !== id; });
    S.subtasks = S.subtasks.filter(function (x) { return x.task_id !== id; });
    S.comments = S.comments.filter(function (x) { return x.task_id !== id; });
    pendingDel.timer = setTimeout(flushDelete, 6000);
    closeSheet(); queue();
    toast('Aufgabe gelöscht', { label: 'Rückgängig', fn: function () {
      if (!pendingDel || pendingDel.task.id !== id) return;
      var p = pendingDel; pendingDel = null; clearTimeout(p.timer);
      S.tasks.push(p.task); S.subtasks = S.subtasks.concat(p.subs); S.comments = S.comments.concat(p.comments);
      toast('Wiederhergestellt'); queue();
    } });
  }
  window.addEventListener('pagehide', flushDelete);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushDelete(); });

  function duplicateTask(id) {
    var t = byId(S.tasks, id); if (!t) return;
    var data = { workspace_id: S.ws, title: (t.title + ' (Kopie)').slice(0, 200), notes: t.notes || '', project_id: t.project_id, assignee: t.assignee, status: 'offen', priority: t.priority, due: t.due, repeat: t.repeat || '' };
    var subs = subsOf(id);
    run(S.sb.from('tasks').insert(data).select().single()).then(function (row) {
      upsert('tasks', row);
      if (!subs.length) return row;
      return run(S.sb.from('subtasks').insert(subs.map(function (s, i) { return { task_id: row.id, workspace_id: S.ws, title: s.title, position: i }; })).select())
        .then(function (rows) { (rows || []).forEach(function (r) { upsert('subtasks', r); }); return row; });
    }).then(function (row) { toast('Kopie angelegt'); queue(); if (row) openSheet('task', row.id); }, function (e) { toast(errText(e)); });
  }

  /* ================= Zeiterfassung ================= */
  function timesOf(taskId) { return S.time_entries.filter(function (e) { return e.task_id === taskId; }).sort(function (a, b) { return a.started_at < b.started_at ? 1 : -1; }); }
  function durMs(e) { var a = new Date(e.started_at).getTime(), b = e.ended_at ? new Date(e.ended_at).getTime() : Date.now(); return Math.max(0, b - a); }
  function totalMs(list) { return list.reduce(function (s, e) { return s + durMs(e); }, 0); }
  function fmtDur(ms) {
    var m = Math.round(ms / 60000);
    if (m < 60) return m + ' Min';
    var h = Math.floor(m / 60), r = m % 60;
    return h + ':' + pad(r) + ' Std';
  }
  function clock(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 3600) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); }
  function runningEntry() { for (var i = 0; i < S.time_entries.length; i++) { var e = S.time_entries[i]; if (e.user_id === S.uid && !e.ended_at) return e; } return null; }
  function timeErr(e) { toast(missingTable(e) ? 'Die Zeiterfassung ist noch nicht eingerichtet.' : errText(e)); }
  function timerStart(taskId) {
    var nowIso = new Date().toISOString();
    S.time_entries.forEach(function (e) { if (e.user_id === S.uid && !e.ended_at) e.ended_at = nowIso; });
    run(S.sb.from('time_entries').insert({ task_id: taskId, workspace_id: S.ws }).select().single())
      .then(function (row) { upsert('time_entries', row); toast('Zeit läuft'); afterTime(); }, timeErr);
  }
  function timerStop() {
    var e = runningEntry(); if (!e) return;
    e.ended_at = new Date().toISOString(); afterTime();
    run(S.sb.from('time_entries').update({ ended_at: e.ended_at }).eq('id', e.id).select().single())
      .then(function (row) { if (row) upsert('time_entries', row); toast('Gestoppt: ' + fmtDur(durMs(row || e))); afterTime(); }, function (er) { e.ended_at = null; timeErr(er); afterTime(); });
  }
  function timeAdd(taskId, min) {
    var end = new Date(), startT = new Date(end.getTime() - min * 60000);
    run(S.sb.from('time_entries').insert({ task_id: taskId, workspace_id: S.ws, started_at: startT.toISOString(), ended_at: end.toISOString() }).select().single())
      .then(function (row) { upsert('time_entries', row); toast(fmtDur(min * 60000) + ' nachgetragen'); afterTime(); }, timeErr);
  }
  function timeDel(id) {
    var e = byId(S.time_entries, id); if (!e) return;
    S.time_entries = S.time_entries.filter(function (x) { return x.id !== id; }); afterTime();
    run(S.sb.from('time_entries').delete().eq('id', id)).catch(function (er) { S.time_entries.push(e); timeErr(er); afterTime(); });
  }
  function afterTime() { renderTimes(); timerTick(); queue(); }
  function renderTimes() {
    var box = $('times'); if (!box || !S.sheet || !S.sheet.id) return;
    var id = S.sheet.id, list = timesOf(id), run0 = runningEntry(), mineHere = run0 && run0.task_id === id;
    $('time-total').textContent = list.length ? fmtDur(totalMs(list)) : '';
    box.innerHTML = '<div class="time-ctl">' +
      (mineHere ? '<button type="button" class="btn-p time-btn" data-action="timer-stop">■ Stoppen <span data-timer-clock>' + clock(durMs(run0)) + '</span></button>'
        : '<button type="button" class="btn-t time-btn" data-action="timer-start" data-id="' + esc(id) + '">▶ Timer starten</button>') +
      '<span class="time-add">' + [15, 30, 60].map(function (m) { return '<button type="button" class="pill-btn" data-action="time-add" data-id="' + esc(id) + '" data-min="' + m + '">+' + (m < 60 ? m + ' Min' : '1 Std') + '</button>'; }).join('') + '</span></div>' +
      list.slice(0, 20).map(function (e) {
        var d = new Date(e.started_at);
        return '<div class="time-row">' + avatar(e.user_id, 's') + '<span class="grow">' + esc(who(e.user_id).first) + ' · ' + esc(fmtShort.format(d)) + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + '</span>' +
          '<b>' + (e.ended_at ? fmtDur(durMs(e)) : 'läuft') + '</b>' +
          (e.user_id === S.uid && e.ended_at ? '<button type="button" class="x-btn" data-action="time-del" data-id="' + esc(e.id) + '" aria-label="Zeiteintrag löschen">×</button>' : '<span class="x-gap"></span>') + '</div>';
      }).join('');
  }
  function timerTick() {
    var e = runningEntry(), pill = $('timer-pill');
    if (pill) {
      if (!e) pill.hidden = true;
      else {
        var t = byId(S.tasks, e.task_id);
        pill.hidden = false; pill.dataset.id = e.task_id;
        pill.innerHTML = '<i class="rec"></i><span data-timer-clock>' + clock(durMs(e)) + '</span><span class="tp-t">' + esc(t ? t.title : '') + '</span>';
      }
    }
    var els = document.querySelectorAll('[data-timer-clock]');
    for (var i = 0; i < els.length; i++) if (e) els[i].textContent = clock(durMs(e));
  }
  setInterval(timerTick, 1000);
  function exportTimes() {
    var rows = [['Datum', 'Start', 'Ende', 'Dauer (Min)', 'Person', 'Aufgabe', 'Projekt']];
    S.time_entries.slice().sort(function (a, b) { return a.started_at < b.started_at ? -1 : 1; }).forEach(function (e) {
      var t = byId(S.tasks, e.task_id), p = t && t.project_id ? byId(S.projects, t.project_id) : null, s0 = new Date(e.started_at), e0 = e.ended_at ? new Date(e.ended_at) : null;
      rows.push([ymd(s0), pad(s0.getHours()) + ':' + pad(s0.getMinutes()), e0 ? pad(e0.getHours()) + ':' + pad(e0.getMinutes()) : 'läuft', Math.round(durMs(e) / 60000), who(e.user_id).name, t ? t.title : '', p ? p.name : '']);
    });
    download('effectra-zeiten-' + today() + '.csv', '﻿' + rows.map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n'), 'text/csv;charset=utf-8');
    toast(pl(S.time_entries.length, 'Zeiteintrag', 'Zeiteinträge') + ' exportiert');
  }

  /* ================= Filter & Liste (Board) ================= */
  var DUE_F = [{ k: '', l: 'Alle Termine' }, { k: 'over', l: 'Überfällig' }, { k: 'today', l: 'Heute' }, { k: 'week', l: 'Nächste 7 Tage' }, { k: 'none', l: 'Ohne Datum' }];
  var PRIO_F = [{ k: '', l: 'Alle Prioritäten' }, { k: '3', l: 'Hoch' }, { k: '2', l: 'Normal' }, { k: '1', l: 'Niedrig' }];
  function filterTasks() {
    var q = S.search.toLowerCase(), t0 = today(), w = addDays(t0, 7);
    return S.tasks.filter(function (t) {
      if (S.filterMine && !isMine(t)) return false;
      if (S.filterProject && t.project_id !== S.filterProject) return false;
      if (S.filterPrio && String(t.priority || 2) !== S.filterPrio) return false;
      if (S.filterDue === 'over' && !(t.due && t.due < t0 && t.status !== 'erledigt')) return false;
      if (S.filterDue === 'today' && t.due !== t0) return false;
      if (S.filterDue === 'week' && !(t.due && t.due >= t0 && t.due <= w)) return false;
      if (S.filterDue === 'none' && t.due) return false;
      if (q && (t.title + ' ' + t.notes).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  var COLS = [{ k: 'title', l: 'Aufgabe' }, { k: 'status', l: 'Status' }, { k: 'priority', l: 'Priorität' }, { k: 'due', l: 'Fällig' }, { k: 'project', l: 'Projekt' }, { k: 'assignee', l: 'Zuständig' }, { k: 'time', l: 'Zeit' }];
  function sortVal(t, k) {
    if (k === 'status') return ['offen', 'arbeit', 'erledigt'].indexOf(t.status);
    if (k === 'priority') return -(t.priority || 2);
    if (k === 'due') return t.due || '9999';
    if (k === 'project') { var p = t.project_id ? byId(S.projects, t.project_id) : null; return p ? p.name.toLowerCase() : '￿'; }
    if (k === 'assignee') return t.assignee ? who(t.assignee).name.toLowerCase() : '￿';
    if (k === 'time') return -totalMs(timesOf(t.id));
    return String(t.title).toLowerCase();
  }
  function listView() {
    var L = filterTasks(), k = S.sortKey || 'due', dir = S.sortDir || 1;
    L.sort(function (a, b) { var x = sortVal(a, k), y = sortVal(b, k); return (x < y ? -1 : x > y ? 1 : sortActive(a, b)) * dir; });
    Object.keys(S.sel).forEach(function (id) { if (!byId(S.tasks, id)) delete S.sel[id]; });
    var nSel = Object.keys(S.sel).length, allOn = L.length && L.every(function (t) { return S.sel[t.id]; });
    var people = [{ k: '', l: 'Zuständig …' }, { k: '-', l: 'Niemand' }].concat(S.members.map(function (m) { return { k: m.user_id, l: who(m.user_id).label }; }));
    var bulk = nSel ? '<div class="bulk"><b>' + nSel + ' ausgewählt</b>' +
      '<label class="vh" for="b-status">Status setzen</label><select class="pill" id="b-status">' + opts([{ k: '', l: 'Status …' }].concat(STATUS), '') + '</select>' +
      '<label class="vh" for="b-assignee">Zuständig setzen</label><select class="pill" id="b-assignee">' + opts(people, '') + '</select>' +
      '<label class="vh" for="b-due">Fälligkeit setzen</label><input class="pill date" id="b-due" type="date" title="Fälligkeit setzen">' +
      '<button type="button" class="txt-btn small danger" data-action="bulk-del">' + (S.armed === 'bulk-del' ? 'Wirklich ' + nSel + ' löschen?' : 'Löschen') + '</button>' +
      '<button type="button" class="txt-btn small" data-action="sel-clear">Auswahl aufheben</button></div>' : '';
    if (!L.length) return bulk + '<p class="empty-col">Keine Aufgaben für diese Filter</p>';
    var t0 = today();
    return bulk + '<div class="tlist" role="table" aria-label="Aufgabenliste"><div class="tl-h" role="row"><button type="button" class="chk' + (allOn ? ' on' : '') + '" role="checkbox" aria-checked="' + !!allOn + '" aria-label="Alle auswählen" data-action="sel-all"></button>' +
      COLS.map(function (c) { return '<button type="button" class="th c-' + c.k + (k === c.k ? ' on' : '') + '" data-action="sort" data-k="' + c.k + '" role="columnheader">' + c.l + (k === c.k ? (dir > 0 ? ' ↑' : ' ↓') : '') + '</button>'; }).join('') + '</div>' +
      L.map(function (t) {
        var p = t.project_id ? byId(S.projects, t.project_id) : null, ms = totalMs(timesOf(t.id)), late = t.due && t.due < t0 && t.status !== 'erledigt';
        return '<div class="tl-r' + (S.sel[t.id] ? ' sel' : '') + (t.status === 'erledigt' ? ' is-done' : '') + '" role="row" data-task="' + esc(t.id) + '">' +
          '<button type="button" class="chk' + (S.sel[t.id] ? ' on' : '') + '" role="checkbox" aria-checked="' + !!S.sel[t.id] + '" aria-label="' + esc('Auswählen: ' + t.title) + '" data-action="sel" data-id="' + esc(t.id) + '"></button>' +
          '<button type="button" class="td c-title" data-action="open-task" data-id="' + esc(t.id) + '">' + (t.priority === 3 ? '<span class="prio">! </span>' : '') + esc(t.title) + (t.repeat ? ' <span class="muted">' + I.repeat + '</span>' : '') + '</button>' +
          '<span class="td c-status"><span class="st-pill s-' + esc(t.status) + '">' + esc(SL[t.status] || '') + '</span></span>' +
          '<span class="td c-priority">' + esc((PRIO[(t.priority || 2) - 1] || PRIO[1]).l) + '</span>' +
          '<span class="td c-due' + (late ? ' bad' : '') + '">' + (t.due ? esc(dueLabel(t.due)) : '–') + '</span>' +
          '<span class="td c-project">' + (p ? '<i class="dot" style="--c:var(--c-' + colorOf(p.color) + ')"></i>' + esc(p.name) : '–') + '</span>' +
          '<span class="td c-assignee">' + (t.assignee ? avatar(t.assignee, 'xs') + esc(who(t.assignee).first) : '–') + '</span>' +
          '<span class="td c-time">' + (ms ? fmtDur(ms) : '–') + '</span></div>';
      }).join('') + '</div>';
  }
  function bulkUpdate(data, label) {
    var ids = Object.keys(S.sel); if (!ids.length) return;
    var before = ids.map(function (id) { return Object.assign({}, byId(S.tasks, id)); });
    ids.forEach(function (id) { var t = byId(S.tasks, id); if (t) Object.assign(t, data); });
    ids.forEach(function (id) { S.mine[id] = Date.now(); });
    queue();
    run(S.sb.from('tasks').update(data).in('id', ids).select()).then(function (rows) {
      (rows || []).forEach(function (r) { upsert('tasks', r); });
      toast(pl(ids.length, 'Aufgabe', 'Aufgaben') + ' ' + label); queue();
    }, function (e) { before.forEach(function (b) { if (b && b.id) upsert('tasks', b); }); toast(errText(e)); queue(); });
  }
  function bulkDelete() {
    var ids = Object.keys(S.sel); if (!ids.length) return;
    run(S.sb.from('tasks').delete().in('id', ids)).then(function () {
      S.tasks = S.tasks.filter(function (t) { return !S.sel[t.id]; }); S.sel = {}; toast(pl(ids.length, 'Aufgabe', 'Aufgaben') + ' gelöscht'); queue();
    }, function (e) { toast(errText(e)); });
  }

  /* ================= Ansicht: Berichte ================= */
  function weekStart(s) { var d = parse(s), wd = (d.getDay() + 6) % 7; return addDays(s, -wd); }
  function viewBerichte() {
    var t0 = today(), from30 = addDays(t0, -29), title = '<h1 class="large title-only">Berichte</h1>';
    var scope = S.repScope || 'team', L = scope === 'me' ? S.tasks.filter(isMine) : S.tasks;
    var T = scope === 'me' ? S.time_entries.filter(function (e) { return e.user_id === S.uid; }) : S.time_entries;
    var done30 = L.filter(function (t) { return t.status === 'erledigt' && t.done_at && ymd(new Date(t.done_at)) >= from30; });
    var withDue = done30.filter(function (t) { return t.due; }), onTime = withDue.filter(function (t) { return ymd(new Date(t.done_at)) <= t.due; }).length;
    var lead = done30.map(function (t) { return (new Date(t.done_at) - new Date(t.created_at)) / 86400000; }).filter(function (x) { return x >= 0; });
    var avgLead = lead.length ? lead.reduce(function (a, b) { return a + b; }, 0) / lead.length : 0;
    var ws0 = weekStart(t0), weekMs = totalMs(T.filter(function (e) { return ymd(new Date(e.started_at)) >= ws0; }));
    var open = L.filter(function (t) { return t.status !== 'erledigt'; }), over = open.filter(function (t) { return t.due && t.due < t0; }).length;
    var kpis = '<div class="kpis">' +
      '<div class="kpi"><span class="k-lbl">Erledigt (30 Tage)</span><b>' + done30.length + '</b><span class="k-sub">' + open.length + ' noch offen</span></div>' +
      '<div class="kpi"><span class="k-lbl">Pünktlich</span><b>' + (withDue.length ? Math.round(onTime / withDue.length * 100) + ' %' : '–') + '</b><span class="k-sub">' + onTime + ' von ' + withDue.length + ' mit Frist</span></div>' +
      '<div class="kpi"><span class="k-lbl">Ø Durchlaufzeit</span><b>' + (lead.length ? (avgLead < 1 ? '<1' : avgLead.toFixed(1).replace('.', ',')) : '–') + '</b><span class="k-sub">Tage von Anlage bis erledigt</span></div>' +
      '<div class="kpi"><span class="k-lbl">Zeit diese Woche</span><b>' + (weekMs ? fmtDur(weekMs) : '0 Min') + '</b><span class="k-sub">' + (over ? pl(over, 'Aufgabe', 'Aufgaben') + ' überfällig' : 'nichts überfällig') + '</span></div></div>';
    // Erledigt pro Woche (8 Wochen)
    var weeks = []; for (var i = 7; i >= 0; i--) weeks.push(addDays(ws0, -7 * i));
    var counts = weeks.map(function (w) { var e = addDays(w, 6); return L.filter(function (t) { return t.status === 'erledigt' && t.done_at && ymd(new Date(t.done_at)) >= w && ymd(new Date(t.done_at)) <= e; }).length; });
    var mx = Math.max(1, Math.max.apply(null, counts));
    var chart = '<section class="widget"><div class="w-head"><span class="w-title">Erledigt pro Woche</span><span class="w-sub">letzte 8 Wochen</span></div><div class="bars b8">' +
      weeks.map(function (w, k) { var c = counts[k]; return '<div class="bcol' + (k === 7 ? ' today' : '') + '"><span class="n">' + (c || '') + '</span><div class="btrack"><i class="bar-i' + (c ? '' : ' zero') + '" style="--h:' + Math.round(c / mx * 100) + '%;--k:' + k + '"></i></div><span class="d">KW ' + isoWeek(w) + '</span></div>'; }).join('') + '</div></section>';
    // Zeit pro Projekt (30 Tage)
    var perProj = {};
    T.filter(function (e) { return ymd(new Date(e.started_at)) >= from30; }).forEach(function (e) {
      var t = byId(S.tasks, e.task_id), key = t && t.project_id ? t.project_id : '';
      perProj[key] = (perProj[key] || 0) + durMs(e);
    });
    var projRows = Object.keys(perProj).map(function (k) { return { k: k, ms: perProj[k] }; }).sort(function (a, b) { return b.ms - a.ms; });
    var pmx = projRows.length ? projRows[0].ms : 1;
    var timeW = '<section class="widget"><div class="w-head"><span class="w-title">Zeit pro Projekt</span><span class="w-sub">30 Tage · ' + fmtDur(totalMs(T.filter(function (e) { return ymd(new Date(e.started_at)) >= from30; }))) + '</span></div>' +
      (projRows.length ? '<div class="loadlist">' + projRows.slice(0, 6).map(function (r) {
        var p = r.k ? byId(S.projects, r.k) : null;
        return '<div class="load"><i class="dot" style="--c:var(--c-' + colorOf(p ? p.color : 'gray') + ')"></i><span class="ln">' + esc(p ? p.name : 'Ohne Projekt') + '</span><div class="pbar" style="--p:' + Math.round(r.ms / pmx * 100) + '%' + (p ? ';--c:var(--c-' + colorOf(p.color) + ')' : '') + '"><i></i></div><b>' + fmtDur(r.ms) + '</b></div>';
      }).join('') + '</div>' : '<p class="empty-col">Noch keine Zeiten erfasst. Starte den Timer in einer Aufgabe.</p>') + '</section>';
    // Projekte: Fortschritt & Termine
    var projW = '<section class="widget"><div class="w-head"><span class="w-title">Projekte</span><span class="w-sub">Fortschritt</span></div>' +
      (S.projects.length ? '<div class="loadlist">' + S.projects.slice().sort(byName).map(function (p) {
        var l = S.tasks.filter(function (t) { return t.project_id === p.id; }), st = stats(l), late = p.due && p.due < t0 && st.pct < 100;
        return '<button type="button" class="load link" data-action="open-project" data-id="' + esc(p.id) + '"><i class="dot" style="--c:var(--c-' + colorOf(p.color) + ')"></i><span class="ln">' + esc(p.name) + '</span>' + pbar(st.pct, p.color) + '<b class="' + (late ? 'bad' : '') + '">' + st.pct + ' %</b></button>';
      }).join('') + '</div>' : '<p class="empty-col">Noch keine Projekte</p>') + '</section>';
    // Team
    var teamW = '<section class="widget"><div class="w-head"><span class="w-title">Team</span><span class="w-sub">30 Tage</span></div><div class="rep-team"><div class="rt-h"><span></span><span>Erledigt</span><span>Offen</span><span>Überfällig</span><span>Zeit</span></div>' +
      S.members.map(function (m) {
        var mine = S.tasks.filter(function (t) { return t.assignee === m.user_id; }), op = mine.filter(function (t) { return t.status !== 'erledigt'; });
        var d30 = mine.filter(function (t) { return t.status === 'erledigt' && t.done_at && ymd(new Date(t.done_at)) >= from30; }).length;
        var ms = totalMs(S.time_entries.filter(function (e) { return e.user_id === m.user_id && ymd(new Date(e.started_at)) >= from30; }));
        return '<div class="rt-r"><span class="rt-n">' + avatar(m.user_id, 's') + esc(who(m.user_id).first) + '</span><b>' + d30 + '</b><b>' + op.length + '</b><b class="' + (op.some(function (t) { return t.due && t.due < t0; }) ? 'bad' : '') + '">' + op.filter(function (t) { return t.due && t.due < t0; }).length + '</b><b>' + (ms ? fmtDur(ms) : '–') + '</b></div>';
      }).join('') + '</div></section>';
    return title + '<div class="rep-bar">' + segc({ list: [{ k: 'team', l: 'Team' }, { k: 'me', l: 'Ich' }], sel: scope, action: 'rep-scope', cls: 'auto', label: 'Bericht für' }) +
      '<span class="rep-act"><button type="button" class="txt-btn small" data-action="export-times">Zeiten exportieren (CSV)</button><button type="button" class="txt-btn small" data-action="export-csv">Aufgaben exportieren (CSV)</button></span></div>' +
      kpis + (aiOn() ? '<div class="ai-row">' + aiBtn('ai-week', 'Wochenrückblick schreiben') + '</div><div id="ai-week"></div>' : '') + '<div class="widgets rep">' + chart + timeW + projW + teamW + '</div>';
  }
  function isoWeek(s) {
    var d = parse(s); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var w1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
  }

  /* ================= KI-Assistent (Google Gemini über Supabase Edge Function) ================= */
  var LS_AI = 'effectra.ai';
  function aiOn() { return ls(LS_AI) !== '0'; }
  var SPARK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9zM19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1-2.1-.9 2.1-.9z"/></svg>';
  function aiBtn(action, label, extra) {
    return aiOn() ? '<button type="button" class="ai-btn" data-action="' + action + '"' + (extra || '') + '>' + SPARK + '<span>' + esc(label) + '</span></button>' : '';
  }
  function aiCall(action, payload) {
    var body = Object.assign({ action: action, workspace_id: S.ws, today: today() }, payload);
    return S.sb.functions.invoke('ai', { body: body }).then(function (r) {
      if (r.error) {
        var ctx = r.error.context;
        if (ctx && typeof ctx.json === 'function') return ctx.json().then(function (j) { throw new Error((j && j.error) || 'Die KI ist gerade nicht erreichbar.'); }, function () { throw new Error('Die KI ist gerade nicht erreichbar.'); });
        throw new Error(/Failed to fetch|NetworkError/i.test(r.error.message || '') ? 'Keine Verbindung.' : 'Die KI ist gerade nicht erreichbar.');
      }
      if (!r.data || r.data.error) throw new Error((r.data && r.data.error) || 'Keine Antwort von der KI.');
      return r.data.result || {};
    });
  }
  function aiBusy(btn, on) {
    if (!btn) return;
    btn.disabled = on; btn.classList.toggle('busy', on);
    var s = btn.querySelector('span'); if (!s) return;
    if (on) { btn.dataset.label = s.textContent; s.textContent = 'Denkt nach …'; } else if (btn.dataset.label) s.textContent = btn.dataset.label;
  }
  function taskBrief(t) {
    var p = t.project_id ? byId(S.projects, t.project_id) : null;
    return { title: t.title, due: t.due, priority: t.priority, status: t.status, project: p ? p.name : '', assignee: t.assignee ? who(t.assignee).first : '' };
  }
  function strList(v, max, len) { return (Array.isArray(v) ? v : []).map(function (x) { return String(x == null ? '' : x).trim().slice(0, len); }).filter(Boolean).slice(0, max); }

  // 1) Unteraufgaben vorschlagen
  function aiSubtasks(btn) {
    var title = ($('t-title') || {}).value || '', notes = ($('t-notes') || {}).value || '';
    if (!title.trim()) { formError('Gib zuerst einen Titel ein.'); return; }
    aiBusy(btn, true);
    aiCall('subtasks', { title: title.trim(), notes: notes.trim() }).then(function (r) {
      S.aiSubs = strList(r.subtasks, 8, 200); renderAiSubs();
    }, function (e) { toast(e.message); }).then(function () { aiBusy(btn, false); });
  }
  function renderAiSubs() {
    var box = $('ai-subs'); if (!box) return;
    if (!S.aiSubs || !S.aiSubs.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="ai-card"><div class="ai-h">' + SPARK + '<b>Vorschläge</b><button type="button" class="txt-btn small strong" data-action="ai-subs-all">Alle übernehmen</button><button type="button" class="txt-btn small" data-action="ai-subs-close">Verwerfen</button></div>' +
      S.aiSubs.map(function (x, i) { return '<button type="button" class="ai-sug" data-action="ai-sub-add" data-i="' + i + '"><span class="plus">+</span><span>' + esc(x) + '</span></button>'; }).join('') + '</div>';
  }
  function aiSubAdd(i) {
    var title = S.aiSubs && S.aiSubs[i]; if (!title) return;
    S.aiSubs.splice(i, 1); renderAiSubs();
    if (!S.sheet.id) { S.draftSubs.push(title); renderSubs(); return; }
    var list = subsOf(S.sheet.id), pos = list.length ? list[list.length - 1].position + 1 : 0;
    run(S.sb.from('subtasks').insert({ task_id: S.sheet.id, workspace_id: S.ws, title: title, position: pos }).select().single())
      .then(function (row) { upsert('subtasks', row); renderSubs(); queue(); }, function (e) { toast(errText(e)); });
  }
  function aiSubsAll() {
    var all = (S.aiSubs || []).slice(); S.aiSubs = []; renderAiSubs();
    if (!all.length) return;
    if (!S.sheet.id) { S.draftSubs = S.draftSubs.concat(all); renderSubs(); return; }
    var list = subsOf(S.sheet.id), pos = list.length ? list[list.length - 1].position + 1 : 0;
    run(S.sb.from('subtasks').insert(all.map(function (t, k) { return { task_id: S.sheet.id, workspace_id: S.ws, title: t, position: pos + k }; })).select())
      .then(function (rows) { (rows || []).forEach(function (r) { upsert('subtasks', r); }); renderSubs(); queue(); toast(pl(all.length, 'Unteraufgabe', 'Unteraufgaben') + ' übernommen'); }, function (e) { toast(errText(e)); });
  }

  // 2) Freitext → fertige Aufgabe (zum Prüfen im Formular)
  function aiParse(btn) {
    var inp = $('q-title'), text = inp ? inp.value.trim() : '';
    if (!text) { toast('Schreib zuerst, was zu tun ist – z. B. „Lea soll bis Freitag das Angebot schicken“.'); if (inp) inp.focus(); return; }
    aiBusy(btn, true);
    aiCall('parse', { text: text, people: S.members.map(function (m) { return who(m.user_id).name; }), projects: S.projects.map(function (p) { return p.name; }) }).then(function (r) {
      var pre = { title: String(r.title || text).slice(0, 200), notes: String(r.notes || '').slice(0, 2000), priority: [1, 2, 3].indexOf(Number(r.priority)) >= 0 ? Number(r.priority) : 2 };
      if (/^\d{4}-\d{2}-\d{2}$/.test(r.due || '') && !isNaN(parse(r.due))) pre.due = r.due;
      var an = squash(r.assignee || ''), pn = squash(r.project || '');
      if (an) S.members.forEach(function (m) { if (squash(who(m.user_id).name) === an) pre.assignee = m.user_id; });
      if (pn) S.projects.forEach(function (p) { if (squash(p.name) === pn) pre.project_id = p.id; });
      inp.value = ''; quickHint();
      S.preset = pre; openSheet('task');
      formError(''); var m = $('form-error'); if (m) { m.classList.add('ai-note'); m.textContent = 'Von der KI ausgefüllt – bitte kurz prüfen und dann „Hinzufügen“.'; }
    }, function (e) { toast(e.message); }).then(function () { aiBusy(btn, false); });
  }

  // 3) Tag planen
  function aiPlan(btn) {
    var open = S.tasks.filter(function (t) { return isMine(t) && t.status !== 'erledigt'; }).sort(sortActive).slice(0, 40);
    if (!open.length) { toast('Für dich ist nichts offen.'); return; }
    aiBusy(btn, true);
    aiCall('plan', { tasks: open.map(taskBrief) }).then(function (r) {
      var seen = {}, ids = (Array.isArray(r.order) ? r.order : []).map(Number).filter(function (i) { if (seen[i] || !open[i]) return false; seen[i] = true; return true; }).slice(0, 6).map(function (i) { return open[i].id; });
      S.aiPlan = { day: today(), ids: ids, tip: String(r.tip || '').slice(0, 300) }; render();
    }, function (e) { toast(e.message); }).then(function () { aiBusy(btn, false); });
  }
  function planCard() {
    var p = S.aiPlan; if (!p || p.day !== today()) return '';
    var L = p.ids.map(function (id) { return byId(S.tasks, id); }).filter(Boolean);
    return '<section class="ai-card plan"><div class="ai-h">' + SPARK + '<b>Vorschlag für heute</b><button type="button" class="txt-btn small" data-action="ai-plan-close">Ausblenden</button></div>' +
      (p.tip ? '<p class="ai-tip">' + esc(p.tip) + '</p>' : '') +
      (L.length ? '<div class="group">' + L.map(function (t, i) { return '<div class="plan-row"><span class="plan-n">' + (i + 1) + '</span>' + row(t) + '</div>'; }).join('') + '</div>' : '<p class="empty-col">Kein Vorschlag</p>') + '</section>';
  }

  // 4) Projekt zusammenfassen, 5) Wochenrückblick
  function aiSummary(btn, kind, pid) {
    var L, name = '';
    if (kind === 'project') { var p = byId(S.projects, pid); if (!p) return; name = p.name; L = S.tasks.filter(function (t) { return t.project_id === pid; }); }
    else { var from = addDays(today(), -7); L = S.tasks.filter(function (t) { return (t.done_at && ymd(new Date(t.done_at)) >= from) || t.status !== 'erledigt'; }); }
    if (!L.length) { toast('Dafür gibt es noch keine Aufgaben.'); return; }
    aiBusy(btn, true);
    aiCall('summary', { kind: kind, name: name, tasks: L.slice(0, 80).map(taskBrief) }).then(function (r) {
      var html = '<div class="ai-card"><div class="ai-h">' + SPARK + '<b>' + (kind === 'week' ? 'Wochenrückblick' : 'Zusammenfassung') + '</b></div><p class="ai-tip">' + esc(String(r.text || '').slice(0, 900)) + '</p>' +
        (strList(r.points, 4, 200).length ? '<ul class="ai-pts">' + strList(r.points, 4, 200).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
      var box = $(kind === 'week' ? 'ai-week' : 'ai-proj'); if (box) box.innerHTML = html;
    }, function (e) { toast(e.message); }).then(function () { aiBusy(btn, false); });
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
    var active = document.activeElement, keepId = active && (active.id === 'f-search' || active.id === 'q-title') ? active.id : '', caret = keepId ? active.selectionStart : 0;
    var qv = $('q-title') ? $('q-title').value : '';
    var v = $('view');
    v.classList.toggle('anim', S.animNext); S.animNext = false;
    v.innerHTML = S.tab === 'board' ? viewBoard() : S.tab === 'kalender' ? viewKalender() : S.tab === 'projekte' ? viewProjekte() : S.tab === 'team' ? viewTeam() : S.tab === 'berichte' ? viewBerichte() : viewHeute();
    if ($('q-title')) { $('q-title').value = qv; quickHint(); }
    if (keepId) { var f = $(keepId); if (f) { f.focus(); try { f.setSelectionRange(caret, caret); } catch (e) {} } }
    focusTick(); timerTick();
    if (!S.checked) { S.checked = true; setTimeout(checkGoal, 800); }
    if (!S.reminded) { S.reminded = true; setTimeout(dailyReminder, 1500); }
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
    var v = t || Object.assign({ title: '', notes: '', status: S.tab === 'board' ? S.boardStatus : 'offen', priority: 2, due: '', project_id: S.filterProject || '', assignee: S.uid }, S.preset || {});
    S.preset = null;
    var projects = [{ k: '', l: 'Ohne Projekt' }].concat(S.projects.slice().sort(byName).map(function (p) { return { k: p.id, l: p.name }; }));
    var people = [{ k: '', l: 'Niemand' }].concat(S.members.map(function (m) { return { k: m.user_id, l: who(m.user_id).label }; }));
    var meta = t ? '<p class="meta-line">Angelegt ' + (t.created_by ? 'von ' + esc(who(t.created_by).name) + ' ' : '') + esc(ago(t.created_at)) + (t.done_at ? ' · erledigt ' + esc(ago(t.done_at)) : '') + '</p>' : '';
    return wrapForm('task-form', id, head(t ? 'Aufgabe' : 'Neue Aufgabe', t ? 'Sichern' : 'Hinzufügen') +
      '<div class="group first"><div class="f row"><input id="t-title" type="text" maxlength="200" autocomplete="off" placeholder="Titel" aria-label="Titel" value="' + esc(v.title) + '"></div>' +
      '<div class="f row"><textarea id="t-notes" rows="3" maxlength="5000" placeholder="Notizen" aria-label="Notizen">' + esc(v.notes) + '</textarea></div></div>' +
      '<div class="group" style="margin-top:18px">' +
      '<label class="f row" for="t-project"><span class="lbl">Projekt</span><span class="val"><select id="t-project">' + opts(projects, v.project_id || '') + '</select><i class="chev"></i></span></label>' +
      '<label class="f row" for="t-assignee"><span class="lbl">Zuständig</span><span class="val"><select id="t-assignee">' + opts(people, v.assignee || '') + '</select><i class="chev"></i></span></label>' +
      '<label class="f row" for="t-due"><span class="lbl">Fällig am</span><span class="val"><button type="button" class="txt-btn" id="clear-due" data-action="clear-due"' + (v.due ? '' : ' hidden') + '>Entfernen</button><input id="t-due" type="date" value="' + esc(v.due || '') + '"></span></label>' +
      '<label class="f row" for="t-repeat"><span class="lbl">Wiederholen</span><span class="val"><select id="t-repeat">' + opts(REPEAT, v.repeat || '') + '</select><i class="chev"></i></span></label></div>' +
      '<div class="sec-h"><span>Status</span></div>' + segc({ id: 't-status', list: STATUS, sel: v.status, label: 'Status' }) +
      '<div class="sec-h"><span>Priorität</span></div>' + segc({ id: 't-priority', list: PRIO, sel: v.priority, label: 'Priorität' }) +
      '<div class="sec-h"><span>Unteraufgaben</span><span class="sec-r"><span id="sub-count"></span>' + aiBtn('ai-subs', 'Vorschlagen') + '</span></div><div id="ai-subs"></div><div class="group" id="subs"></div>' +
      (t ? '<div class="sec-h"><span>Zeit</span><span id="time-total"></span></div><div class="group" id="times"></div>' : '') +
      (t ? '<div class="sec-h"><span>Kommentare</span></div><div class="group" id="comments"></div>' : '') +
      '<div class="form-error" id="form-error" role="alert"></div>' + meta +
      (t ? '<div class="group" style="margin-top:18px"><button type="button" class="row-btn accent" data-action="dup-task" data-id="' + esc(t.id) + '"><span class="grow">Aufgabe duplizieren</span></button></div>' +
        '<div class="group" style="margin-top:12px"><button type="button" class="row-btn destructive" data-action="delete-task">Aufgabe löschen</button></div>' : ''));
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
    renderSubs(); renderComments(); renderTimes();
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
      (p && aiOn() ? '<div class="ai-row" style="margin-top:18px">' + aiBtn('ai-proj', 'Stand zusammenfassen', ' data-id="' + esc(p.id) + '"') + '</div><div id="ai-proj"></div>' : '') +
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
      (S.email ? '<div class="row-btn static"><span class="grow muted">' + esc(S.email) + '</span></div>' : '') + '</div>' +
      '<div class="sec-h"><span>Tagesziel</span><span>Aufgaben pro Tag</span></div>' + segc({ list: [{ k: 1, l: '1' }, { k: 3, l: '3' }, { k: 5, l: '5' }, { k: 8, l: '8' }, { k: 12, l: '12' }], sel: goal(), action: 'goal', label: 'Tagesziel' }) +
      '<div class="group" style="margin-top:12px"><button type="button" class="row-btn" data-action="toggle-sound"><span class="grow">Ton beim Abhaken</span><span class="muted" id="sound-state">' + (soundOn() ? 'An' : 'Aus') + '</span></button></div>' +
      '<div class="sec-h"><span>KI-Assistent</span></div><div class="group"><button type="button" class="row-btn" data-action="toggle-ai"><span class="grow">' + SPARK + ' KI-Funktionen anzeigen</span><span class="muted" id="ai-state">' + (aiOn() ? 'An' : 'Aus') + '</span></button></div>' +
      '<p class="meta-line">Die KI (Google Gemini) läuft nur, wenn du auf einen ✦-Knopf klickst. Dabei werden die betroffenen Aufgabentitel an Google geschickt – im Gratis-Tarif kann Google sie zur Verbesserung nutzen. Nichts Vertrauliches eintragen. Höchstens 100 Anfragen pro Person und Tag.</p>' +
      '<div class="sec-h"><span>Darstellung</span></div>' + segc({ list: THEMES, sel: theme(), action: 'theme', label: 'Design' }) +
      '<div class="group" style="margin-top:12px"><button type="button" class="row-btn" data-action="toggle-notify"><span class="grow">Benachrichtigungen</span><span class="muted" id="notify-state">' + (notifyOn() ? 'An' : 'Aus') + '</span></button></div>' +
      '<div class="sec-h"><span>Sicherung</span></div><div class="group">' +
      '<button type="button" class="row-btn accent" data-action="backup-now"><span class="grow">' + I.cloud + ' Jetzt in Supabase sichern</span></button>' +
      '<button type="button" class="row-btn accent" data-action="export-json"><span class="grow">Sicherung als Datei herunterladen</span></button>' +
      '<button type="button" class="row-btn accent" data-action="export-csv"><span class="grow">Aufgaben als Excel/CSV exportieren</span></button></div>' +
      '<div class="sec-h"><span>Letzte Cloud-Sicherungen</span></div><div class="group" id="backup-list">' + backupList() + '</div>' +
      '<div class="sec-h"><span>Tastenkürzel</span></div><div class="group keys">' +
      [['Strg + K', 'Schnellsuche'], ['N', 'Neue Aufgabe'], ['1 – 6', 'Bereich wechseln'], ['/', 'Schnell-Eingabe'], ['Esc', 'Schließen']].map(function (k) { return '<div class="row-btn static"><span class="grow">' + k[1] + '</span><kbd>' + k[0] + '</kbd></div>'; }).join('') + '</div>' +
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
    S.armed = null; S.aiSubs = []; S.sheet = { kind: kind, id: id || '' }; S.last = document.activeElement; S.draftSubs = [];
    var el = $('sheet');
    el.classList.remove('closing');
    el.innerHTML = html; el.hidden = false;
    document.documentElement.classList.add('lock');
    if (kind === 'task') refreshSheet();
    if (kind === 'settings') loadBackups();
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
      status: g('t-status'), priority: Number(g('t-priority')), due: g('t-due') || null, repeat: g('t-repeat') || '' };
    if (data.repeat && !data.due) data.due = today();
    var id = form.dataset.id;
    if (id) S.mine[id] = Date.now();
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
    if (next === 'erledigt') {
      celebrateAt(btn); rewardDone();
      if (!t.repeat) toast('Erledigt: ' + t.title, { label: 'Rückgängig', fn: function undo() { if (S.busy[id]) { setTimeout(undo, 200); return; } setStatus(id, prev); } });
      else toast('Erledigt – die nächste Wiederholung ist angelegt');
    }
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
    if (tab) { goTab(tab.dataset.tab); return; }
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
        deleteTask(S.sheet.id);
        break;
      case 'dup-task': closeSheet(); duplicateTask(id); break;
      case 'timer-start': timerStart(id); break;
      case 'timer-stop': timerStop(); break;
      case 'timer-pill': if (el.dataset.id && byId(S.tasks, el.dataset.id)) openSheet('task', el.dataset.id); break;
      case 'time-add': timeAdd(id, Number(el.dataset.min) || 15); break;
      case 'time-del': timeDel(id); break;
      case 'export-times': exportTimes(); break;
      case 'rep-scope': S.repScope = el.dataset.seg; setTimeout(render, 160); break;
      case 'board-view': S.boardView = el.dataset.seg; S.sel = {}; setTimeout(render, 160); break;
      case 'sort': if (S.sortKey === el.dataset.k) S.sortDir = -S.sortDir; else { S.sortKey = el.dataset.k; S.sortDir = 1; } $('board-cols').innerHTML = boardCols(); break;
      case 'sel': if (S.sel[id]) delete S.sel[id]; else S.sel[id] = true; S.armed = null; $('board-cols').innerHTML = boardCols(); break;
      case 'sel-all':
        var vis = filterTasks(), on = vis.length && vis.every(function (t) { return S.sel[t.id]; });
        S.sel = {}; if (!on) vis.forEach(function (t) { S.sel[t.id] = true; }); $('board-cols').innerHTML = boardCols(); break;
      case 'sel-clear': S.sel = {}; S.armed = null; $('board-cols').innerHTML = boardCols(); break;
      case 'bulk-del': if (S.armed !== 'bulk-del') { S.armed = 'bulk-del'; $('board-cols').innerHTML = boardCols(); break; } S.armed = null; bulkDelete(); break;
      case 'ai-subs': aiSubtasks(el); break;
      case 'ai-sub-add': aiSubAdd(Number(el.dataset.i)); break;
      case 'ai-subs-all': aiSubsAll(); break;
      case 'ai-subs-close': S.aiSubs = []; renderAiSubs(); break;
      case 'ai-parse': aiParse(el); break;
      case 'ai-plan': aiPlan(el); break;
      case 'ai-plan-close': S.aiPlan = null; render(); break;
      case 'ai-week': aiSummary(el, 'week'); break;
      case 'ai-proj': aiSummary(el, 'project', id); break;
      case 'toggle-ai': ls(LS_AI, aiOn() ? '0' : null); var as = $('ai-state'); if (as) as.textContent = aiOn() ? 'An' : 'Aus'; queue(); break;
      case 'toast-act': var fn = S.toastFn; S.toastFn = null; $('toast').hidden = true; if (fn) fn(); break;
      case 'goal': ls(LS_GOAL, el.dataset.seg); ls(LS_GOALDAY, null); queue(); break;
      case 'toggle-sound': ls(LS_SOUND, soundOn() ? null : '1'); var ss = $('sound-state'); if (ss) ss.textContent = soundOn() ? 'An' : 'Aus'; if (soundOn()) tone([784, 1175]); break;
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
      case 'theme': ls(LS_THEME, el.dataset.seg === 'auto' ? null : el.dataset.seg); applyTheme(); break;
      case 'toggle-notify': toggleNotify(); break;
      case 'backup-now': backupNow(el); break;
      case 'backup-dl': backupDownload(id); break;
      case 'backup-restore':
        if (S.armed !== 'restore:' + id) { S.armed = 'restore:' + id; refreshSettings(); break; }
        S.armed = null; backupRestore(id, el); break;
      case 'export-json': exportJson(); break;
      case 'export-csv': exportCsv(); break;
      case 'focus-start': focusStart(Number(el.dataset.min) || 25); break;
      case 'focus-stop': focusStop(); break;
      case 'focus-pill': goTab('heute'); break;
      case 'cal-prev': case 'cal-next':
        var cm = parse(S.calMonth || monthStart(today())); cm.setMonth(cm.getMonth() + (a === 'cal-next' ? 1 : -1)); S.calMonth = ymd(cm); render(); break;
      case 'cal-today': S.calMonth = monthStart(today()); S.calDay = today(); render(); break;
      case 'cal-day':
        if (e.target.closest('.cal-chip')) { openSheet('task', e.target.closest('.cal-chip').dataset.task); break; }
        S.calDay = el.dataset.day; if (S.calDay.slice(0, 7) !== (S.calMonth || '').slice(0, 7)) S.calMonth = monthStart(S.calDay); render(); break;
      case 'cal-filter': S.calMine = el.dataset.seg === 'mine'; setTimeout(render, 160); break;
      case 'new-task-day': S.preset = { due: S.calDay }; openSheet('task'); break;
      case 'palette': openPalette(); break;
      case 'pal-close': closePalette(); break;
      case 'pal-run': palRun(Number(el.dataset.i)); break;
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'f-search') { S.search = e.target.value; var c = $('board-cols'); c.classList.toggle('searching', !!S.search); c.innerHTML = boardCols(); }
    else if (e.target.id === 'q-title') quickHint();
    else if (e.target.id === 'pal-q') { if (S.pal) S.pal.i = 0; palRender(); }
    else if (e.target.id === 'c-new') { $('c-send').disabled = !e.target.value.trim(); autoGrow(e.target); }
  });
  document.addEventListener('change', function (e) {
    var id = e.target.id;
    if (id === 'f-project') { S.filterProject = e.target.value; $('board-cols').innerHTML = boardCols(); }
    else if (id === 'f-due') { S.filterDue = e.target.value; $('board-cols').innerHTML = boardCols(); }
    else if (id === 'f-prio') { S.filterPrio = e.target.value; $('board-cols').innerHTML = boardCols(); }
    else if (id === 'b-status' && e.target.value) bulkUpdate({ status: e.target.value }, 'aktualisiert');
    else if (id === 'b-assignee' && e.target.value) bulkUpdate({ assignee: e.target.value === '-' ? null : e.target.value }, 'zugewiesen');
    else if (id === 'b-due' && e.target.value) bulkUpdate({ due: e.target.value }, 'verschoben');
    else if (id === 't-due') { var c = $('clear-due'); if (c) c.hidden = !e.target.value; }
    else if (id === 'p-due') { var c2 = $('clear-pdue'); if (c2) c2.hidden = !e.target.value; }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); S.pal ? closePalette() : openPalette(); return; }
    if (S.pal) {
      if (e.key === 'Escape') { closePalette(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var n = S.pal.items.length; if (n) { S.pal.i = (S.pal.i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; palRender(); } return; }
      if (e.key === 'Enter') { e.preventDefault(); palRun(S.pal.i); return; }
      return;
    }
    if (e.key === 'Escape' && S.sheet) { closeSheet(); return; }
    if (e.key === 'Enter' && e.target.matches && e.target.matches('[role="button"][data-action]')) { e.preventDefault(); e.target.click(); return; }
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (!typing && !S.sheet && S.screen === 'app' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openSheet('task'); return; }
      if (/^[1-6]$/.test(e.key)) { goTab(TABS[Number(e.key) - 1]); return; }
      if (e.key === '/') { var qi = $('q-title') || $('f-search'); if (qi) { e.preventDefault(); qi.focus(); } return; }
    }
    if (e.key === 'Enter' && e.target.id === 'sub-new') { e.preventDefault(); addSub(e.target); return; }
    if (e.key === 'Enter' && e.target.id === 'c-new' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendComment(); }
  });
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.id === 'auth-form') authSubmit(f);
    else if (f.id === 'task-form') saveTask(f);
    else if (f.id === 'project-form') saveProject(f);
    else if (f.id === 'quick-form') quickSubmit();
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
  document.addEventListener('dragstart', function (e) {
    var r = e.target.closest && e.target.closest('[data-task][draggable]'); if (!r) return;
    S.dragId = r.dataset.task; r.classList.add('dragging');
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', S.dragId); } catch (er) {}
  });
  document.addEventListener('dragend', function () { S.dragId = null; document.querySelectorAll('.dragging,.drop-on').forEach(function (x) { x.classList.remove('dragging', 'drop-on'); }); });
  function dropTarget(e) { return e.target.closest && (e.target.closest('.cols > section[data-col]') || e.target.closest('.cal-day')); }
  document.addEventListener('dragover', function (e) {
    if (!S.dragId) return; var t = dropTarget(e); if (!t) return;
    e.preventDefault(); document.querySelectorAll('.drop-on').forEach(function (x) { if (x !== t) x.classList.remove('drop-on'); }); t.classList.add('drop-on');
  });
  document.addEventListener('drop', function (e) {
    var t = dropTarget(e), id = S.dragId; if (!t || !id) return;
    e.preventDefault(); t.classList.remove('drop-on');
    if (t.dataset.col) setStatus(id, t.dataset.col, t); else if (t.dataset.day) moveDue(id, t.dataset.day);
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
