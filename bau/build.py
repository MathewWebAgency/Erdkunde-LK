"""Baut site/index.html aus index.src.html.
Ersetzt {{PROFIL}}, {{PROFIL2050}}, {{KARTE}} und {{INSET}} durch erzeugtes SVG.
Aufruf: python3 bau/build.py
"""
import json, math, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BAU = ROOT / "bau"
SITE = ROOT / "site"

data_js = (SITE / "assets/js/data.js").read_text(encoding="utf-8")
VC = json.loads(data_js[len("window.VC="):].rstrip().rstrip(";"))
pr = VC["profil"]
KM, Z, LON = pr["km"], pr["z"], pr["lon"]

W, H = 1600, 640
SEA_Y = 540
SCALE_Z = 0.095          # px pro Meter
KM_MAX = KM[-1]


def X(km):
    return km / KM_MAX * W


def Y(z):
    return SEA_Y - z * SCALE_Z


def km_at_lon(lon):
    best = min(range(len(LON)), key=lambda i: abs(LON[i] - lon))
    return KM[best], Z[best]


pts = [(X(k), Y(max(z, -40))) for k, z in zip(KM, Z)]
coast_i = next(i for i, z in enumerate(Z) if z > 5)
terrain = "M{:.1f},{:.1f} ".format(pts[0][0], H) + " ".join(
    "L{:.1f},{:.1f}".format(x, y) for x, y in pts) + " L{:.1f},{:.1f} Z".format(W, H)
ridge = "M" + " L".join("{:.1f},{:.1f}".format(x, y) for x, y in pts[coast_i - 1:])

# Bäume: Talboden (Valle Central) und Hanglagen
valley_trees, slope_trees, coast_trees = [], [], []
for i in range(coast_i + 2, len(Z) - 1, 2):
    lon, z = LON[i], Z[i]
    slope = abs(Z[i + 1] - Z[i - 1])
    x, y = pts[i]
    if -70.92 <= lon <= -70.58 and 400 <= z <= 640 and slope < 60:
        valley_trees.append((x, y))
    elif (-71.30 <= lon <= -71.10 or -70.98 <= lon <= -70.90 or -70.58 <= lon <= -70.50) and 560 <= z <= 1150:
        slope_trees.append((x, y))
    elif -71.75 <= lon <= -71.42 and 120 <= z <= 320:
        coast_trees.append((x, y))


def trees(lst, cls, r=6.5):
    out = []
    for j, (x, y) in enumerate(lst):
        rr = r * (0.85 + 0.3 * ((j * 37) % 7) / 7)
        out.append('<g class="{c}" transform="translate({x:.1f} {y:.1f})"><line y1="0" y2="-{h:.1f}"/><circle cy="-{cy:.1f}" r="{r:.1f}"/></g>'.format(
            c=cls, x=x, y=y + 1, h=rr * 1.2, cy=rr * 1.9, r=rr))
    return "\n".join(out)


# Wasserkörper: Lago Rapel und Río Cachapoal
k_rapel, z_rapel = km_at_lon(-71.36)
k_cach, z_cach = km_at_lon(-70.80)
lake = (X(k_rapel), Y(z_rapel))
river = (X(k_cach), Y(z_cach))

# Grundwasserkörper unter dem Valle Central
gw_x0, gw_x1 = X(km_at_lon(-70.93)[0]), X(km_at_lon(-70.56)[0])
gw_y = Y(470) + 26

# Brunnen
wells = []
for lon in (-70.86, -70.74, -70.64):
    k, z = km_at_lon(lon)
    wells.append((X(k), Y(z)))

snow_lines = {"y1990": Y(2200), "y2022": Y(2500), "y2050": Y(2850)}

k_cc, z_cc = max(((k, z) for k, z, lo in zip(KM, Z, LON) if -71.2 < lo < -70.9), key=lambda t: t[1])
k_and, z_and = max(((k, z) for k, z in zip(KM, Z)), key=lambda t: t[1])
k_rcg, z_rcg = km_at_lon(-70.74)


