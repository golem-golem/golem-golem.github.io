/* Полка библиотеки: строится из списка GOLEM_BOOKS, книги стоят по фамилиям под буквенными табличками.
   Клик по корешку раскрывает книгу со ссылкой на файл в Telegram. */
(function () {
  'use strict';

  var shelves = document.getElementById('shelves');
  var modal = document.getElementById('book-modal');
  if (!shelves || !modal) return;

  var books = (window.GOLEM_BOOKS || []).filter(function (b) { return b && b.title; });

  function sortKey(b) { return String(b.surname || b.author || '').trim(); }
  function letterOf(b) {
    var ch = sortKey(b).charAt(0).toLocaleUpperCase('ru');
    return ch === 'Ё' ? 'Е' : ch;
  }
  books.sort(function (a, b) {
    var c = sortKey(a).localeCompare(sortKey(b), 'ru', { sensitivity: 'base' });
    return c !== 0 ? c : String(a.title).localeCompare(String(b.title), 'ru');
  });

  // Стабильный «случайный» вид корешка: зависит только от автора и названия.
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  var CLOTH = [
    { bg: '#581b25' }, { bg: '#1f1712' }, { bg: '#7b5a34', light: true }, { bg: '#3b4030' },
    { bg: '#6e2216' }, { bg: '#4b3322' }, { bg: '#8a3a1c', light: true }, { bg: '#2f3644' }
  ];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var groups = [];
  books.forEach(function (b) {
    var L = letterOf(b);
    var g = groups.length ? groups[groups.length - 1] : null;
    if (!g || g.letter !== L) { g = { letter: L, items: [] }; groups.push(g); }
    g.items.push(b);
  });

  var frag = document.createDocumentFragment();
  groups.forEach(function (g) {
    var bay = el('div', 'bay');
    var row = el('div', 'bay-books');
    g.items.forEach(function (b) {
      var h = hash(String(b.author) + '|' + String(b.title));
      var cloth = CLOTH[(h >>> 9) % CLOTH.length];
      var len = String(b.title).length;
      var w = 42 + (h % 24);
      // длинным названиям — корешок повыше и шрифт помельче, чтобы название помещалось
      var ht = 226 + ((h >>> 5) % 50) + Math.min(36, Math.max(0, len - 12) * 2);
      var btn = el('button', 'spine' + (cloth.light ? ' spine--light' : '') + ((h >>> 13) % 7 === 0 ? ' spine--tilt' : '') + (len > 18 ? ' spine--long' : ''));
      btn.type = 'button';
      btn.style.setProperty('--w', String(w));
      btn.style.setProperty('--h', String(ht));
      btn.style.setProperty('--bg', cloth.bg);
      btn.setAttribute('aria-label', b.author + ' — ' + b.title);
      btn.title = b.author + ' — ' + b.title;
      btn.appendChild(el('span', 'spine-band'));
      var t = el('span', 'spine-title', b.title);
      t.setAttribute('aria-hidden', 'true');
      var a = el('span', 'spine-author', b.surname || b.author);
      a.setAttribute('aria-hidden', 'true');
      btn.appendChild(t);
      btn.appendChild(a);
      btn.appendChild(el('span', 'spine-band'));
      btn.addEventListener('click', function () { openBook(b, btn); });
      row.appendChild(btn);
    });
    bay.appendChild(row);
    var plaque = el('span', 'plaque', g.letter);
    plaque.setAttribute('aria-hidden', 'true');
    bay.appendChild(plaque);
    frag.appendChild(bay);
  });
  shelves.textContent = '';
  shelves.appendChild(frag);

  var count = document.getElementById('book-count');
  if (count) count.textContent = String(books.length);

  // ---------- раскрытая книга ----------
  var authorEl = document.getElementById('book-author');
  var titleEl = document.getElementById('book-title');
  var readLink = document.getElementById('book-read');
  var noLink = document.getElementById('book-nolink');
  var lastFocus = null;

  function normalizeLink(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
    return u;
  }

  function openBook(b, from) {
    lastFocus = from || document.activeElement;
    authorEl.textContent = b.author;
    titleEl.textContent = b.title;
    var link = normalizeLink(b.link);
    if (link) {
      readLink.href = link;
      readLink.hidden = false;
      noLink.hidden = true;
    } else {
      readLink.removeAttribute('href');
      readLink.hidden = true;
      noLink.hidden = false;
    }
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    var first = link ? readLink : modal.querySelector('.book-close-link');
    if (first) first.focus();
  }

  function closeBook() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  modal.addEventListener('click', function (e) {
    if (e.target === modal || (e.target.closest && e.target.closest('[data-close]'))) closeBook();
  });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') { closeBook(); return; }
    if (e.key === 'Tab') {
      var items = Array.prototype.filter.call(
        modal.querySelectorAll('a[href], button:not([disabled])'),
        function (n) { return !n.hidden && n.offsetParent !== null; }
      );
      if (!items.length) return;
      var firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  });
})();
