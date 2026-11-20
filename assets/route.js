/* Карта «Маршрут» на странице ведения: пунктирная дорога через все остановки.
   Линия строится по положению знаков и перестраивается при изменении размера окна. */
(function () {
  'use strict';
  var route = document.getElementById('route');
  if (!route) return;
  var svg = route.querySelector('.route-line');
  var path = svg && svg.querySelector('path');
  if (!path) return;

  function f(n) { return n.toFixed(1); }

  function draw() {
    var box = route.getBoundingClientRect();
    var stops = route.querySelectorAll('.stop');
    var pts = [];
    for (var i = 0; i < stops.length; i++) {
      var m = stops[i].querySelector('.stop-mark');
      if (!m) continue;
      var r = m.getBoundingClientRect();
      var s = stops[i].getBoundingClientRect();
      pts.push({ x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top,
                 top: s.top - box.top, bottom: s.bottom - box.top });
    }
    if (pts.length < 2) return;
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    var d = 'M' + f(pts[0].x) + ' ' + f(pts[0].y);
    for (var j = 1; j < pts.length; j++) {
      var a = pts[j - 1], b = pts[j], dx = b.x - a.x;
      if (Math.abs(dx) < 100) {
        // знаки почти друг под другом — плавная извилина
        var dy = (b.y - a.y) * 0.55;
        d += ' C' + f(a.x) + ' ' + f(a.y + dy) + ' ' + f(b.x) + ' ' + f(b.y - dy) + ' ' + f(b.x) + ' ' + f(b.y);
      } else {
        // знаки по разные стороны — дорога идёт вниз вдоль знака, поворачивает в просвет
        // между остановками и выходит к следующему знаку, не пересекая текст
        var gy = (a.bottom + b.top) / 2;
        var dir = dx > 0 ? 1 : -1;
        var rr = Math.max(4, Math.min(26, Math.abs(dx) / 2, gy - a.y - 4, b.y - gy - 4));
        d += ' L' + f(a.x) + ' ' + f(gy - rr) +
             ' Q' + f(a.x) + ' ' + f(gy) + ' ' + f(a.x + dir * rr) + ' ' + f(gy) +
             ' L' + f(b.x - dir * rr) + ' ' + f(gy) +
             ' Q' + f(b.x) + ' ' + f(gy) + ' ' + f(b.x) + ' ' + f(gy + rr) +
             ' L' + f(b.x) + ' ' + f(b.y);
      }
    }
    path.setAttribute('d', d);
  }

  var t = null;
  function later() { clearTimeout(t); t = setTimeout(draw, 80); }
  draw();
  window.addEventListener('resize', later);
  window.addEventListener('load', draw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
