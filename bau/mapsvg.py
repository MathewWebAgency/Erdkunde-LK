import json, math, sys
from shapely.geometry import shape, box
from dem import px
c=json.load(open('crop.json')); X0,Y0,W,H=c['x0'],c['y0'],c['W'],c['H']
md=json.load(open('mapdata.json'))
def P(lon,lat):
    x,y=px(lon,lat); return x-X0,y-Y0
a1=json.load(open('ne/ne_10m_admin_1_states_provinces.geojson'))
BB=box(-73.2,-37.2,-69.3,-31.8)
regnames={'Valparaíso':'Valparaíso','Región Metropolitana de Santiago':'Metropolitana','Libertador General Bernardo O\'Higgins':'O’Higgins','Maule':'Maule','Ñuble':'Ñuble','Bío-Bío':'Biobío','Coquimbo':'Coquimbo'}
cent={}
for f in a1['features']:
    n=f['properties']['name']
    if f['properties']['admin']=='Chile' and n in regnames:
        g=shape(f['geometry']).intersection(BB)
        if not g.is_empty:
            r=g.representative_point(); cent[n]=P(r.x,r.y)
o=[]
o.append(f'<svg class="karte" viewBox="0 0 {W} {H}" role="img" aria-labelledby="karte-titel karte-desc" xmlns="http://www.w3.org/2000/svg">')
o.append('<title id="karte-titel">Reliefkarte Zentralchile mit Valle Central</title><desc id="karte-desc">Höhenstufen und Schummerung zwischen 31,8 und 37,2 Grad Süd. Das Valle Central liegt als hellgrüne Senke zwischen Küstenkordillere im Westen und Anden im Osten. Markiert sind Regionen, Flüsse, Städte, Petorca, die Laguna de Aculeo und die Linie des Querschnitts bei 34,2 Grad Süd.</desc>')
o.append(f'<image href="assets/img/karte-relief.webp" x="0" y="0" width="{W}" height="{H}" preserveAspectRatio="none"/>')
o.append(f'<path class="k-arg" d="{md["arg"]}"/>')
for n,d in md['regs'].items():
    cls='k-reg k-fall' if n in ("Libertador General Bernardo O'Higgins",'Maule') else 'k-reg'
    o.append(f'<path class="{cls}" d="{d}"/>')
o.append(f'<path class="k-riv k-riv0" d="{md["rivers"]["0"]}"/>')
o.append(f'<path class="k-riv k-riv1" d="{md["rivers"]["1"]}"/>')
o.append(f'<path class="k-riv k-riv2" d="{md["rivers"]["2"]}"/>')
# graticule ticks
for lat in (-32,-33,-34,-35,-36,-37):
    y=P(-73.2,lat)[1]
    o.append(f'<line class="k-tick" x1="0" y1="{y:.0f}" x2="26" y2="{y:.0f}"/><text class="k-grad" x="32" y="{y+9:.0f}">{abs(lat)}° S</text>')
for lon in (-73,-72,-71,-70):
    x=P(lon,-31.8)[0]
    o.append(f'<line class="k-tick" x1="{x:.0f}" y1="0" x2="{x:.0f}" y2="26"/><text class="k-grad" x="{x+6:.0f}" y="46">{abs(lon)}° W</text>')
# profile line
(ax,ay),(bx,by)=md['prof']
o.append(f'<line class="k-prof" x1="{ax:.0f}" y1="{ay:.0f}" x2="{bx:.0f}" y2="{by:.0f}"/>')
o.append(f'<text class="k-proflab" x="{ax-6:.0f}" y="{ay-14:.0f}" text-anchor="end">A</text><text class="k-proflab" x="{bx+8:.0f}" y="{by-14:.0f}">B</text>')
# region labels
for n,(x,y) in cent.items():
    lab=regnames[n]
    if n=='Coquimbo': continue
    adj={'Valparaíso':(-40,30),'Región Metropolitana de Santiago':(60,-70),"Libertador General Bernardo O'Higgins":(-10,40),'Maule':(10,0),'Ñuble':(0,10),'Bío-Bío':(10,60)}.get(n,(0,0))
    o.append(f'<text class="k-region" x="{x+adj[0]:.0f}" y="{y+adj[1]:.0f}" text-anchor="middle">{lab.upper()}</text>')
# cities
big={'Santiago'}
for n,(x,y) in md['places'].items():
    if n in ('Petorca','Laguna de Aculeo'): continue
    r=9 if n in big else 5.5
    dx={'Valparaíso':-12,'San Antonio':-12,'Pichilemu':-12,'Constitución':-12,'Concepción':-12}.get(n,12)
    anchor='end' if dx<0 else 'start'
    o.append(f'<circle class="k-city" cx="{x:.0f}" cy="{y:.0f}" r="{r}"/><text class="k-citylab{" k-big" if n in big else ""}" x="{x+dx*(1.6 if n in big else 1):.0f}" y="{y+6:.0f}" text-anchor="{anchor}">{n}</text>')
