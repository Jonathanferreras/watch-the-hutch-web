"""Preview renders for the retro restyle (reuses the v2 rasterizer)."""
import os
import sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wth_mount_retro  # noqa: F401  (swaps the restyled parts into wth_mount)
sys.path.insert(0, os.path.join(HERE, "..", "..", "window-mount-v2", "source"))
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import render as R
import wth_mount as W

OUT = os.path.join(os.path.dirname(HERE), "previews")
os.makedirs(OUT, exist_ok=True)
COL = {"#6aa84f": "#82a267", "#2f7d3a": "#2f7d3a", "#3a3a3a": "#2a2a2a", "#202020": "#2a2a2a"}


def items(**kw):
    return [(s, COL.get(c, c), a) for s, c, a in R.assembly(**kw)]


fig = plt.figure(figsize=(14, 7), dpi=110)
ax = fig.add_subplot(1, 2, 1); R.draw(ax, items(), 20, 60); ax.set_title("Room side")
ax = fig.add_subplot(1, 2, 2); R.draw(ax, items(pan=15, tilt=-12, explode=45), 30, -130)
ax.set_title("Exploded, from the glass side")
fig.tight_layout(); fig.savefig(os.path.join(OUT, "assembly.png")); plt.close(fig)

P = W.build_all()
fig = plt.figure(figsize=(16, 9), dpi=100)
for i, n in enumerate(P):
    ax = fig.add_subplot(2, 4, i + 1)
    R.draw(ax, [(W.to_print(n, P[n]), "#2a2a2a" if n == "hood" else "#82a267" if n in ("base_pi_mount", "pi5_plate") else "#2a2a2a" if n == "screen_lid" else "#e69138", 1.0)], 30, -60)
    ax.set_title(n + "\n(as printed)")
ax = fig.add_subplot(2, 4, 8)
R.draw(ax, [(W.hood_to_base(P["hood"]), "#2a2a2a", 1.0), (W.hood_to_base(P["screen_lid"]), "#2a2a2a", 1.0)], 15, 70)
ax.set_title("hood + lid, room side")
fig.tight_layout(); fig.savefig(os.path.join(OUT, "parts.png")); plt.close(fig)
print("ok")
