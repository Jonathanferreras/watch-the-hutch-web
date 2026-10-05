"""Cable-routing diagram: section through the middle of the assembly (x = 0), seen from the side."""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from render import assembly, raster, OUT
from wth_mount import box, BASE_TOP_T, FLOOR_T, HOOD_IN_D, DISP_CENTER_Z, DISP_PCB_D, DISP_TAB_H

HZ = BASE_TOP_T + FLOOR_T


def section(items):
    keep = box(-300, 0, -300, 300, -300, 300)
    out = []
    for s, c, a in items:
        try:
            cut = s.intersect(keep)
        except Exception:
            continue
        if cut.Volume() > 1e-3:
            out.append((cut, c, a))
    return out


def main():
    items = assembly()
    # straight jumper plugs on the display header (they point toward the camera)
    zr = DISP_CENTER_Z - DISP_PCB_D / 2 - DISP_TAB_H + 2.5
    yp = HOOD_IN_D - 3.6
    items.append((box(-8.9, 8.9, yp - 2.6 - 14.5, yp - 2.6, zr - 1.3 + HZ, zr + 1.3 + HZ), "#111111", 1.0))
    img, (M, sc, cx, cy, W, H) = raster(section(items), 0, 0, size=(1300, 1000), want_proj=True)

    def px(y, z):
        v = M @ np.array([0.0, y, z])
        return (v[0] - cx) * sc + W / 2, H / 2 - (v[1] - cy) * sc

    def line(pts, **kw):
        p = np.array([px(y, z) for y, z in pts])
        ax.plot(p[:, 0], p[:, 1], solid_capstyle="round", solid_joinstyle="round", **kw)

    fig = plt.figure(figsize=(13, 10), dpi=110)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.imshow(img)
    ax.set_axis_off()
    # camera ribbon (assembly y, z): connector on the camera -> over the turntable -> under the lid
    # -> down behind the Pi -> around the bottom edge -> into the Pi's camera connector
    rib = [(16.9, 28.0), (16.9, 15.8), (47.0, 15.8), (48.6, 14.2), (48.6, 9.5), (51.0, 9.5),
           (51.0, -55.0), (52.0, -56.2), (56.6, -56.2), (57.4, -55.2), (57.4, -50.5)]
    line(rib, color="#ff8c1a", lw=5, label="Camera ribbon")
    # display wires: out of the plugs, back under them, out of the lid notch, over the Pi's top edge
    # and into the GPIO header from the front
    wires = [(29.3, 19.0), (27.6, 18.4), (27.6, 17.0), (29.0, 16.6), (46.5, 16.6), (47.6, 15.6),
             (47.6, 11.6), (49.0, 10.6), (52.6, 10.6), (52.6, 4.2), (76.0, 4.2), (78.0, 2.5),
             (78.0, 1.0), (76.0, 0.4), (72.8, 0.4)]
    line(wires, color="#1f77ff", lw=3.5, label="Display wires (7)")
    # jumper plugs on the GPIO pins (drawn, not modelled)
    a, b = px(58.4, 2.6), px(72.8, -1.8)
    ax.add_patch(plt.Rectangle((a[0], a[1]), b[0] - a[0], b[1] - a[1], color="#111111"))

    def note(text, y, z, dx, dy):
        x0, y0 = px(y, z)
        ax.annotate(text, (x0, y0), (x0 + dx, y0 + dy), fontsize=11,
                    arrowprops=dict(arrowstyle="-", color="#444444", lw=1), color="#222222",
                    bbox=dict(boxstyle="round,pad=0.3", fc="white", ec="#bbbbbb"))
    note("Camera ribbon leaves the camera\nand lies over the turntable", 30, 15.8, -330, 120)
    note("Display plugs point at the camera;\nwires fold back underneath", 36, 20.5, -60, -170)
    note("Both cables leave through the\nnotch at the bottom of the lid\n(tape or foam over it after)", 51.5, 9.5, 120, -150)
    note("Ribbon runs down the 5 mm gap\nbehind the Pi", 51, -25, -360, 0)
    note("...around the bottom edge and up\ninto the Pi's camera connector", 57.4, -52, 120, 60)
    note("Wires go over the Pi's top edge\nand plug into the GPIO pins", 70, 4.2, 60, -110)
    note("Glass", 0, 50, -40, -40)
    ax.legend(loc="lower left", fontsize=12, frameon=True)
    ax.set_title("Cable routing: section through the middle, glass on the left, room on the right", fontsize=13)
    fig.savefig(os.path.join(OUT, "cable_routing.png"))
    print("ok")


if __name__ == "__main__":
    main()