def svg_profile(idpref, extra_cls=""):
    p = idpref
    s = []
    s.append('<svg class="profil {extra}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="{p}-t {p}-d">'.format(W=W, H=H, p=p, extra=extra_cls))
    s.append('<title id="{p}-t">West-Ost-Querschnitt durch Zentralchile bei 34,2 Grad Süd</title>'.format(p=p))
    s.append('<desc id="{p}-d">Echtes Höhenprofil von der Pazifikküste über die Küstenkordillere und das Valle Central bei Rancagua bis zum Andenhauptkamm an der Grenze zu Argentinien, rund 200 Kilometer, 12-fach überhöht. Schneedecke, Flüsse, Grundwasser und Obstplantagen sind schematisch ergänzt.</desc>'.format(p=p))
    s.append('<defs>')
    s.append('<linearGradient id="{p}-land" gradientUnits="userSpaceOnUse" x1="0" y1="{a}" x2="0" y2="{b}">'
             '<stop offset="0" stop-color="#B8C2A2"/><stop offset=".18" stop-color="#C9BE91"/>'
             '<stop offset=".55" stop-color="#9C9483"/><stop offset="1" stop-color="#6F7572"/></linearGradient>'.format(p=p, a=SEA_Y, b=Y(4500)))
    s.append('<clipPath id="{p}-clip"><path d="{d}"/></clipPath>'.format(p=p, d=terrain))
    s.append('<linearGradient id="{p}-schnee" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F9F7"/><stop offset=".78" stop-color="#F7F9F7"/><stop offset="1" stop-color="#F7F9F7" stop-opacity="0"/></linearGradient>'.format(p=p))
    s.append('<pattern id="{p}-aq" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3"/><circle cx="7" cy="7" r="1.3"/></pattern>'.format(p=p))
    s.append('</defs>')
    # Meer
    s.append('<rect class="pf-sea" x="0" y="{y}" width="{w:.1f}" height="{h}"/>'.format(y=SEA_Y, w=pts[coast_i][0] + 4, h=H - SEA_Y))
    s.append('<path class="pf-wave" d="M0,{y} q10,-4 20,0 t20,0 t20,0 t20,0 t20,0"/>'.format(y=SEA_Y))
    # Gelände
    s.append('<path class="pf-land" fill="url(#{p}-land)" d="{d}"/>'.format(p=p, d=terrain))
    s.append('<path class="pf-dry" d="{d}"/>'.format(d=terrain))
    # Grundwasser
    s.append('<g clip-path="url(#{p}-clip)"><g class="pf-gw"><rect x="{x0:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h}" fill="url(#{p}-aq)" class="pf-aq"/>'
             '<line class="pf-gwline" x1="{x0:.1f}" y1="{y:.1f}" x2="{x1:.1f}" y2="{y:.1f}"/>'
             '<text class="pf-num pf-gw-lab" x="{tx:.0f}" y="{ty:.0f}">Grundwasser</text></g></g>'.format(p=p, x0=gw_x0, x1=gw_x1, y=gw_y, w=gw_x1 - gw_x0, h=H - gw_y, tx=gw_x0 + 8, ty=gw_y + 26))
    # Schnee
    s.append('<g clip-path="url(#{p}-clip)"><rect class="pf-snow" fill="url(#{p}-schnee)" x="0" y="0" width="{W}" height="{h:.1f}" data-y1990="{a:.1f}" data-y2022="{b:.1f}" data-y2050="{c:.1f}"/></g>'.format(
        p=p, W=W, h=snow_lines["y2050"] if extra_cls else snow_lines["y1990"], a=snow_lines["y1990"], b=snow_lines["y2022"], c=snow_lines["y2050"]))
    s.append('<path class="pf-ridge" d="{d}"/>'.format(d=ridge))
    # Wasser
    s.append('<ellipse class="pf-water pf-lake" cx="{x:.1f}" cy="{y:.1f}" rx="34" ry="6"/>'.format(x=lake[0], y=lake[1] + 2))
    s.append('<ellipse class="pf-water pf-river" cx="{x:.1f}" cy="{y:.1f}" rx="13" ry="4"/>'.format(x=river[0], y=river[1] + 1))
    # Brunnen
    s.append('<g class="pf-wells">' + "".join(
        '<g transform="translate({x:.1f} {y:.1f})"><line y1="-6" y2="{d:.1f}"/><rect x="-4" y="-12" width="8" height="6"/></g>'.format(x=x, y=y, d=gw_y - y + 40)
        for x, y in wells) + '</g>')
    # Versickerungsbecken (nur Szenario Anpassung)
    if extra_cls:
        rb = []
        for lon in (-70.80, -70.69):
            k, z = km_at_lon(lon)
            x, y = X(k), Y(z)
            rb.append('<g transform="translate({x:.1f} {y:.1f})"><rect x="-11" y="-3" width="22" height="6" rx="2"/><path d="M0,6 V{d:.1f}" /><path d="M-4,{e:.1f} L0,{f:.1f} L4,{e:.1f}" /></g>'.format(x=x, y=y, d=gw_y - y - 6, e=gw_y - y - 12, f=gw_y - y - 6))
        s.append('<g class="pf-recharge">' + "".join(rb) + '</g>')
    # Bäume
    s.append('<g class="pf-trees pf-t-valley">' + trees(valley_trees, "pf-tree") + '</g>')
    s.append('<g class="pf-trees pf-t-coast">' + trees(coast_trees, "pf-tree") + '</g>')
    s.append('<g class="pf-trees pf-t-slope">' + trees(slope_trees, "pf-tree") + '</g>')
    # Beschriftung
    lab = []
    lab.append('<text class="pf-lab pf-lab-sea" x="{x:.0f}" y="{y}">PAZIFIK</text>'.format(x=pts[coast_i][0] / 2, y=SEA_Y + 34))
    lab.append('<text class="pf-lab" x="{x:.0f}" y="{y:.0f}" text-anchor="middle">KÜSTENKORDILLERE</text><text class="pf-num" x="{x:.0f}" y="{y2:.0f}" text-anchor="middle">{z} m</text>'.format(
        x=X(k_cc), y=Y(z_cc) - 42, y2=Y(z_cc) - 22, z=format(int(round(z_cc, -1)), ",").replace(",", " ")))
    lab.append('<text class="pf-lab pf-lab-key" x="{x:.0f}" y="{y:.0f}" text-anchor="middle">VALLE CENTRAL</text><text class="pf-num" x="{x:.0f}" y="{y2:.0f}" text-anchor="middle">Rancagua, ca. 500 m</text>'.format(
        x=X(k_rcg), y=Y(z_rcg) - 70, y2=Y(z_rcg) - 50))
    lab.append('<text class="pf-lab" x="{x:.0f}" y="{y:.0f}" text-anchor="middle">ANDEN</text><text class="pf-num" x="{x:.0f}" y="{y2:.0f}" text-anchor="middle">bis über 4 000 m</text>'.format(
        x=X(k_and) - 40, y=Y(z_and) - 40, y2=Y(z_and) - 20))
    lab.append('<text class="pf-num pf-lake-lab" x="{x:.0f}" y="{y:.0f}" text-anchor="middle">Lago Rapel</text>'.format(x=lake[0], y=lake[1] + 30))
    lab.append('<text class="pf-ab" x="14" y="30">A</text><text class="pf-ab" x="{x}" y="30" text-anchor="end">B</text>'.format(x=W - 14))
    lab.append('<text class="pf-meta" x="{x}" y="{y}" text-anchor="end">34,2° S · ca. 200 km · 12-fach überhöht</text>'.format(x=W - 14, y=H - 14))
    s.append('<g class="pf-labels">' + "".join(lab) + '</g>')
    s.append('</svg>')
    return "\n".join(s)


