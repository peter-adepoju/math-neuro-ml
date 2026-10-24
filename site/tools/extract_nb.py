"""Re-execute a teaching notebook, capturing every matplotlib figure as SVG and every Plotly figure as JSON.
Usage: python extract_nb.py NOTEBOOK OUTDIR
Writes OUTDIR/cellNNN_k.svg and OUTDIR/cellNNN_k.json (NNN = cell index in the original notebook)."""
import json, os, subprocess, sys, copy
nb_path, out = sys.argv[1], os.path.abspath(sys.argv[2])
os.makedirs(out, exist_ok=True)
nb = json.load(open(nb_path))
PATCH = r'''
import matplotlib, matplotlib.pyplot as _plt
from matplotlib_inline.backend_inline import set_matplotlib_formats as _smf
_smf('svg'); matplotlib.rcParams['svg.fonttype'] = 'none'
import plotly.graph_objects as _go, os as _os
_OUT = %r
_n = {}
def _show(self, *a, **k):
    c = globals().get('__CELL__', -1); _n[c] = _n.get(c, 0) + 1
    open(_os.path.join(_OUT, f'cell{c:03d}_{_n[c]}.json'), 'w').write(self.to_json())
_go.Figure.show = _show
''' % out
cells = []
patched = False
for i, c in enumerate(nb['cells']):
    c = copy.deepcopy(c)
    if c['cell_type'] == 'code':
        src = ''.join(c['source'])
        c['source'] = f'__CELL__ = {i}\n' + src
        cells.append(c)
        if not patched and ('PLOTLY_CONFIG' in src or 'plotly.io' in src):
            cells.append({'cell_type': 'code', 'metadata': {}, 'outputs': [], 'execution_count': None, 'source': PATCH})
            patched = True
    else:
        cells.append(c)
assert patched, 'no plotly set-up cell found'
nb2 = dict(nb, cells=cells)
tmp = os.path.join(out, '_run.ipynb'); json.dump(nb2, open(tmp, 'w'))
r = subprocess.run([sys.executable, '-m', 'jupyter', 'nbconvert', '--to', 'notebook', '--execute', '--inplace',
                    '--ExecutePreprocessor.timeout=600', tmp], cwd=out, capture_output=True, text=True)
if r.returncode:
    print(r.stderr[-2000:]); sys.exit(1)
ran = json.load(open(tmp))
n_svg = 0
for c in ran['cells']:
    if c['cell_type'] != 'code' or not ''.join(c['source']).startswith('__CELL__'):
        continue
    idx = int(''.join(c['source']).split('\n')[0].split('=')[1])
    k = 0
    for o in c.get('outputs', []):
        svg = o.get('data', {}).get('image/svg+xml')
        if svg:
            k += 1; n_svg += 1
            open(os.path.join(out, f'cell{idx:03d}_{k}.svg'), 'w').write(''.join(svg) if isinstance(svg, list) else svg)
print('svg', n_svg, 'json', len([f for f in os.listdir(out) if f.endswith('.json')]))
