"""Shaded preview renders of the assembly and parts (matplotlib, no GUI needed)."""
import os
import sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wth_mount import *  # noqa

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "previews")
os.makedirs(OUT, exist_ok=True)
LIGHT = np.array([0.4, -0.6, 0.8]); LIGHT /= np.linalg.norm(LIGHT)


def tris(shape, tol=0.3):
    v, f = shape.tessellate(tol, 0.3)
    v = np.array([(p.x, p.y, p.z) for p in v])
    return v[np.array(f)]


def view_matrix(elev, azim):
    e, a = np.radians(elev), np.radians(azim)
    d = np.array([np.cos(e) * np.cos(a), np.cos(e) * np.sin(a), np.sin(e)])  # toward the viewer
    right = np.cross([0, 0, 1], d); right /= np.linalg.norm(right)
    up = np.cross(d, right)
    return np.vstack([right, up, d])


def raster(items, elev, azim, size=(900, 700)):
    """small z-buffer rasterizer (orthographic, flat shaded, with outlines)"""
    M = view_matrix(elev, azim)
    T, Cl = [], []
    for shape, color, _ in items:
        t = tris(shape, 0.15)
        n = np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0])
        n /= np.linalg.norm(n, axis=1)[:, None] + 1e-12
        nv = n @ M.T
        l = np.array([-0.35, 0.55, 0.75]); l /= np.linalg.norm(l)
        shade = 0.35 + 0.65 * np.abs(nv @ l)
        T.append(t @ M.T)
        Cl.append(np.clip(np.array(matplotlib.colors.to_rgb(color))[None] * shade[:, None], 0, 1))
    T = np.vstack(T); Cl = np.vstack(Cl)
    W, H = size
    lo, hi = T.reshape(-1, 3).min(0), T.reshape(-1, 3).max(0)
    sc = 0.9 * min(W / (hi[0] - lo[0]), H / (hi[1] - lo[1]))
    cx, cy = (hi[0] + lo[0]) / 2, (hi[1] + lo[1]) / 2
    X = (T[:, :, 0] - cx) * sc + W / 2
    Y = H / 2 - (T[:, :, 1] - cy) * sc
    Z = T[:, :, 2]
    zb = np.full((H, W), -np.inf); img = np.ones((H, W, 3)); idb = np.full((H, W), -1)
    for i in range(len(T)):
        x, y, z = X[i], Y[i], Z[i]
        x0, x1 = max(int(np.floor(x.min())), 0), min(int(np.ceil(x.max())), W - 1)
        y0, y1 = max(int(np.floor(y.min())), 0), min(int(np.ceil(y.max())), H - 1)
        if x1 < x0 or y1 < y0:
            continue
        den = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
        if abs(den) < 1e-9:
            continue
        px, py = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        a = ((y[1] - y[2]) * (px - x[2]) + (x[2] - x[1]) * (py - y[2])) / den
        b = ((y[2] - y[0]) * (px - x[2]) + (x[0] - x[2]) * (py - y[2])) / den
        c = 1 - a - b
        m = (a >= -1e-6) & (b >= -1e-6) & (c >= -1e-6)
        if not m.any():
            continue
        zz = a * z[0] + b * z[1] + c * z[2]
        sub = zb[y0:y1 + 1, x0:x1 + 1]
        upd = m & (zz > sub)
        sub[upd] = zz[upd]
        img[y0:y1 + 1, x0:x1 + 1][upd] = Cl[i]
        idb[y0:y1 + 1, x0:x1 + 1][upd] = i
    # outlines where depth jumps
    d = np.where(np.isfinite(zb), zb, zb[np.isfinite(zb)].min() - 50)
    edge = np.zeros_like(d, bool)
    edge[1:, :] |= np.abs(np.diff(d, axis=0)) > 1.5
    edge[:, 1:] |= np.abs(np.diff(d, axis=1)) > 1.5
    img[edge] *= 0.25
    return img


def draw(ax, items, elev, azim, size=(900, 700)):
    ax.imshow(raster(items, elev, azim, size))
    ax.set_axis_off()


