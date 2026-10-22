/* Valle Central · Gruppe C · Interaktion und Diagramme */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  doc.classList.add("js");
  if (!reduce) doc.classList.add("js-motion");

  var NS = "http://www.w3.org/2000/svg";
  var VC = window.VC || {};
  var fmt = function (n, d) {
    return Number(n).toLocaleString("de-DE", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  };
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, cls, anchor) {
    var t = el("text", { x: x, y: y, "class": cls || "ax" }, parent);
    if (anchor) t.setAttribute("text-anchor", anchor);
    t.textContent = s;
    return t;
  }
  function beimSichtbarwerden(node, fn, schwelle) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (eintr) {
      eintr.forEach(function (e) {
        if (e.isIntersecting) { fn(); io.disconnect(); }
      });
    }, { threshold: schwelle || 0.25 });
    io.observe(node);
  }

  /* ---------- Wasserlinie und Kapitelanzeige ---------- */
  var linie = document.querySelector(".wasserlinie span");
  var tick = false;
  function fortschritt() {
    tick = false;
    var max = doc.scrollHeight - window.innerHeight;
    if (linie && max > 0) linie.style.setProperty("--p", Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4));
  }
  window.addEventListener("scroll", function () {
    if (!tick) { tick = true; requestAnimationFrame(fortschritt); }
  }, { passive: true });
  fortschritt();

  var aktuell = document.querySelector(".kn-aktuell");
  var nav = document.querySelector(".kapitelnav details");
  var titel = {};
  document.querySelectorAll(".kapitelnav a").forEach(function (a) {
    titel[a.getAttribute("href").slice(1)] = a.textContent.replace(/^\s*\S+\s+/, "");
    a.addEventListener("click", function () { if (nav) nav.open = false; });
  });
  titel.start = "Start";
  if ("IntersectionObserver" in window && aktuell) {
    var kio = new IntersectionObserver(function (eintr) {
      eintr.forEach(function (e) {
        if (e.isIntersecting && titel[e.target.id]) aktuell.textContent = titel[e.target.id];
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main > section").forEach(function (s) { kio.observe(s); });
  }
  document.addEventListener("click", function (e) {
    if (nav && nav.open && !nav.contains(e.target)) nav.open = false;
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav && nav.open) { nav.open = false; nav.querySelector("summary").focus(); }
  });

  /* ---------- Hero: Querschnitt 1990 bis 2050 ---------- */
  function hero() {
    var svg = document.querySelector(".hero .profil");
    if (!svg) return;
    var jahrEl = document.querySelector(".jahr-zahl");
    var phaseEl = document.querySelector(".phase-titel");
    var nEl = document.querySelector(".pf-n");
    var sEl = document.querySelector(".pf-s");
    var pEl = document.querySelector(".pf-p");
    var knoepfe = document.querySelectorAll(".zeitschalter button");
    var phasen = [
      { t: "Vor der Megadürre", n: "331 mm pro Jahr <small>Mittel 1990–2009</small>", s: "weit herab, dick", p: "vor allem im Talboden" },
      { t: "Megadürre", n: "189 mm pro Jahr <small>Mittel 2010–2022</small>", s: "dünner, Grenze höher", p: "neu auch an Hängen" },
      { t: "Ausblick: weiter wie bisher", n: "rund −15 % <small>Projektion 2035–2065</small>", s: "Grenze steigt weiter", p: "Hanglagen aufgegeben" }
    ];
    var letztePhase = -1, letztesJahr = -1;
    function zeige(p) {
      var jahr = Math.round(1990 + 60 * p);
      if (jahr !== letztesJahr) { jahrEl.textContent = jahr; letztesJahr = jahr; }
      var ph = jahr < 2010 ? 0 : jahr <= 2025 ? 1 : 2;
      if (ph !== letztePhase) {
        letztePhase = ph;
        phaseEl.textContent = phasen[ph].t;
        nEl.innerHTML = phasen[ph].n;
        sEl.textContent = phasen[ph].s;
        pEl.textContent = phasen[ph].p;
      }
      var stufe = p < 0.25 ? 0 : p < 0.75 ? 1 : 2;
      knoepfe.forEach(function (b, i) { b.setAttribute("aria-pressed", i === stufe ? "true" : "false"); });
    }

    if (!hasGsap) { zeige(0); return; }
    var g = window.gsap;
    g.registerPlugin(window.ScrollTrigger);

    var snow = svg.querySelector(".pf-snow");
    var y1990 = +snow.dataset.y1990, y2022 = +snow.dataset.y2022, y2050 = +snow.dataset.y2050;
    var hangBaeume = svg.querySelectorAll(".pf-t-slope .pf-tree");
    var zustand = { p: 0 };

    var tl = g.timeline({ paused: true, defaults: { ease: "none" } });
    tl.to(zustand, { p: 1, duration: 1, onUpdate: function () { zeige(zustand.p); } }, 0)
      .fromTo(snow, { attr: { height: y1990 }, opacity: 1 }, { attr: { height: y2022 }, opacity: 0.72, duration: 0.5 }, 0)
      .to(snow, { attr: { height: y2050 }, opacity: 0.55, duration: 0.5 }, 0.5)
      .fromTo(svg.querySelector(".pf-dry"), { opacity: 0 }, { opacity: 0.3, duration: 0.5 }, 0)
      .to(svg.querySelector(".pf-dry"), { opacity: 0.42, duration: 0.5 }, 0.5)
      .fromTo(hangBaeume, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.18, stagger: 0.012 }, 0.18)
      .fromTo(svg.querySelector(".pf-wells"), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.3)
      .fromTo(svg.querySelector(".pf-gw"), { y: 0 }, { y: 26, duration: 0.35 }, 0.32)
      .to(svg.querySelector(".pf-gw"), { y: 46, duration: 0.33 }, 0.67)
      .fromTo(svg.querySelector(".pf-lake"), { scaleX: 1, scaleY: 1 }, { scaleX: 0.55, scaleY: 0.6, duration: 0.3 }, 0.3)
      .to(svg.querySelector(".pf-lake"), { scaleX: 0.38, scaleY: 0.45, duration: 0.35 }, 0.65)
      .fromTo(svg.querySelector(".pf-river"), { scaleX: 1, scaleY: 1 }, { scaleX: 0.5, scaleY: 0.6, duration: 0.3 }, 0.3)
      .to(svg.querySelector(".pf-river"), { scaleX: 0.3, scaleY: 0.45, duration: 0.35 }, 0.65)
      .to(svg.querySelectorAll(".pf-t-slope circle, .pf-t-coast circle"), { fill: "#C49A3C", duration: 0.12, stagger: 0.008 }, 0.8);
    tl.progress(0);
    zeige(0);

    var st = null;
    if (!reduce) {
      st = window.ScrollTrigger.create({
        trigger: ".hero",
        start: function () { return window.innerWidth <= 860 ? "bottom bottom" : "top top"; },
        end: "+=170%",
        pin: true,
        anticipatePin: 1,
        scrub: 0.6,
        animation: tl
      });

      // Auftritt beim Laden: Kammlinie zeichnet sich, Gelände steigt, Bäume wachsen
      var ridge = svg.querySelector(".pf-ridge");
      var len = ridge.getTotalLength();
      g.set(ridge, { strokeDasharray: len, strokeDashoffset: len });
      var auf = g.timeline({ defaults: { ease: "power3.out" } });
      auf.from(".hero-h1 .zeile", { yPercent: 60, opacity: 0, duration: 0.9, stagger: 0.12 })
        .from(".hero .eyebrow, .hero-lead", { opacity: 0, y: 14, duration: 0.7, stagger: 0.08 }, 0.2)
        .to(ridge, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, 0.15)
        .from(svg.querySelector(".pf-land"), { opacity: 0, y: 30, duration: 1.1 }, 0.25)
        .from(svg.querySelector(".pf-snow").parentNode, { opacity: 0, duration: 0.9 }, 0.9)
        .from(svg.querySelectorAll(".pf-t-valley .pf-tree, .pf-t-coast .pf-tree"), { scale: 0, duration: 0.5, stagger: 0.025, ease: "back.out(1.6)" }, 1.1)
        .from(svg.querySelectorAll(".pf-labels, .pf-water, .pf-sea, .pf-wave"), { opacity: 0, duration: 0.6 }, 1.2)
        .from(".zeitanzeige, .zeitschalter, .hero-hinweis", { opacity: 0, y: 10, duration: 0.6 }, 1.3);
    }

    knoepfe.forEach(function (b) {
      b.addEventListener("click", function () {
        var ziel = parseFloat(b.dataset.stufe);
        if (st) {
          window.scrollTo({ top: st.start + (st.end - st.start) * ziel + 2, behavior: "smooth" });
        } else {
          tl.progress(ziel);
          zeige(ziel);
        }
      });
    });

    // Mobil: Ausschnitt auf Tal und Anden
    var mq = window.matchMedia("(max-width: 640px)");
    function ausschnitt() { svg.setAttribute("viewBox", mq.matches ? "300 40 1300 600" : "0 0 1600 640"); }
    ausschnitt();
    if (mq.addEventListener) mq.addEventListener("change", ausschnitt);
  }

  /* ---------- Klimadiagramme nach Walter und Lieth ---------- */
  function klimadiagramme() {
    var box = document.getElementById("kd-reihe");
    if (!box || !VC.klima) return;
    var monate = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    ["santiago", "curico", "chillan"].forEach(function (key) {
      var d = VC.klima[key];
      var fig = document.createElement("figure");
      fig.className = "kd";
      var sumN = d.N.reduce(function (a, b) { return a + b; }, 0);
      var mitT = d.T.reduce(function (a, b) { return a + b; }, 0) / 12;
      var arid = 0;
      d.T.forEach(function (t, i) { if (d.N[i] < 2 * t) arid++; });
      fig.innerHTML = '<div class="kd-kopf"><h4>' + d.name + "</h4><p>" + d.lat + ", " + d.hoehe + " m</p></div>";
      var W = 380, H = 330, L = 40, R = 46, T = 30, B = 52;
      var maxU = 57; // °C-Einheiten: 10 °C = 20 mm, über 100 mm Maßstab 1 : 10
      var py = (H - T - B) / maxU;
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Klimadiagramm " + d.name + ": Jahresmittel " + fmt(mitT, 1) + " Grad, Jahresniederschlag " + fmt(sumN) + " Millimeter, " + arid + " aride Monate." });
      var sp = (W - L - R) / 12;
      var x = function (i) { return L + (i + 0.5) * sp; };
      var yU = function (u) { return T + (maxU - u) * py; };
      var nU = function (n) { return n <= 100 ? n / 2 : 50 + (n - 100) / 20; };
      // Jahreszeiten der Südhalbkugel
      var zeiten = [[5, 7, "Winter"], [0, 1, "Sommer"], [11, 11, ""]];
      zeiten.forEach(function (z) {
        el("rect", { x: x(z[0]) - sp / 2, y: H - 22, width: (z[1] - z[0] + 1) * sp, height: 18, rx: 3, "class": z[2] === "Winter" ? "kd-zeit kd-winter" : "kd-zeit kd-sommer" }, svg);
        if (z[2]) txt(svg, (x(z[0]) + x(z[1])) / 2, H - 9, z[2], "ax kd-zeit-lab", "middle");
      });
      // Gitter und Achsen
      [0, 10, 20, 30].forEach(function (t) {
        el("line", { x1: L, x2: W - R, y1: yU(t), y2: yU(t), "class": "gitter" }, svg);
        txt(svg, L - 6, yU(t) + 4, t, "ax ax-t", "end");
      });
      [20, 40, 60, 80, 100].forEach(function (n) { txt(svg, W - R + 6, yU(n / 2) + 4, n, "ax ax-n"); });
      el("line", { x1: L, x2: W - R, y1: yU(nU(200)), y2: yU(nU(200)), "class": "gitter", "stroke-dasharray": "2 3" }, svg);
      txt(svg, W - R + 6, yU(nU(200)) + 4, 200, "ax ax-n");
      txt(svg, L - 6, 14, "°C", "ax ax-t", "end");
      txt(svg, W - R + 6, 14, "mm", "ax ax-n");
      // Schraffur in gleichmäßigem Abstand
      var g = el("g", null, svg);
      for (var xx = x(0); xx <= x(11) + 0.01; xx += 3.2) {
        var pos = (xx - x(0)) / sp, i = Math.min(10, Math.floor(pos)), f = pos - i;
        var t = d.T[i] + f * (d.T[i + 1] - d.T[i]);
        var n = d.N[i] + f * (d.N[i + 1] - d.N[i]);
        if (n / 2 < t) el("line", { x1: xx, x2: xx, y1: yU(t), y2: yU(n / 2), "class": "kd-h-arid" }, g);
        else el("line", { x1: xx, x2: xx, y1: yU(Math.min(nU(n), 50)), y2: yU(t), "class": "kd-h-humid" }, g);
      }
      // Fläche über 100 mm als geschlossenes Polygon mit exakten Schnittpunkten
      var punkte = [];
      for (var k = 0; k < 12; k++) {
        punkte.push([x(k), d.N[k]]);
        if (k < 11 && (d.N[k] - 100) * (d.N[k + 1] - 100) < 0) {
          var q = (100 - d.N[k]) / (d.N[k + 1] - d.N[k]);
          punkte.push([x(k) + q * sp, 100]);
        }
      }
      var lauf = [];
      function schliesse() {
        if (lauf.length > 1) {
          var dd = "M" + lauf[0][0].toFixed(1) + "," + yU(50).toFixed(1);
          lauf.forEach(function (pt) { dd += " L" + pt[0].toFixed(1) + "," + yU(nU(pt[1])).toFixed(1); });
          dd += " L" + lauf[lauf.length - 1][0].toFixed(1) + "," + yU(50).toFixed(1) + "Z";
          el("path", { d: dd, "class": "kd-cap" }, g);
        }
        lauf = [];
      }
      punkte.forEach(function (pt) { if (pt[1] >= 100) lauf.push(pt); else schliesse(); });
      schliesse();
      var tPfad = "", nPfad = "";
      d.T.forEach(function (t, i) { tPfad += (i ? "L" : "M") + x(i).toFixed(1) + "," + yU(t).toFixed(1); });
      punkte.forEach(function (pt, i) { nPfad += (i ? "L" : "M") + pt[0].toFixed(1) + "," + yU(nU(pt[1])).toFixed(1); });
      el("path", { d: nPfad, "class": "kd-nline" }, svg);
      el("path", { d: tPfad, "class": "kd-tline" }, svg);
      monate.forEach(function (m, i) { txt(svg, x(i), H - 30, m, "ax", "middle"); });
      fig.appendChild(svg);
      var werte = document.createElement("p");
      werte.className = "kd-werte";
      werte.innerHTML = "<span>Jahresmittel <b>" + fmt(mitT, 1) + " °C</b></span><span>Jahressumme <b>" + fmt(sumN) + " mm</b></span><span>arid <b>" + arid + " Monate</b></span>";
      fig.appendChild(werte);
      var cap = document.createElement("figcaption");
      cap.textContent = "Station " + d.station + ", Mittel 1991–2020";
      fig.appendChild(cap);
      box.appendChild(fig);
    });
  }

  /* ---------- Zeitreihe Santiago ---------- */
  function zeitreihe() {
    var box = document.getElementById("zr-chart");
    if (!box || !VC.santiagoJahr) return;
    var daten = Object.keys(VC.santiagoJahr).map(function (k) { return { j: +k, n: VC.santiagoJahr[k] }; });
    var NORM = 286.2;
    var W = 1200, H = 380, L = 46, R = 10, T = 30, B = 34;
    var maxN = 750;
    var bw = (W - L - R) / daten.length;
    var y = function (n) { return T + (1 - n / maxN) * (H - T - B); };
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var i10 = daten.findIndex(function (d) { return d.j === 2010; });
    var i22 = daten.findIndex(function (d) { return d.j === 2022; });
    el("rect", { x: L + i10 * bw, y: T - 18, width: (i22 - i10 + 1) * bw, height: H - T - B + 18, "class": "zr-band" }, svg);
    txt(svg, L + i10 * bw + 6, T - 4, "Megadürre 2010–2022", "zr-anno");
    [0, 200, 400, 600].forEach(function (n) {
      el("line", { x1: L, x2: W - R, y1: y(n), y2: y(n), "class": "gitter" }, svg);
      txt(svg, L - 8, y(n) + 4, n, "ax", "end");
    });
    txt(svg, L - 8, T - 4, "mm", "ax", "end");
    var g = el("g", null, svg);
    var balken = [];
    daten.forEach(function (d, i) {
      var cls = "zr-bar" + (d.j >= 2010 && d.j <= 2022 ? " md" : "");
      var r = el("rect", { x: (L + i * bw + 1.5).toFixed(1), y: y(d.n).toFixed(1), width: (bw - 3).toFixed(1), height: (y(0) - y(d.n)).toFixed(1), "class": cls, "data-i": i }, g);
      balken.push(r);
      if (d.j % 5 === 0) txt(svg, L + i * bw + bw / 2, H - 12, d.j, "ax", "middle");
    });
    el("line", { x1: L, x2: W - R, y1: y(NORM), y2: y(NORM), "class": "zr-norm" }, svg);
    txt(svg, W - R, y(NORM) - 7, "Normalwert 1991–2020: 286 mm", "zr-anno zr-anno-k", "end");
    var i19 = daten.findIndex(function (d) { return d.j === 2019; });
    txt(svg, L + i19 * bw + bw / 2, y(82) - 8, "82", "zr-anno", "middle");
    var i87 = daten.findIndex(function (d) { return d.j === 1987; });
    txt(svg, L + i87 * bw + bw / 2, y(712.1) - 8, "712", "zr-anno", "middle");
    box.appendChild(svg);

    var tip = document.createElement("div");
    tip.className = "zr-tip";
    box.appendChild(tip);
    var aktiv = null;
    function zeigeTip(i) {
      if (aktiv) aktiv.classList.remove("aktiv");
      var d = daten[i];
      aktiv = balken[i];
      aktiv.classList.add("aktiv");
      var abw = Math.round((d.n / NORM - 1) * 100);
      tip.textContent = d.j + ": " + fmt(d.n, 1) + " mm (" + (abw > 0 ? "+" : "") + abw + " %)";
      var rb = box.getBoundingClientRect();
      var bb = aktiv.getBoundingClientRect();
      var links = bb.left - rb.left + bb.width / 2;
      links = Math.max(70, Math.min(rb.width - 70, links));
      tip.style.left = links + "px";
      tip.style.top = (bb.top - rb.top) + "px";
      tip.classList.add("an");
    }
    function versteck() { tip.classList.remove("an"); if (aktiv) aktiv.classList.remove("aktiv"); aktiv = null; }
    svg.addEventListener("pointermove", function (e) {
      var pt = svg.getBoundingClientRect();
      var xv = (e.clientX - pt.left) / pt.width * W;
      var i = Math.floor((xv - L) / bw);
      if (i >= 0 && i < daten.length) zeigeTip(i); else versteck();
    });
    svg.addEventListener("pointerleave", versteck);

    if (hasGsap && !reduce) {
      window.gsap.set(balken, { scaleY: 0, transformOrigin: "50% 100%" });
      beimSichtbarwerden(box, function () {
        window.gsap.to(balken, { scaleY: 1, duration: 0.6, ease: "power3.out", stagger: 0.014 });
      }, 0.3);
    }
  }

  /* ---------- Klimadaten, didaktischer Datensatz ---------- */
  function heftChart() {
    var box = document.getElementById("heft-klima");
    if (!box) return;
    var J = [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];
    var Tt = [17.2, 17.4, 17.7, 18.0, 18.1, 18.5, 18.8, 19.1];
    var Nn = [510, 498, 486, 472, 461, 448, 432, 421];
    var W = 520, H = 320, L = 44, R = 50, T = 20, B = 34;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
    var x = function (i) { return L + i * (W - L - R) / 7; };
    var yT = function (t) { return T + (19.5 - t) / 2.7 * (H - T - B); };
    var yN = function (n) { return T + (530 - n) / 130 * (H - T - B); };
    [17, 18, 19].forEach(function (t) {
      el("line", { x1: L, x2: W - R, y1: yT(t), y2: yT(t), "class": "gitter" }, svg);
      txt(svg, L - 6, yT(t) + 4, t + "°", "ax ax-t", "end");
    });
    [420, 460, 500].forEach(function (n) { txt(svg, W - R + 6, yN(n) + 4, n, "ax ax-n"); });
    txt(svg, W - R + 6, T - 4, "mm", "ax ax-n");
    J.forEach(function (j, i) { txt(svg, x(i), H - 10, j, "ax", "middle"); });
    var pt = "", pn = "";
    J.forEach(function (j, i) { pt += (i ? "L" : "M") + x(i) + "," + yT(Tt[i]); pn += (i ? "L" : "M") + x(i) + "," + yN(Nn[i]); });
    var lN = el("path", { d: pn, "class": "kd-nline", "stroke-width": 2.4 }, svg);
    var lT = el("path", { d: pt, "class": "kd-tline" }, svg);
    J.forEach(function (j, i) {
      el("circle", { cx: x(i), cy: yT(Tt[i]), r: 3.5, fill: "#A8132D" }, svg);
      el("circle", { cx: x(i), cy: yN(Nn[i]), r: 3.5, fill: "#2F6F8A" }, svg);
    });
    txt(svg, x(7) - 4, yT(19.1) - 10, "19,1 °C", "zr-anno zr-anno-k", "end");
    txt(svg, x(0) + 4, yT(17.2) + 18, "17,2 °C", "zr-anno zr-anno-k");
    txt(svg, x(0) + 4, yN(510) - 10, "510 mm", "zr-anno");
    txt(svg, x(7) - 4, yN(421) + 18, "421 mm", "zr-anno", "end");
    box.appendChild(svg);
  }

  /* ---------- Kirschen ---------- */
  function kirschen() {
    var a = document.getElementById("kirsch-flaeche");
    if (a) {
      var W = 460, H = 220;
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H });
      var max = 80000, base = 180;
      var bars = [{ l: "2015", v: 25000, t: "25 000" }, { l: "2025", v: 77000, t: "über 77 000" }];
      var nodes = [];
      bars.forEach(function (b, i) {
        var h = b.v / max * 150;
        var xx = 40 + i * 210;
        nodes.push(el("rect", { x: xx, y: base - h, width: 150, height: h, "class": i ? "mc-bar" : "mc-bar mc-bar-alt" }, svg));
        txt(svg, xx, base - h - 10, b.t, "mc-val");
        txt(svg, xx, base + 22, b.l, "mc-lab");
      });
      txt(svg, 205, 70, "× 3", "mc-val", "middle");
      a.appendChild(svg);
    }
    var b = document.getElementById("kirsch-export");
    if (b) {
      var W2 = 460, H2 = 256;
      var s2 = el("svg", { viewBox: "0 0 " + W2 + " " + H2 });
      var base2 = 190;
      var ex = [{ l: "2023/24", v: 413979, t: "413 979 t", p: 30 }, { l: "2024/25", v: 626013, t: "626 013 t", p: 19.5 }];
      var n2 = [];
      ex.forEach(function (e, i) {
        var h = e.v / 700000 * 150;
        var xx = 40 + i * 210;
        n2.push(el("rect", { x: xx, y: base2 - h, width: 150, height: h, "class": i ? "mc-bar" : "mc-bar mc-bar-alt" }, s2));
        txt(s2, xx, base2 - h - 10, e.t, "mc-val");
        txt(s2, xx, base2 + 22, e.l, "mc-lab");
      });
      txt(s2, 40, base2 + 50, "Preis ≈ 30 US$ je Kiste", "mc-preislab");
      txt(s2, 250, base2 + 50, "Preis < 20 US$ je Kiste", "mc-preislab mc-preis-tief");
      b.appendChild(s2);
    }
  }

  /* ---------- Bildvergleich Aculeo ---------- */
  function vergleich() {
    document.querySelectorAll("[data-vergleich]").forEach(function (v) {
      var input = v.querySelector(".vg-input");
      var pos = 0.5, rect = null, startX = 0, startY = 0, zieht = false, entschieden = false, pid = null, frame = 0, ziel = pos;
      function setze(p) {
        pos = Math.min(1, Math.max(0, p));
        v.style.setProperty("--pos", pos.toFixed(4));
        input.value = Math.round(pos * 100);
      }
      function breite() { v.style.setProperty("--vg-w", v.clientWidth + "px"); }
      breite();
      if ("ResizeObserver" in window) new ResizeObserver(breite).observe(v);
      else window.addEventListener("resize", breite);
      function plane(p) {
        ziel = p;
        if (!frame) frame = requestAnimationFrame(function () { frame = 0; setze(ziel); });
      }
      function ausX(clientX) { return (clientX - rect.left) / rect.width; }
      v.addEventListener("pointerdown", function (e) {
        if (pid !== null) return; // weitere Finger ignorieren
        if (e.pointerType === "mouse" && e.button !== 0) return;
        pid = e.pointerId;
        rect = v.getBoundingClientRect(); // einmal pro Zug messen
        startX = e.clientX; startY = e.clientY;
        zieht = false;
        entschieden = e.pointerType === "mouse" || e.pointerType === "pen";
        if (entschieden) {
          zieht = true;
          v.setPointerCapture(pid);
          plane(ausX(e.clientX));
          e.preventDefault();
        }
      });
      v.addEventListener("pointermove", function (e) {
        if (e.pointerId !== pid) return;
        if (!entschieden) {
          var dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
          if (dx > 6 && dx > dy) {
            entschieden = true; zieht = true;
            try { v.setPointerCapture(pid); } catch (err) {}
          } else if (dy > 6 && dy >= dx) {
            entschieden = true; zieht = false; // senkrecht: Seite scrollt
            return;
          } else return;
        }
        if (zieht) plane(ausX(e.clientX));
      });
      function ende(e) {
        if (e.pointerId !== pid) return;
        if (!entschieden && e.type === "pointerup") plane(ausX(e.clientX)); // kurzes Antippen springt
        pid = null; zieht = false; entschieden = false;
      }
      v.addEventListener("pointerup", ende);
      v.addEventListener("pointercancel", ende);
      input.addEventListener("input", function () { setze(input.value / 100); });
      v.addEventListener("keydown", function (e) {
        if (document.activeElement === input) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") { input.focus(); }
      });
      setze(0.5);
    });
  }

  /* ---------- Wirkungsgefüge ---------- */
  function wirkungsgefuege() {
    var svg = document.getElementById("wg");
    if (!svg) return;
    var knoten = [
      { id: "k1", l: "Globaler|Klimawandel", t: "klima", x: 115, y: 70, i: "Mehr Treibhausgase erwärmen die Erde. In der Südhemisphäre verstärkt das zusammen mit dem Ozonloch den Ringmodus (SAM): Die Westwinde verlagern sich nach Süden (Garreaud u. a. 2020)." },
      { id: "k2", l: "Stärkeres Pazifikhoch,|Westwinde weiter südlich", t: "klima", x: 130, y: 210, i: "In den Dürrejahren lag ein kräftiges Hochdruckgebiet über dem subtropischen Pazifik. Regenbringende Fronten zogen südlich an Zentralchile vorbei (Garreaud u. a. 2020)." },
      { id: "k4", l: "Höhere|Temperaturen", t: "klima", x: 380, y: 60, i: "Santiago wurde zwischen den Normalperioden 1981–2010 und 1991–2020 um 0,5 K wärmer. Für 2035–2065 erwartet der Atlas ARClim 1,15 bis 2 °C mehr als 1980–2010 (MMA 2022)." },
      { id: "k3", l: "Weniger|Winterniederschlag", t: "klima", x: 380, y: 190, i: "2010 bis 2022 fielen in Santiago im Mittel 189 mm statt 286 mm. Etwa ein Viertel des Defizits wird dem menschengemachten Klimawandel zugeschrieben (Boisier u. a. 2016)." },
      { id: "k5", l: "Schneegrenze steigt,|weniger Schnee", t: "klima", x: 630, y: 110, i: "Die Nullgradgrenze stieg 1975 bis 2001 um rund 120 bis 200 m. Mehr Niederschlag fällt als Regen und fließt schneller ab, statt bis zum Sommer als Schnee gespeichert zu werden (Carrasco u. a. 2005)." },
      { id: "k6", l: "Gletscher|schrumpfen", t: "klima", x: 880, y: 45, i: "Gletscher puffern trockene Sommer. Sie schrumpfen schnell. Kurzfristig liefern sie mehr Schmelzwasser, langfristig fällt dieser Puffer weg (McCarthy u. a. 2022)." },
      { id: "k7", l: "Weniger Abfluss|im Sommer", t: "klima", x: 880, y: 170, i: "Weniger Schnee bedeutet weniger Schmelzwasser genau in der Bewässerungszeit. Flüsse und Stauseen sanken in der Megadürre teils um bis zu 90 % (Garreaud u. a. 2017)." },
      { id: "k8", l: "Mehr Verdunstung,|höherer Wasserbedarf", t: "klima", x: 630, y: 245, i: "Wärmere Luft verdunstet mehr Wasser. Pflanzen brauchen mehr Bewässerung, um denselben Ertrag zu bringen (Material M2: Bedarf steigt auf 133 %)." },
      { id: "k9", l: "Weniger Grundwasser-|neubildung", t: "klima", x: 540, y: 360, i: "Weniger Regen und weniger Versickerung aus Kanälen und Feldern füllen die Grundwasserleiter langsamer auf. An der Laguna de Aculeo sank die Neubildung um 24 % (Barría u. a. 2021)." },
      { id: "m1", l: "Nachfrage Weltmarkt|(vor allem China)", t: "mensch", x: 130, y: 470, i: "In China sind Kirschen ein beliebtes Geschenk zum Neujahrsfest. 2024/25 gingen 91 % der chilenischen Kirschexporte nach China." },
      { id: "m5", l: "Handelbare, überzeichnete|Wasserrechte", t: "mensch", x: 140, y: 640, i: "Seit 1981 sind Wasserrechte vom Land getrennt und handelbar. Am Río Ligua übersteigen die vergebenen Rechte das Wasserangebot nach einer Studie der Fundación Chile um 29 % (Wehr 2018)." },
      { id: "m2", l: "Ausweitung Exportobstbau,|auch an Hängen", t: "mensch", x: 390, y: 470, i: "Die Kirschfläche wuchs von 25 000 ha (2015) auf über 77 000 ha (2025). Neue Anlagen entstehen auch an Hängen (Ovalle 2026, Wehr 2018)." },
      { id: "m3", l: "Tropfbewässerung", t: "mensch", x: 510, y: 615, i: "Spart Wasser pro Hektar. Ohne Obergrenze wird das gesparte Wasser aber oft für neue Flächen genutzt, und weniger Wasser versickert ins Grundwasser (Grafton u. a. 2018)." },
      { id: "m4", l: "Mehr und tiefere|Brunnen", t: "mensch", x: 690, y: 500, i: "Wenn Flüsse weniger führen, pumpen Betriebe mehr Grundwasser. Wer es sich leisten kann, bohrt tiefer." },
      { id: "f1", l: "Grundwasserspiegel|sinkt", t: "folge", x: 880, y: 400, i: "In Ligua und Petorca fiel der Grundwasserspiegel in 75 % der Messbrunnen deutlich (Duran-Llacer u. a. 2020)." },
      { id: "f2", l: "Flüsse und Lagunen|trocknen aus", t: "folge", x: 1090, y: 260, i: "Der Río Petorca führt auf weiten Strecken kein Wasser mehr. Die Laguna de Aculeo war von 2018 bis 2023 vollständig trocken." },
      { id: "f3", l: "Trinkwassermangel|auf dem Land", t: "folge", x: 1090, y: 420, i: "2022 galt in 188 Gemeinden ein Dekret wegen Wasserknappheit. Viele Dörfer werden mit Tankwagen versorgt." },
      { id: "f5", l: "Kleinbetriebe|geben auf", t: "folge", x: 880, y: 560, i: "Wer keine tiefen Brunnen und keine Tropftechnik bezahlen kann, verkauft Land oder Wasserrechte. Das begünstigt die Konzentration auf große Betriebe." },
      { id: "f6", l: "Preis- und|Ertragsrisiko", t: "folge", x: 420, y: 740, i: "2024/25 stieg die Kirschexportmenge um die Hälfte, der Preis fiel um ein Drittel. Monokultur und ein Hauptmarkt machen die Region verwundbar." },
      { id: "f4", l: "Konflikte|um Wasser", t: "folge", x: 1090, y: 580, i: "Dorfgemeinschaften, Kleinbauern, Agrarunternehmen und Städte streiten um knappes Wasser. Petorca wurde zum landesweiten Symbol." },
      { id: "s1", l: "Reform Wasserrecht|2022", t: "steuer", x: 1090, y: 710, i: "Ley 21.435: Trinkwasser und Sanitärversorgung haben Vorrang, neue Rechte gelten höchstens 30 Jahre. Eine abschwächende Rückkopplung auf die Konflikte." }
    ];
    var kanten = [
      ["k1", "k2", "+", "klima"], ["k1", "k4", "+", "klima"], ["k2", "k3", "+", "klima"],
      ["k3", "k5", "+", "klima"], ["k4", "k5", "+", "klima"], ["k4", "k6", "+", "klima"], ["k4", "k8", "+", "klima"],
      ["k3", "k9", "+", "klima"], ["k5", "k7", "+", "klima"], ["k6", "k7", "+", "klima"],
      ["k7", "f2", "+", "klima"], ["k9", "f1", "+", "klima"], ["k7", "m4", "+", "mensch"], ["k8", "m4", "+", "mensch"],
      ["m1", "m2", "+", "mensch"], ["m5", "m2", "+", "mensch"], ["m5", "m4", "+", "mensch loop"],
      ["m2", "m4", "+", "mensch loop"], ["m3", "m2", "+", "mensch loop"], ["m3", "k9", "+", "mensch"],
      ["m4", "f1", "+", "mensch loop"], ["f1", "m4", "+", "mensch loop"],
      ["f1", "f2", "+", "mensch"], ["f1", "f3", "+", "mensch loop"], ["f1", "f5", "+", "mensch"],
      ["f2", "f4", "+", "mensch"], ["f3", "f4", "+", "mensch loop"], ["f4", "s1", "+", "mensch loop"],
      ["s1", "m5", "−", "mensch loop", -110], ["s1", "f3", "−", "mensch loop", 90],
      ["m1", "f6", "+", "mensch"], ["m2", "f6", "+", "mensch"], ["f6", "f5", "+", "mensch"]
    ];
    var byId = {};
    var gK = el("g", null, svg), gZ = el("g", null, svg), gN = el("g", null, svg);
    el("defs", null, svg).innerHTML =
      '<marker id="pfeil" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#7C8887"/></marker>';
    // Spaltenköpfe
    [["URSACHEN", 130], ["NATURWIRKUNG", 505], ["VERSTÄRKUNG UND FOLGEN", 880]].forEach(function (k) { txt(svg, k[1], 16, k[0], "ax", "middle"); });

    knoten.forEach(function (k) {
      var g = el("g", { "class": "wg-knoten t-" + k.t, tabindex: 0, role: "button", "aria-pressed": "false" }, gN);
      var zeilen = k.l.split("|");
      var w = Math.max.apply(null, zeilen.map(function (z) { return z.length; })) * 8.6 + 32;
      var h = zeilen.length * 21 + 18;
      el("rect", { x: k.x - w / 2, y: k.y - h / 2, width: w, height: h, rx: 8 }, g);
      zeilen.forEach(function (z, i) {
        txt(g, k.x, k.y - (zeilen.length - 1) * 10.5 + i * 21 + 6, z, "", "middle");
      });
      g.setAttribute("aria-label", zeilen.join(" "));
      k.w = w; k.h = h; k.g = g;
      byId[k.id] = k;
    });
    function rand(a, b) {
      // Schnittpunkt der Linie Mitte a -> Mitte b mit dem Rechteck a
      var dx = b.x - a.x, dy = b.y - a.y;
      var sx = (a.w / 2 + 4) / Math.abs(dx || 1e-6), sy = (a.h / 2 + 4) / Math.abs(dy || 1e-6);
      var s = Math.min(sx, sy);
      return { x: a.x + dx * s, y: a.y + dy * s };
    }
    kanten.forEach(function (k, idx) {
      var a = byId[k[0]], b = byId[k[1]];
      var p1 = rand(a, b), p2 = rand(b, a);
      var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      var gegen = kanten.some(function (o) { return o[0] === k[1] && o[1] === k[0]; });
      var bog = k[4] !== undefined ? k[4] : gegen ? 34 : 14;
      var nx = -(p2.y - p1.y), ny = p2.x - p1.x, nl = Math.hypot(nx, ny) || 1;
      var cx = mx + nx / nl * bog, cy = my + ny / nl * bog;
      var cls = "wg-kante " + (k[2] === "−" ? "neg " : "") + k[3];
      var p = el("path", { d: "M" + p1.x.toFixed(1) + "," + p1.y.toFixed(1) + " Q" + cx.toFixed(1) + "," + cy.toFixed(1) + " " + p2.x.toFixed(1) + "," + p2.y.toFixed(1), "class": cls, "marker-end": "url(#pfeil)" }, gK);
      var zx = 0.25 * p1.x + 0.5 * cx + 0.25 * p2.x, zy = 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y;
      var z = txt(gZ, zx, zy + 4, k[2], "wg-zeichen " + k[3], "middle");
      k.p = p; k.z = z; k.idx = idx;
    });

    var info = document.querySelector(".wg-info");
    var iTitel = info.querySelector(".wg-info-titel"), iText = info.querySelector(".wg-info-text");
    var iU = info.querySelector(".wg-ursachen"), iF = info.querySelector(".wg-folgen");
    var gewaehlt = null, filter = "alle";
    function name(k) { return byId[k].l.replace(/\|/g, " ").replace(/- /g, ""); }
    function zuruecksetzen() {
      svg.querySelectorAll(".an, .gewaehlt, .ein, .aus").forEach(function (n) { n.classList.remove("an", "gewaehlt", "ein", "aus"); });
    }
    function anwenden() {
      zuruecksetzen();
      svg.classList.toggle("hat-wahl", !!gewaehlt);
      svg.classList.toggle("hat-filter", !gewaehlt && filter !== "alle");
      info.classList.toggle("hat-knoten", !!gewaehlt);
      knoten.forEach(function (k) { k.g.setAttribute("aria-pressed", gewaehlt === k.id ? "true" : "false"); });
      if (gewaehlt) {
        var k = byId[gewaehlt];
        k.g.classList.add("gewaehlt", "an");
        iTitel.textContent = name(gewaehlt);
        iText.textContent = k.i;
        iU.innerHTML = ""; iF.innerHTML = "";
        kanten.forEach(function (e) {
          if (e[1] === gewaehlt) {
            e.p.classList.add("an", "ein"); e.z.classList.add("an"); byId[e[0]].g.classList.add("an");
            var li = document.createElement("li"); li.textContent = name(e[0]) + " (" + e[2] + ")"; iU.appendChild(li);
          }
          if (e[0] === gewaehlt) {
            e.p.classList.add("an", "aus"); e.z.classList.add("an"); byId[e[1]].g.classList.add("an");
            var lf = document.createElement("li"); lf.textContent = name(e[1]) + " (" + e[2] + ")"; iF.appendChild(lf);
          }
        });
      } else if (filter !== "alle") {
        kanten.forEach(function (e) {
          if (e[3].split(" ").indexOf(filter) > -1) {
            e.p.classList.add("an"); e.z.classList.add("an");
            byId[e[0]].g.classList.add("an"); byId[e[1]].g.classList.add("an");
          }
        });
        var texte = {
          klima: ["Klimawirkung", "Die ockerfarbenen Elemente zeigen die natürliche Kette vom globalen Klimawandel bis zum geringeren Sommerabfluss."],
          mensch: ["Menschliche Verstärkung", "Weltmarkt, Wasserrecht und Ausweitung des Obstbaus verstärken die Klimafolgen über das Grundwasser."],
          loop: ["Rückkopplungen", "Zwei verstärkende Schleifen (Brunnenspirale, Effizienz-Paradox) und eine abschwächende (Konflikt führt zur Reform des Wasserrechts)."]
        };
        iTitel.textContent = texte[filter][0];
        iText.textContent = texte[filter][1];
        iU.innerHTML = ""; iF.innerHTML = "";
      } else {
        iTitel.textContent = "Nichts ausgewählt";
        iText.textContent = "Wählen Sie ein Element im Schaubild. Pfeile mit „+“ verstärken, Pfeile mit „−“ schwächen ab.";
        iU.innerHTML = ""; iF.innerHTML = "";
      }
    }
    knoten.forEach(function (k) {
      function waehle() { gewaehlt = gewaehlt === k.id ? null : k.id; anwenden(); }
      k.g.addEventListener("click", waehle);
      k.g.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); waehle(); }
        if (e.key === "Escape") { gewaehlt = null; anwenden(); }
      });
    });
    document.querySelectorAll(".wg-filter").forEach(function (b) {
      b.addEventListener("click", function () {
        filter = b.dataset.filter; gewaehlt = null;
        document.querySelectorAll(".wg-filter").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        anwenden();
      });
    });
    anwenden();
  }

  /* ---------- Strategienmatrix ---------- */
  function matrix() {
    var body = document.getElementById("matrix-body");
    if (!body) return;
    var S = [
      { n: "Tröpfchenbewässerung", r: [1, -1, 0, 0, 0], b: "Spart auf dem Feld deutlich Wasser gegenüber Furchenbewässerung, weil weniger verdunstet und abfließt. Investition hoch. Ökologisch zweischneidig: weniger Auswaschung, aber sie ermöglicht Plantagen an Hängen. Risiko: Effizienz-Paradox, weniger Versickerung ins Grundwasser.", e: "In O’Higgins 82 % der Obstfläche (2021) <a class=\"zit\" href=\"#q-odepa2022\">Muñoz 2022</a>. Das Bewässerungsgesetz 18.450 bezuschusst Kleinbauern mit bis zu 90 %." },
      { n: "Angepasste Sorten", r: [1, 0, 0, 0, 1], b: "Trockenheits- und hitzetolerantere Unterlagen und Sorten senken den Wasserbedarf. Bei Kirschen werden Sorten mit geringerem Kältebedarf wichtig, weil die Winter wärmer werden. Nachteil: Dauerkulturen brauchen Jahre bis zum Ertrag.", e: "Sortenwechsel im Kirschenanbau; Forschung an Unterlagen für Kirsche, Avocado und Wein." },
      { n: "Anbaukalender verändern", r: [0, 1, 0, 0, 0], b: "Bei Dauerkulturen wie Kirsche oder Avocado kaum möglich. Bei einjährigen Kulturen wie Gemüse oder Mais kann frühere Aussaat die Winterfeuchte nutzen. Für das Obstbau-System nur geringe Wirkung.", e: "Gemüsebau im Valle Central, Saatzeitpunkte nach Winterregen." },
      { n: "Mulchen und Bodenbedeckung", r: [1, 2, 2, 1, 1], b: "Begrünung zwischen den Baumreihen und Mulch aus Schnittholz senken die Verdunstung, schützen Hänge vor Erosion und fördern das Bodenleben. Günstig und schnell umsetzbar. Die Begrünung selbst darf nicht zu viel Wasser verbrauchen.", e: "Gehäckseltes Schnittholz als Mulch, Winterbegrünung in Obstanlagen und Weinbergen." },
      { n: "Agroforst", r: [0, 0, 2, 1, 0], b: "Hecken aus heimischen Hartlaubarten wie Quillay, Litre oder Peumo bieten Windschutz und Lebensraum. In dichten Exportplantagen nur am Rand möglich, Konkurrenz um Wasser und Licht.", e: "Biologische Korridore zwischen Plantagen, Schutz von Restflächen des Matorral." },
      { n: "Abwasserwiederverwendung", r: [1, 0, 1, 0, 0], b: "Santiago klärt praktisch sein gesamtes Abwasser. Das gereinigte Wasser fließt aber heute schon in Mapocho und Maipo zurück und wird flussabwärts zur Bewässerung genutzt. Wer es anderswo einsetzt, nimmt es diesen Nutzern weg. Für Frischobst muss die Hygiene gesichert sein.", e: "Biofactoría La Farfana von Aguas Andinas in Santiago <a class=\"zit\" href=\"#q-aguasandinas\">Infraestructura Pública</a>." },
      { n: "Entsalzung", r: [1, -2, -1, 0, -1], b: "Unbegrenzt Wasser aus dem Meer, aber für das Valle Central kaum geeignet: Das Wasser müsste über 100 km weit und auf 500 m Höhe gepumpt werden. Hoher Energiebedarf, Salzlake belastet die Küste. Sinnvoll für Küstenstädte und Bergbau, die dann Flusswasser freigeben.", e: "Entsalzungsanlagen vor allem im Norden Chiles für Bergbau und Städte." },
      { n: "Grundwassermanagement", r: [2, 1, 2, 1, 2], b: "Entnahme messen und an die Neubildung koppeln, Grundwassergemeinschaften stärken, ungenutztes Winterwasser gezielt versickern lassen. Greift an der Ursache, ist vergleichsweise günstig und senkt das Risiko für alle Nutzer.", e: "Erstes Pilotprojekt zur künstlichen Grundwasseranreicherung im Einzugsgebiet des Río Ligua <a class=\"zit\" href=\"#q-recarga\">Portal Frutícola</a>." },
      { n: "Diversifizierung", r: [0, 0, 1, 1, 2], b: "Weniger Abhängigkeit von einer Kultur und einem Markt: neue Absatzmärkte, andere Kulturen, Verarbeitung, Weintourismus. Senkt das Preis- und Ertragsrisiko deutlich. Spart nur dann Wasser, wenn weniger wasserintensive Kulturen gewählt werden.", e: "Der China-Anteil der Kirschexporte sank 2025/26 von 91 auf 87 % <a class=\"zit\" href=\"#q-freshplaza2026\">FreshPlaza 2026</a>." },
      { n: "Präzisionslandwirtschaft", r: [1, -1, 1, -1, 1], b: "Bodenfeuchtesensoren, Satellitendaten und Verdunstungsmodelle steuern die Bewässerung nach dem tatsächlichen Bedarf. Teuer und wissensintensiv, Kleinbetriebe werden benachteiligt. Gleiches Effizienz-Paradox wie bei der Tropfbewässerung.", e: "Sensorgestützte Bewässerung in großen Exportbetrieben." },
      { n: "Wasserrecht reformieren", x: true, r: [2, 1, 1, 2, 1], b: "Die Reform 2022 stellt Trinkwasser an erste Stelle und befristet neue Rechte auf höchstens 30 Jahre. Sie wirkt langsam, weil alte Rechte weitgehend bestehen bleiben, ist aber die Voraussetzung dafür, dass Obergrenzen überhaupt durchsetzbar sind.", e: "Ley 21.435 vom 6. April 2022 <a class=\"zit\" href=\"#q-ley21435\">Ley 21.435</a>." },
      { n: "Speicher: Stauseen", x: true, r: [1, -1, -1, 0, 1], b: "Speichern Winterwasser für den Sommer und ersetzen damit ein Stück weit den Schnee. Teuer, greifen in Flussökosysteme ein und füllen sich nur in nassen Jahren.", e: "Geplanter Embalse La Punilla am Río Ñuble: 540 Mio. m³ für über 66 000 ha, Kosten rund 428 Mio. US-Dollar, Bau stand 2025 noch aus <a class=\"zit\" href=\"#q-punilla\">Infraestructura Pública 2025</a>." }
    ];
    var kl = { "2": "r2", "1": "r1", "0": "r0", "-1": "rm1", "-2": "rm2" };
    var wort = { "2": "sehr günstig", "1": "günstig", "0": "neutral", "-1": "ungünstig", "-2": "sehr ungünstig" };
    S.forEach(function (s, i) {
      var tr = document.createElement("tr");
      tr.className = "m-zeile";
      var sum = s.r.reduce(function (a, b) { return a + b; }, 0);
      var id = "m-d-" + i;
      tr.innerHTML = '<th scope="row" class="m-name"><button type="button" aria-expanded="false" aria-controls="' + id + '"><svg class="m-pfeil" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2 L8 6 L4 10"/></svg>' + s.n + (s.x ? ' <span class="m-extra">zusätzlich</span>' : "") + "</button></th>" +
        s.r.map(function (r) { return '<td><span class="r ' + kl[r] + '" role="img" aria-label="' + wort[r] + '"></span></td>'; }).join("") +
        '<td class="m-sum">' + (sum > 0 ? "+" : "") + sum + "</td>";
      var det = document.createElement("tr");
      det.className = "m-detail";
      det.id = id;
      det.hidden = true;
      det.innerHTML = '<td colspan="7"><div class="m-detail-inhalt"><div><h5>Begründung</h5><p>' + s.b + "</p></div><div><h5>Beispiel Chile</h5><p>" + s.e + "</p></div></div></td>";
      body.appendChild(tr);
      body.appendChild(det);
      var btn = tr.querySelector("button");
      function umschalten() {
        var offen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", offen ? "false" : "true");
        det.hidden = offen;
      }
      tr.addEventListener("click", function (e) { if (e.target.closest("button") !== btn) umschalten(); });
      btn.addEventListener("click", umschalten);
    });
  }

  /* ---------- Szenario 2050 ---------- */
  function szenario() {
    var panel = document.getElementById("szen-panel");
    var tab = document.getElementById("szen-tabelle");
    if (!panel || !tab) return;
    var D = [
      ["Klima", "1,15 bis 2 °C wärmer, rund 15 % weniger Niederschlag, Dürren 10 bis 23 % häufiger. In beiden Szenarien gleich.", "1,15 bis 2 °C wärmer, rund 15 % weniger Niederschlag, Dürren 10 bis 23 % häufiger. In beiden Szenarien gleich."],
      ["Wasser", "Schneegrenze höher, Sommerabfluss deutlich geringer, das Grundwasser sinkt weiter, weitere Lagunen fallen trocken.", "Entnahme an die Neubildung gekoppelt, Winterwasser wird gespeichert und versickert, das Grundwasser stabilisiert sich auf niedrigerem Niveau."],
      ["Böden", "Erosion an aufgegebenen, gerodeten Hängen, Humusverlust auf intensiv genutzten Flächen.", "Dauerbegrünung und Mulch, mehr Humus, weniger Erosion. Steile Hänge werden der Hartlaubvegetation zurückgegeben."],
      ["Anbauprodukte", "Kirsche und Avocado dominieren weiter, an trockenen Standorten werden ganze Plantagen aufgegeben.", "Breiteres Spektrum, wasserintensive Kulturen nach Süden verlagert, trockenheitstolerante Unterlagen."],
      ["Bewässerung", "Fast vollständig Tropfbewässerung, aber auf mehr Fläche. Der Gesamtverbrauch steigt.", "Tropf und Sensorik mit Obergrenze pro Einzugsgebiet. Gespartes Wasser bleibt im Fluss und im Grundwasser."],
      ["Betriebe", "Konzentration auf große Agrarunternehmen, Kleinbauern verkaufen Land und Rechte.", "Kleinbetriebe über Zuschüsse und Genossenschaften technisch angebunden, weniger Höfe geben auf."],
      ["Vermarktung", "Abhängig von China, starke Preisschwankungen, Masse statt Qualität.", "Mehrere Märkte in Asien, Nordamerika und Europa, Qualitätsstrategie, mehr Verarbeitung im Land."],
      ["Konflikte", "Mehr Streit um Trinkwasser, Tankwagenversorgung wird zum Dauerzustand.", "Trinkwasser hat Vorrang, Verteilungskonflikte werden in Wasserräten pro Einzugsgebiet verhandelt."],
      ["Anpassung", "Reaktiv: Notmaßnahmen erst im Dürrejahr.", "Vorausschauend: Dürrepläne, Messnetze und feste Regeln für trockene Jahre."]
    ];
    var ps = [];
    D.forEach(function (d) {
      var c = document.createElement("div");
      c.className = "szen-zelle";
      c.innerHTML = "<h4>" + d[0] + "</h4><p>" + d[1] + "</p>";
      tab.appendChild(c);
      ps.push({ p: c.querySelector("p"), d: d });
    });
    var tabs = document.querySelectorAll(".szen-schalter button");
    function setze(w, fokus) {
      panel.dataset.aktiv = w;
      tabs.forEach(function (t) {
        var an = t.dataset.szen === w;
        t.setAttribute("aria-selected", an ? "true" : "false");
        t.tabIndex = an ? 0 : -1;
        if (an) { panel.setAttribute("aria-labelledby", t.id); if (fokus) t.focus(); }
      });
      ps.forEach(function (o) { o.p.textContent = w === "trend" ? o.d[1] : o.d[2]; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { setze(t.dataset.szen); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          var n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
          setze(n.dataset.szen, true);
        }
      });
    });
    setze("trend");
  }

  /* ---------- Karte, Kette, Kalender, Auftritte ---------- */
  function auftritte() {
    var karte = document.querySelector(".karte");
    if (karte) {
      karte.querySelectorAll(".k-riv").forEach(function (p) {
        var l = Math.ceil(p.getTotalLength());
        p.style.setProperty("--len", l);
      });
      beimSichtbarwerden(karte, function () { karte.classList.add("sichtbar"); }, 0.15);
      var wrap = karte.parentNode;
      if (wrap.scrollWidth > wrap.clientWidth) wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) * 0.6;
    }
    document.querySelectorAll(".kette-liste li").forEach(function (li, i) { li.style.setProperty("--i", i); });
    document.querySelectorAll(".kal .b").forEach(function (b, i) { b.style.setProperty("--i", i); });
    [".kette-liste", ".kal"].forEach(function (sel) {
      var n = document.querySelector(sel);
      if (n) beimSichtbarwerden(n, function () { n.classList.add("sichtbar"); }, 0.3);
    });
  }

  hero();
  klimadiagramme();
  zeitreihe();
  heftChart();
  kirschen();
  vergleich();
  wirkungsgefuege();
  matrix();
  szenario();
  auftritte();
  if (hasGsap) window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
})();
