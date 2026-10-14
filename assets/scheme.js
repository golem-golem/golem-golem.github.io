/* Схема «О курсе»: четыре знака, каждый открывает свою часть.
   Когда открыты все четыре, спираль в центре загорается и появляется приглашение записаться. */
(function () {
  'use strict';

  var scheme = document.getElementById('scheme');
  var panel = document.getElementById('scheme-panel');
  var progress = document.getElementById('scheme-progress');
  if (!scheme || !panel || !progress) return;

  var nodes = Array.prototype.slice.call(scheme.querySelectorAll('.scheme-node'));
  var texts = Array.prototype.slice.call(panel.querySelectorAll('[data-text]'));
  var total = nodes.length;
  var opened = {};

  function count() { return Object.keys(opened).length; }

  function show(key) {
    texts.forEach(function (t) { t.hidden = t.getAttribute('data-text') !== key; });
  }

  function renderProgress() {
    var n = count();
    if (n < total) {
      progress.textContent = 'Открыто ' + n + ' из ' + total;
      return;
    }
    progress.textContent = '';
    var done = document.createElement('span');
    done.textContent = 'Схема собрана. ';
    var link = document.createElement('a');
    link.href = '#zapis';
    link.textContent = 'Записаться на поток →';
    progress.appendChild(done);
    progress.appendChild(link);
  }

  nodes.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-node');
      opened[key] = true;
      nodes.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      btn.classList.add('is-open');
      show(key);
      if (count() === total) scheme.classList.add('is-complete');
      renderProgress();

      // На телефоне панель с текстом может быть ниже экрана — плавно показываем её.
      var r = panel.getBoundingClientRect();
      if (r.top > window.innerHeight - 80 || r.bottom < 0) {
        try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { panel.scrollIntoView(false); }
      }
    });
  });
})();
