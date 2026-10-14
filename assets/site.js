/* Golem: видео перехода между разделами.
   Ссылки с атрибутом data-transition открывают следующую страницу через короткое видео.
   Видео заранее загружается в память (iPhone сам его не подгружает), а пока оно стартует,
   на экране уже стоит его первый кадр. Если видео так и не запустилось, страница
   открывается после кадра, без долгого ожидания. */
(function () {
  'use strict';

  // Видео в цвете гравюр; на экране стоит в рамке, как гравюры на страницах.
  var VIDEO = {
    webm: 'video/transition3.webm',
    mp4: 'video/transition3.mp4',
    poster: 'video/transition3-poster.jpg'
  };
  function videoSet() { return VIDEO; }
  var START_WAIT_MS = 1200;  // сколько ждём, пока видео начнёт играть
  var MAX_MS = 3200;         // переход не дольше этого в любом случае
  var STILL_MS = 650;        // сколько держим кадр, если видео играть нельзя

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function pickSource(set) {
    var t = document.createElement('video');
    if (t.canPlayType && t.canPlayType('video/mp4; codecs="avc1.42E01E"')) return set.mp4;
    if (t.canPlayType && t.canPlayType('video/webm; codecs="vp9"')) return set.webm;
    return set.mp4;
  }

  var videoSrc = null;   // blob: из памяти или обычный адрес файла
  var videoSrcSet = null; // для какой версии (H или V) загружено видео в память
  var video = null;
  var veil = null;

  function getVideo() {
    if (!video) {
      video = document.createElement('video');
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('aria-hidden', 'true');
      video.preload = 'auto';
    }
    var set = videoSet();
    var want = (videoSrc && videoSrcSet === set) ? videoSrc : pickSource(set);
    if (video.getAttribute('src') !== want) video.setAttribute('src', want);
    return video;
  }

  // Сразу после открытия страницы: кадр и видео — в память.
  window.addEventListener('load', function () {
    var set = videoSet();
    try { var still = new Image(); still.src = set.poster; } catch (e) {}
    if (reduceMotion || !window.fetch || !window.URL || !URL.createObjectURL) return;
    var url = pickSource(set);
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error('video ' + r.status);
      return r.blob();
    }).then(function (b) {
      videoSrc = URL.createObjectURL(b);
      videoSrcSet = set;
      var v = getVideo();
      try { v.load(); } catch (e) {}
    }).catch(function () { videoSrc = url; });
  });

  function removeVeil() {
    if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
    veil = null;
    if (video) { try { video.pause(); } catch (e) {} video.classList.remove('is-playing'); }
  }

  function transitionTo(href) {
    var done = false;
    var started = false;
    function go() {
      if (done) return;
      done = true;
      window.location.href = href;
    }

    veil = document.createElement('div');
    veil.className = 'veil';
    var frame = document.createElement('div');
    frame.className = 'veil-frame';
    var media = document.createElement('div');
    media.className = 'veil-media';
    var still = document.createElement('img');
    still.className = 'veil-still';
    still.alt = '';
    still.src = videoSet().poster;
    media.appendChild(still);
    frame.appendChild(media);
    veil.appendChild(frame);
    var skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'veil-skip';
    skip.textContent = 'Пропустить';
    veil.addEventListener('click', go);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        document.removeEventListener('keydown', onKey);
        go();
      }
    });

    if (reduceMotion) {
      // Без движения: только мягкое затемнение с кадром.
      veil.appendChild(skip);
      document.body.appendChild(veil);
      requestAnimationFrame(function () { if (veil) veil.classList.add('is-on'); });
      setTimeout(go, STILL_MS);
      return;
    }

    var v = getVideo();
    v.classList.remove('is-playing');
    media.appendChild(v);
    veil.appendChild(skip);
    document.body.appendChild(veil);
    requestAnimationFrame(function () { if (veil) veil.classList.add('is-on'); });

    v.onplaying = function () { started = true; v.classList.add('is-playing'); still.style.opacity = '0'; };
    v.onended = go;
    v.onerror = function () { setTimeout(go, STILL_MS); };
    try { v.currentTime = 0; } catch (e) {}
    var played;
    try { played = v.play(); } catch (e) { setTimeout(go, STILL_MS); }
    if (played && typeof played.catch === 'function') {
      played.catch(function () { setTimeout(go, STILL_MS); });
    }
    setTimeout(function () { if (!started) go(); }, START_WAIT_MS);
    setTimeout(go, MAX_MS);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;

    // Ссылки, которых ещё нет: в черновике ничего не делаем.
    if (a.hasAttribute('data-todo')) { e.preventDefault(); return; }

    if (!a.hasAttribute('data-transition')) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    transitionTo(a.href);
  });

  // Возврат кнопкой «Назад»: страница может прийти из кэша вместе с затемнением — убираем его.
  window.addEventListener('pageshow', removeVeil);
})();
