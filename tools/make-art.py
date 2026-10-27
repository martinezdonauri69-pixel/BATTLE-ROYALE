# Genera assets/bg.svg y assets/table.svg (arte propio, sin copyright). Ejecutar: python3 tools/make-art.py
import random, os
random.seed(8)
out = os.path.join(os.path.dirname(__file__), '..', 'assets')

# ---------------- FONDO 1600x900 ----------------
s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">']
s.append('''<defs>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050c"/><stop offset=".45" stop-color="#0a1530"/><stop offset=".7" stop-color="#070d1d"/><stop offset="1" stop-color="#02030a"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2a66"/><stop offset="1" stop-color="#14408f"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1226"/><stop offset="1" stop-color="#010207"/></linearGradient>
<linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd97a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd97a" stop-opacity="0"/></linearGradient>
<radialGradient id="pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2aa2ff" stop-opacity=".55"/><stop offset="1" stop-color="#2aa2ff" stop-opacity="0"/></radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
</defs>''')
s.append('<rect width="1600" height="900" fill="url(#wall)"/>')
# ventanal con skyline
s.append('<rect x="130" y="150" width="1340" height="330" fill="url(#sky)" opacity=".55"/>')
x = 130
while x < 1470:
    w = random.randint(34, 90); h = random.randint(70, 260)
    y = 480 - h
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#050b1c" stroke="#1a3f86" stroke-width="1"/>')
    for wy in range(y + 10, 470, 16):
        for wx in range(x + 6, x + w - 8, 12):
            if random.random() < .35:
                c = random.choice(['#ffd97a', '#8fd4ff', '#2aa2ff'])
                s.append(f'<rect x="{wx}" y="{wy}" width="5" height="7" fill="{c}" opacity="{random.uniform(.4,.95):.2f}"/>')
    x += w + random.randint(2, 10)
# marcos del ventanal
for mx in range(130, 1471, 223):
    s.append(f'<rect x="{mx-3}" y="150" width="6" height="330" fill="#02040a"/>')
s.append('<rect x="130" y="150" width="1340" height="330" fill="none" stroke="#f5c04a" stroke-opacity=".5" stroke-width="3"/>')
s.append('<rect x="130" y="478" width="1340" height="6" fill="#f5c04a" opacity=".6"/>')
# neones laterales
for nx, c in [(40, '#2aa2ff'), (70, '#f5c04a'), (1530, '#f5c04a'), (1560, '#2aa2ff')]:
    s.append(f'<rect x="{nx}" y="100" width="5" height="600" fill="{c}" opacity=".85" filter="url(#blur2)"/>')
# bokeh
for _ in range(46):
    cx = random.randint(0, 1600); cy = random.randint(60, 520); r = random.randint(6, 26)
    c = random.choice(['#2aa2ff', '#f5c04a', '#8fd4ff'])
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c}" opacity="{random.uniform(.08,.3):.2f}" filter="url(#blur)"/>')
# suelo
s.append('<rect y="560" width="1600" height="340" fill="url(#floor)"/>')
for i in range(8):
    y = 575 + i * i * 5
    s.append(f'<path d="M0 {y}H1600" stroke="#2aa2ff" stroke-opacity="{0.05+i*0.012:.3f}" stroke-width="1"/>')
s.append('<ellipse cx="800" cy="680" rx="640" ry="120" fill="url(#pool)"/>')
# lamparas colgantes sobre la mesa
for lx in (520, 800, 1080):
    s.append(f'<line x1="{lx}" y1="0" x2="{lx}" y2="250" stroke="#7a5a1a" stroke-width="3"/>')
    s.append(f'<polygon points="{lx-14},250 {lx+14},250 {lx+150},720 {lx-150},720" fill="url(#cone)" opacity=".55"/>')
    s.append(f'<path d="M{lx-46} 280 Q{lx} 218 {lx+46} 280z" fill="#1a1304" stroke="#f5c04a" stroke-width="3"/>')
    s.append(f'<ellipse cx="{lx}" cy="282" rx="40" ry="8" fill="#ffe9a6" opacity=".95" filter="url(#blur2)"/>')
# siluetas de taburetes
for sx in (180, 260, 1340, 1420):
    s.append(f'<rect x="{sx}" y="560" width="8" height="90" fill="#04070f"/><ellipse cx="{sx+4}" cy="556" rx="26" ry="9" fill="#0a1020" stroke="#f5c04a" stroke-opacity=".4"/>')
s.append('</svg>')
open(os.path.join(out, 'bg.svg'), 'w').write('\n'.join(s))

# ---------------- MESA 900x190 ----------------
t = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 190">']
t.append('''<defs>
<linearGradient id="rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a86a1c"/><stop offset=".5" stop-color="#5a3308"/><stop offset="1" stop-color="#2a1604"/></linearGradient>
<linearGradient id="felt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a7fe8"/><stop offset="1" stop-color="#0a3f9a"/></linearGradient>
<radialGradient id="shine" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#8fd4ff" stop-opacity=".45"/><stop offset="1" stop-color="#8fd4ff" stop-opacity="0"/></radialGradient>
<radialGradient id="b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>''')
t.append('<polygon points="50,24 850,24 896,160 4,160" fill="url(#rail)" stroke="#f5c04a" stroke-width="3" stroke-linejoin="round"/>')
t.append('<polygon points="92,44 808,44 856,142 44,142" fill="url(#felt)" stroke="#06265f" stroke-width="3"/>')
t.append('<polygon points="92,44 808,44 856,142 44,142" fill="url(#shine)"/>')
t.append('<polygon points="4,160 896,160 888,176 12,176" fill="#1a0e02"/>')
for px, py in [(92, 44), (450, 40), (808, 44), (44, 142), (450, 148), (856, 142)]:
    t.append(f'<ellipse cx="{px}" cy="{py}" rx="17" ry="11" fill="#02040a" stroke="#f5c04a" stroke-width="2"/>')
cols = ['#f5c518', '#1e50d8', '#d8261e', '#6a2cb8', '#f08a1c', '#12923a', '#8a1f1f', '#111', '#f5c518', '#1e50d8', '#d8261e', '#6a2cb8', '#f08a1c', '#12923a', '#8a1f1f']
i = 0
for row in range(5):
    for k in range(row + 1):
        cx = 600 + row * 19; cy = 94 + (k - row / 2) * 21
        c = cols[i % 15]; i += 1
        t.append(f'<ellipse cx="{cx+3}" cy="{cy+6}" rx="10" ry="4" fill="#000" opacity=".35"/><circle cx="{cx}" cy="{cy}" r="10" fill="{c}"/><circle cx="{cx}" cy="{cy}" r="10" fill="url(#b)"/>')
t.append('<ellipse cx="303" cy="106" rx="10" ry="4" fill="#000" opacity=".35"/><circle cx="300" cy="100" r="10" fill="#fff"/><circle cx="300" cy="100" r="10" fill="url(#b)"/>')
t.append('<g stroke-linecap="round"><line x1="96" y1="128" x2="290" y2="102" stroke="#ffd97a" stroke-width="5"/><line x1="92" y1="129" x2="100" y2="128" stroke="#2aa2ff" stroke-width="6"/></g>')
t.append('</svg>')
open(os.path.join(out, 'table.svg'), 'w').write('\n'.join(t))
print('ok')