# problem sites
for n in ('Petorca','Laguna de Aculeo'):
    x,y=md['places'][n]
    o.append(f'<g class="k-site"><rect x="{x-9:.0f}" y="{y-9:.0f}" width="18" height="18" transform="rotate(45 {x:.0f} {y:.0f})"/><text x="{x+16:.0f}" y="{y+6:.0f}">{n}</text></g>')
# river labels
rl={'Aconcagua':(-71.05,-32.87,-8),'Maipo':(-71.3,-33.72,20),'Rapel':(-71.55,-34.06,-10),'Cachapoal':(-70.95,-34.36,-10),'Tinguiririca':(-71.15,-34.74,-12),'Mataquito':(-71.75,-35.0,-6),'Maule':(-71.98,-35.5,-8),'Itata':(-72.6,-36.42,-20)}
for n,(lo,la,rot) in rl.items():
    x,y=P(lo,la)
    o.append(f'<text class="k-rivlab" x="{x:.0f}" y="{y:.0f}" transform="rotate({rot} {x:.0f} {y:.0f})">{n}</text>')
# big landscape labels
x,y=P(-71.93,-36.12)
o.append(f'<text class="k-land" x="{x:.0f}" y="{y:.0f}" text-anchor="middle" transform="rotate(-62 {x:.0f} {y:.0f})">VALLE CENTRAL</text>')
x,y=P(-72.3,-35.7)
o.append(f'<text class="k-land k-land-s" text-anchor="middle" x="{x:.0f}" y="{y:.0f}" transform="rotate(-76 {x:.0f} {y:.0f})">KÜSTENKORDILLERE</text>')
x,y=P(-70.62,-35.45)
o.append(f'<text class="k-land k-land-s" text-anchor="middle" x="{x:.0f}" y="{y:.0f}" transform="rotate(-76 {x:.0f} {y:.0f})">ANDEN</text>')
x,y=P(-69.75,-33.6)
o.append(f'<text class="k-arglab" x="{x:.0f}" y="{y:.0f}" text-anchor="middle">ARGENTINIEN</text>')
x,y=P(-72.75,-33.2)
o.append(f'<text class="k-sea" x="{x:.0f}" y="{y:.0f}" text-anchor="middle">PAZIFIK</text>')
# scale bar 50 km
mpp=156543.03392*math.cos(math.radians(34.5))/2**9
L=50000/mpp
sx,sy=60,H-70
o.append(f'<g class="k-scale"><rect x="{sx}" y="{sy}" width="{L/2:.1f}" height="10"/><rect class="hol" x="{sx+L/2:.1f}" y="{sy}" width="{L/2:.1f}" height="10"/><text x="{sx}" y="{sy-10}">0</text><text x="{sx+L:.0f}" y="{sy-10}" text-anchor="middle">50 km</text></g>')
# north arrow
o.append(f'<g class="k-north" transform="translate({W-70} {H-130})"><path d="M0,-44 L16,10 L0,0 L-16,10 Z"/><text y="40" text-anchor="middle">N</text></g>')
o.append('</svg>')
open(sys.argv[1],'w').write('\n'.join(o))
# inset: South America
ad0=json.load(open('ne/ne_10m_admin_0_countries.geojson'))
from shapely.ops import unary_union
sa=[shape(f['geometry']) for f in ad0['features'] if f['properties']['CONTINENT']=='South America']
sa=unary_union(sa).simplify(0.25)
ch=[shape(f['geometry']) for f in ad0['features'] if f['properties']['ADMIN']=='Chile'][0].simplify(0.15)
def ip(lon,lat): return ((lon+82)*6.0,(-lat+13)*6.0)
def pth(g):
    gs=[g] if g.geom_type=='Polygon' else list(g.geoms)
    return ' '.join('M'+' L'.join(f'{a:.1f},{b:.1f}' for a,b in (ip(*xy) for xy in p.exterior.coords))+'Z' for p in gs if p.area>0.3)
bx0,by0=ip(-73.2,-31.8); bx1,by1=ip(-69.3,-37.2)
ins=f'<svg class="inset" viewBox="0 0 300 400" role="img" aria-label="Lage des Kartenausschnitts in Südamerika"><path class="i-sa" d="{pth(sa)}"/><path class="i-ch" d="{pth(ch)}"/><rect class="i-box" x="{bx0:.1f}" y="{by0:.1f}" width="{bx1-bx0:.1f}" height="{by1-by0:.1f}"/><text x="{bx1+6:.0f}" y="{by0+16:.0f}">Ausschnitt</text></svg>'
open(sys.argv[2],'w').write(ins)
print('ok', W,H)
