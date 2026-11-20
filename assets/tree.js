/* Древо сфирот на странице ведения: знак на древе и строка легенды подсвечивают друг друга. */
(function () {
  'use strict';
  var route = document.getElementById('route');
  if (!route) return;
  var marks = route.querySelectorAll('.tree-stop');
  var items = route.querySelectorAll('.tree-item');

  function lit(n, on) {
    for (var i = 0; i < marks.length; i++) if (marks[i].getAttribute('data-st') === n) marks[i].classList.toggle('is-lit', on);
    for (var j = 0; j < items.length; j++) if (items[j].getAttribute('data-st') === n) items[j].classList.toggle('is-lit', on);
  }
  function bind(el) {
    var n = el.getAttribute('data-st');
    el.addEventListener('mouseenter', function () { lit(n, true); });
    el.addEventListener('mouseleave', function () { lit(n, false); });
    el.addEventListener('focus', function () { lit(n, true); }, true);
    el.addEventListener('blur', function () { lit(n, false); }, true);
  }
  for (var i = 0; i < marks.length; i++) bind(marks[i]);
  for (var j = 0; j < items.length; j++) bind(items[j]);

  // нажатие на знак древа: плавно к строке легенды
  for (var k = 0; k < marks.length; k++) {
    marks[k].addEventListener('click', function (e) {
      var target = document.getElementById('st-' + this.getAttribute('data-st'));
      if (!target) return;
      e.preventDefault();
      try { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (x) { target.scrollIntoView(); }
      var n = this.getAttribute('data-st');
      lit(n, true);
      setTimeout(function () { lit(n, false); }, 1600);
    });
  }
})();

/* Три карты форматов на телефоне: точки под лентой показывают, какая карта перед глазами. */
(function () {
  'use strict';
  var list = document.getElementById('tarots');
  var dots = document.getElementById('tarot-dots');
  if (!list || !dots) return;
  var cards = list.querySelectorAll('.tarot');
  var marks = dots.querySelectorAll('i');
  function update() {
    var mid = list.scrollLeft + list.clientWidth / 2, best = 0, bestD = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i].offsetLeft + cards[i].offsetWidth / 2, d = Math.abs(c - mid);
      if (d < bestD) { bestD = d; best = i; }
    }
    for (var j = 0; j < marks.length; j++) marks[j].classList.toggle('is-on', j === best);
  }
  var t = null;
  list.addEventListener('scroll', function () { if (t) cancelAnimationFrame(t); t = requestAnimationFrame(update); }, { passive: true });
})();