def assembly(pan=0, tilt=0, explode=0.0):
    P = build_all()
    e = explode
    hood_z = BASE_TOP_T + FLOOR_T
    mv = lambda s, dx=0, dy=0, dz=0: s.translate(V(dx, dy, dz))
    y_face = MULLION_DEPTH + BASE_WALL_T
    pi_top_z = BASE_TOP_T - PI_TOP_BELOW_SURFACE
    pi = box(-PI_W / 2, PI_W / 2, y_face + PI_STANDOFF_H, y_face + PI_STANDOFF_H + 1.6, pi_top_z - PI_H, pi_top_z)
    m = -1 if PORTS_ON_ROOM_RIGHT else 1
    cooler = box(*sorted((m * (-PI_W / 2 + 8), m * (-PI_W / 2 + 60))), y_face + PI_STANDOFF_H + 1.6, y_face + PI_STANDOFF_H + 9,
                 pi_top_z - 50, pi_top_z - 8)
    ports = box(*sorted((m * (PI_W / 2 - 21), m * (PI_W / 2 + 2))), y_face + PI_STANDOFF_H + 1.6, y_face + PI_STANDOFF_H + 17,
                pi_top_z - 54, pi_top_z - 2)
    mullion = box(-90, 90, 0, MULLION_DEPTH, -MULLION_FACE_H, 0)
    glass = box(-90, 90, -6, -1, -MULLION_FACE_H - 40, 90)
    cam = place_on_axis(U(P["camera_cradle"], camera_dummy()), pan, tilt)
    items = [
        (mullion, "#b9bcc0", 1.0),
        (P["base_pi_mount"], "#e8dcc0", 1.0),
        (U(pi, cooler), "#2f7d3a", 1.0),
        (ports, "#c8c8c8", 1.0),
        (mv(P["hood"], dz=hood_z + e), "#82a267", 1.0),
        (mv(place_yoke(P["camera_yoke"], pan), dz=hood_z + 2.0 * e), "#e69138", 1.0),
        (mv(cam, dz=hood_z + 2.6 * e), "#f1c232", 1.0),
        (mv(P["screen_lid"], dy=1.2 * e, dz=hood_z + e), "#2a2a2a", 1.0),
        (mv(P["porthole_bezel"], dy=1.8 * e, dz=hood_z + e), "#c47a3a", 1.0),
        (mv(P["screen_retainer"], dy=0.6 * e, dz=hood_z + e), "#e69138", 1.0),
    ]
    return items


if __name__ == "__main__":
    fig = plt.figure(figsize=(9, 8), dpi=120)
    ax = fig.add_subplot(1, 1, 1)
    draw(ax, assembly(), 12, 72, size=(1000, 900))
    ax.set_title("Room side (hood in the v1 sage green #82A267, copper porthole, cream base)")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "hero.png")); plt.close(fig)

    fig = plt.figure(figsize=(14, 7), dpi=110)
    ax = fig.add_subplot(1, 2, 1)
    draw(ax, assembly(), 20, 60)
    ax.set_title("Room side: Pi on the mullion face, screen in the hood lid")
    ax = fig.add_subplot(1, 2, 2)
    draw(ax, assembly(pan=15, tilt=-12, explode=45), 30, -130)
    ax.set_title("Exploded, from the glass side (camera panned 15°, tilted 12°)")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "assembly.png")); plt.close(fig)

    P = build_all()
    names = list(P)
    fig = plt.figure(figsize=(15, 13), dpi=100)
    for i, n in enumerate(names):
        ax = fig.add_subplot(3, 3, i + 1)
        col = "#c9b88f" if "base" in n or "plate" in n else ("#c47a3a" if "bezel" in n else ("#82a267" if n == "hood" else "#4f7f7e"))
        draw(ax, [(to_print(n, P[n]), col, 1.0)], 30, -60)
        ax.set_title(n + "\n(as printed)")
    ax = fig.add_subplot(3, 3, 9)
    draw(ax, [(U(P["camera_yoke"], P["camera_cradle"].rotate(V(0, 0, 0), V(1, 0, 0), -20), camera_dummy().rotate(V(0, 0, 0), V(1, 0, 0), -20)), "#e69138", 1.0)], 15, -120)
    ax.set_title("pan/tilt stage + camera")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "parts.png")); plt.close(fig)
    print("ok")