src = (BAU / "index.src.html").read_text(encoding="utf-8")
out = src.replace("{{PROFIL}}", svg_profile("pf"))
out = out.replace("{{PROFIL_A}}", svg_profile("pa", "pf-static pf-trend"))
out = out.replace("{{PROFIL_B}}", svg_profile("pb", "pf-static pf-anpassung"))
out = out.replace("{{KARTE}}", (BAU / "karte.svg.html").read_text(encoding="utf-8"))
out = out.replace("{{INSET}}", (BAU / "inset.svg.html").read_text(encoding="utf-8"))
import hashlib
for rel in ("assets/css/style.css", "assets/fonts/fonts.css", "assets/js/main.js", "assets/js/data.js"):
    h = hashlib.md5((SITE / rel).read_bytes()).hexdigest()[:8]
    out = out.replace('"' + rel + '"', '"' + rel + '?v=' + h + '"')
left = re.findall(r"\{\{[A-Z_0-9]+\}\}", out)
if left:
    raise SystemExit("Platzhalter übrig: %s" % left)
(SITE / "index.html").write_text(out, encoding="utf-8")
print("index.html geschrieben:", len(out) // 1024, "KB;",
      "Talbäume", len(valley_trees), "Hangbäume", len(slope_trees), "Küstenbäume", len(coast_trees))
