// 화면 움직임: 스크롤하면 나타나기, 숫자 세기, 읽은 만큼 막대, 지금 보는 메뉴 표시.
// '동작 줄이기'를 켠 사람과 스크립트가 꺼진 브라우저에는 움직임 없이 내용이 그대로 보이게 한다.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (!reduce && 'IntersectionObserver' in window) root.classList.add('motion');

  document.addEventListener('DOMContentLoaded', function () {
    progressBar();
    activeNav();
    if (!root.classList.contains('motion')) return;
    reveal();
    countUp();
  });

  // 읽은 만큼 위쪽 메뉴 아래에 막대가 찬다
  function progressBar() {
    var nav = document.querySelector('.top');
    if (!nav) return;
    var bar = document.createElement('span');
    bar.className = 'read-bar';
    bar.setAttribute('aria-hidden', 'true');
    nav.appendChild(bar);
    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // 지금 보고 있는 구역의 메뉴에 표시
  function activeNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = {};
    document.querySelectorAll('.top a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = links[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('is-active'); links[k].removeAttribute('aria-current'); });
          a.classList.add('is-active');
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  // 화면에 들어오면 아래에서 살짝 올라오며 나타난다
  function reveal() {
    var items = document.querySelectorAll('.waybill, .skills, .steps li, .proj, .cardx, .limits li, .contact-box, section h2, .log, .hero > .wrap > h1');
    // 메뉴를 눌러 한 번에 건너뛰면 지나친 칸이 숨은 채 남을 수 있어, 화면 위쪽에 있는 칸은 모두 함께 보여 준다
    function showPassed() {
      document.querySelectorAll('.rv:not(.is-in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); io.unobserve(el); }
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
      showPassed();
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    window.addEventListener('scroll', function () { window.requestAnimationFrame(showPassed); }, { passive: true });
    items.forEach(function (el, i) {
      el.classList.add('rv');
      // 같은 줄에 나란히 있는 칸은 조금씩 늦게 나타나게 한다
      if (el.matches('.steps li, .cardx, .limits li')) el.style.transitionDelay = (indexIn(el) * 90) + 'ms';
      io.observe(el);
    });
  }
  function indexIn(el) { return Array.prototype.indexOf.call(el.parentNode.children, el); }

  // 운송장의 숫자를 0부터 센다. 글자(건, 개, ·, /)는 그대로 둔다
  function countUp() {
    var cells = document.querySelectorAll('.wb-cargo dd');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(e.target);
      });
    }, { threshold: 0.6 });
    cells.forEach(function (c) { c.setAttribute('data-final', c.textContent); io.observe(c); });

    function run(el) {
      var text = el.getAttribute('data-final');
      var nums = text.match(/\d+/g);
      if (!nums) return;
      var start = null, dur = 900;
      function frame(t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var i = 0;
        el.textContent = text.replace(/\d+/g, function (n) { i++; return String(Math.round(Number(n) * eased)); });
        if (p < 1) window.requestAnimationFrame(frame);
        else el.textContent = text;
      }
      window.requestAnimationFrame(frame);
    }
  }
})();
