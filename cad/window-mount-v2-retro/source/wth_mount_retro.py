"""
Watch The Hutch - window mount v2 "retro" restyle (CadQuery)

Same mechanics as ../window-mount-v2 (every hole, slot, boss, fit and screw is unchanged and
comes from wth_mount.py); only the outside styling is new, going for 1950s space-age:
  hood        rounded "vintage TV" body, swept tail fin on top, three speed-line ribs on each side
  screen_lid  matching rounded outline, porthole bezel (deep bevel + two rings) and speed-line
              "wings" either side of the display
  base        rounded room-side corners and bottom corners on the Pi wall, rounded top front edge
  pi5_plate   rounded corners
Yoke, cradle and retainer are internal and unchanged.

Run:  python3 wth_mount_retro.py   (needs ../../window-mount-v2/source on disk; writes ../step, ../stl)
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "window-mount-v2", "source"))
import cadquery as cq
from cadquery import Vector as V
import wth_mount as W

# measured from Jonny's GC9A01 model (v2 used estimates 39.5 / 26 / 9 / 3.8); set on the v2 module
# so its lid-ring, retainer and display-outline helpers use them too
W.DISP_PCB_D = 38.0       # round PCB diameter
W.DISP_TAB_W = 23.0       # pin tab width
W.DISP_TAB_H = 9.5        # tab length below the circle
W.DISP_STACK = 3.6        # glass 2.0 + PCB 1.6

from wth_mount import (box, cyl, U, C, hexprism, countersink, pi_standoffs, hood_corner_bosses,
                       disp_outline, HOOD_IN_W, HOOD_IN_H, HOOD_IN_D, WALL, FLOOR_T, FLANGE, FLANGE_T,
                       LID_T, AXIS_Y, YOKE_T, PIVOT_PIN_D, LOCK_R, MOUNT_X, MOUNT_Y, SLOT_Y,
                       M3_CLEAR, M3_TAP, M3_NUT_AF, M3_NUT_H, M2_TAP, DISP_CENTER_Z, DISP_PCB_D,
                       DISP_TAB_W, DISP_TAB_H, DISP_STACK, DISP_VIEW_D, BASE_LEN, BASE_TOP_T,
                       BASE_WALL_T, MULLION_DEPTH, MULLION_FACE_H, PI_W, PI_H, PI_TOP_BELOW_SURFACE,
                       PORTS_ON_ROOM_RIGHT, REAR_LIP_H)

# ---------------------------------------------------------------- style parameters
R_TOP = 10.0          # hood/lid outer radius at the top corners (lid corner screws need <= 10)
R_BOT = 4.0           # hood/lid outer radius at the bottom corners (hood floor stays flat on the base)
FIN = True            # tail fin on the hood top
FIN_H = 10.0          # fin height at the room end
FIN_T = 3.0
SPEED_Z = (17.0, 23.0, 29.0)       # side-rib heights above the hood floor
SPEED_END_Y = (44.0, 36.0, 28.0)   # where each rib ends (they all start at the flange)
SPEED_W, SPEED_H = 1.6, 1.2        # rib height (z) and how far it stands off the wall
GROOVE_W, GROOVE_D = 1.2, 0.8      # engraved lines on the lid room face
BASE_R = 8.0          # base room-side and bottom corners
BASE_EDGE_R = 3.0     # base top front edge


# ---------------------------------------------------------------- profile helpers
def rrect(x0, x1, z0, z1, r_top, r_bot):
    """2D rounded rectangle in the workplane (u = x, v = z), returned as a Workplane wire"""
    w = (cq.Workplane("XY").moveTo(x0 + r_bot, z0).lineTo(x1 - r_bot, z0))
    w = w.threePointArc((x1 - r_bot + r_bot * math.sin(math.pi / 4), z0 + r_bot - r_bot * math.cos(math.pi / 4)),
                        (x1, z0 + r_bot)) if r_bot > 0 else w
    w = w.lineTo(x1, z1 - r_top)
    w = w.threePointArc((x1 - r_top + r_top * math.cos(math.pi / 4), z1 - r_top + r_top * math.sin(math.pi / 4)),
                        (x1 - r_top, z1)) if r_top > 0 else w
    w = w.lineTo(x0 + r_top, z1)
    w = w.threePointArc((x0 + r_top - r_top * math.cos(math.pi / 4), z1 - r_top + r_top * math.sin(math.pi / 4)),
                        (x0, z1 - r_top)) if r_top > 0 else w
    w = w.lineTo(x0, z0 + r_bot)
    w = w.threePointArc((x0 + r_bot - r_bot * math.sin(math.pi / 4), z0 + r_bot - r_bot * math.cos(math.pi / 4)),
                        (x0 + r_bot, z0)) if r_bot > 0 else w
    return w.close()


def prism_xz(x0, x1, z0, z1, r_top, r_bot, y0, y1):
    """rounded rectangle in the XZ plane, extruded from y0 to y1"""
    s = rrect(x0, x1, z0, z1, r_top, r_bot).extrude(y1 - y0).val()
    s = s.rotate(V(0, 0, 0), V(1, 0, 0), 90)          # (x, y, z) -> (x, -z, y): profile v -> z, extrusion -> -y
    return s.translate(V(0, y1, 0))


def prism_xy(x0, x1, y0, y1, r_far, r_near, z0, z1):
    """rounded rectangle in XY (r_far at y1 corners, r_near at y0 corners), extruded z0..z1"""
    s = rrect(x0, x1, y0, y1, r_far, r_near).extrude(z1 - z0).val()
    return s.translate(V(0, 0, z0))


def prism_yz(y0, y1, z0, z1, r_top_far, z_ext_x):
    """profile in YZ with only the (y1, z1) corner rounded, extruded over x = -z_ext_x..z_ext_x"""
    r = r_top_far
    w = (cq.Workplane("XY").moveTo(y0, z0).lineTo(y1, z0).lineTo(y1, z1 - r)
         .threePointArc((y1 - r + r * math.cos(math.pi / 4), z1 - r + r * math.sin(math.pi / 4)), (y1 - r, z1))
         .lineTo(y0, z1).close())
    s = w.extrude(2 * z_ext_x).val()
    # (u, v, w) = (y, z, x): map u->y, v->z, w->x
    s = s.rotate(V(0, 0, 0), V(1, 0, 0), 90).rotate(V(0, 0, 0), V(0, 0, 1), 90).translate(V(-z_ext_x, 0, 0))
    return s


# ---------------------------------------------------------------- hood
def make_hood():
    xo = HOOD_IN_W / 2 + WALL
    z_top = HOOD_IN_H + WALL
    outer = prism_xz(-xo, xo, -FLOOR_T, z_top, R_TOP, R_BOT, 0, HOOD_IN_D)
    flange = prism_xz(-xo - FLANGE, xo + FLANGE, -FLOOR_T, z_top + FLANGE, R_TOP + FLANGE, R_BOT,
                      0, FLANGE_T)
    inner = prism_xz(-HOOD_IN_W / 2, HOOD_IN_W / 2, 0, HOOD_IN_H, R_TOP - WALL, 0, -1, HOOD_IN_D + 1)
    h = C(U(outer, flange), inner)
    adds = []
    for (x, z) in hood_corner_bosses():
        adds.append(cyl(3.5, (x, HOOD_IN_D - 12, z), (0, 1, 0), 12))
        adds.append(box(min(x, math.copysign(HOOD_IN_W / 2, x)), max(x, math.copysign(HOOD_IN_W / 2, x)),
                        HOOD_IN_D - 12, HOOD_IN_D,
                        min(z, 0 if z < HOOD_IN_H / 2 else HOOD_IN_H), max(z, 0 if z < HOOD_IN_H / 2 else HOOD_IN_H)))
    adds.append(cyl(PIVOT_PIN_D / 2, (0, AXIS_Y, 0), (0, 0, 1), YOKE_T - 0.5))
    # speed-line ribs on both side walls, starting at the flange
    for sx in (-1, 1):
        for z, y_end in zip(SPEED_Z, SPEED_END_Y):
            x0, x1 = sorted((sx * (xo - 0.3), sx * (xo + SPEED_H)))
            rib = box(x0, x1, FLANGE_T - 0.01, y_end, z - SPEED_W / 2, z + SPEED_W / 2)
            end = cyl(SPEED_W / 2, (x0, y_end, z), (1, 0, 0), x1 - x0)
            adds += [rib, end]
    if FIN:
        y_a, y_b = 8.0, HOOD_IN_D - 0.5
        fin = (cq.Workplane("XY").polyline([(y_a, z_top - 0.5), (y_b, z_top - 0.5), (y_b, z_top + FIN_H),
                                            (y_b - 7, z_top + FIN_H)]).close().extrude(FIN_T).val())
        fin = fin.rotate(V(0, 0, 0), V(1, 0, 0), 90).rotate(V(0, 0, 0), V(0, 0, 1), 90).translate(V(-FIN_T / 2, 0, 0))
        adds.append(fin)
    h = U(h, *adds)
    cuts = []
    for (x, z) in hood_corner_bosses():
        cuts.append(cyl(M3_TAP / 2, (x, HOOD_IN_D + 1, z), (0, -1, 0), 11))
    for sx in (-1, 1):
        cuts.append(U(cyl(M3_CLEAR / 2, (sx * MOUNT_X, SLOT_Y[0], -FLOOR_T - 1), (0, 0, 1), FLOOR_T + 2),
                      cyl(M3_CLEAR / 2, (sx * MOUNT_X, SLOT_Y[1], -FLOOR_T - 1), (0, 0, 1), FLOOR_T + 2),
                      box(sx * MOUNT_X - M3_CLEAR / 2, sx * MOUNT_X + M3_CLEAR / 2, SLOT_Y[0], SLOT_Y[1],
                          -FLOOR_T - 1, 1)))
    lock = (0, AXIS_Y + LOCK_R)
    cuts.append(cyl(M3_CLEAR / 2, (lock[0], lock[1], -FLOOR_T - 1), (0, 0, 1), FLOOR_T + 2))
    cuts.append(hexprism(M3_NUT_AF, V(lock[0], lock[1], -FLOOR_T - 0.01), M3_NUT_H + 0.01))
    return C(h, *cuts)


# ---------------------------------------------------------------- screen lid
def groove_line(x_a, x_b, z, y_face):
    """engraved horizontal line with round ends on a face at y = y_face (room side)"""
    x0, x1 = sorted((x_a, x_b))
    return U(box(x0, x1, y_face - GROOVE_D, y_face + 1, z - GROOVE_W / 2, z + GROOVE_W / 2),
             cyl(GROOVE_W / 2, (x0, y_face - GROOVE_D, z), (0, 1, 0), GROOVE_D + 1),
             cyl(GROOVE_W / 2, (x1, y_face - GROOVE_D, z), (0, 1, 0), GROOVE_D + 1))


def groove_ring(r, zc, y_face):
    return C(cyl(r + GROOVE_W / 2, (0, y_face - GROOVE_D, zc), (0, 1, 0), GROOVE_D + 1),
             cyl(r - GROOVE_W / 2, (0, y_face - GROOVE_D - 1, zc), (0, 1, 0), GROOVE_D + 3))


def make_lid():
    xo = HOOD_IN_W / 2 + WALL
    y0, y1 = HOOD_IN_D, HOOD_IN_D + LID_T
    plate = prism_xz(-xo, xo, -FLOOR_T, HOOD_IN_H + WALL, R_TOP, R_BOT, y0, y1)
    zc = DISP_CENTER_Z
    rim = C(disp_outline(zc, 1.8, y0 - DISP_STACK, y0 + 0.01), disp_outline(zc, 0.3, y0 - DISP_STACK - 1, y0 + 1))
    rim = C(rim, box(-DISP_TAB_W / 2 - 3, DISP_TAB_W / 2 + 3, y0 - DISP_STACK - 1, y0 + 1,
                     zc - DISP_PCB_D / 2 - DISP_TAB_H - 4, zc - DISP_PCB_D / 2 - 2))
    ret_x = DISP_PCB_D / 2 + 4.5
    bosses = [cyl(3.2, (sx * ret_x, y0 + 0.01, zc), (0, -1, 0), DISP_STACK + 0.01) for sx in (-1, 1)]
    l = U(plate, rim, *bosses)
    cuts = [cyl(DISP_VIEW_D / 2, (0, y0 - 10, zc), (0, 1, 0), 20)]
    # porthole: deep 45 degree bevel plus two engraved rings
    cuts.append(cq.Solid.makeCone(DISP_VIEW_D / 2, DISP_VIEW_D / 2 + 2.0, 2.0, V(0, y1 - 2.0, zc), V(0, 1, 0)))
    cuts.append(cq.Solid.makeCylinder(DISP_VIEW_D / 2 + 2.0, 1, V(0, y1, zc), V(0, 1, 0)))
    cuts += [groove_ring(20.8, zc, y1), groove_ring(22.8, zc, y1)]
    # speed-line wings either side of the porthole
    for sx in (-1, 1):
        for dz, x_end in ((-4.0, 35.5), (0.0, 32.5), (4.0, 29.5)):
            cuts.append(groove_line(sx * 25.0, sx * x_end, zc + dz, y1))
    cuts += [cyl(M2_TAP / 2, (sx * ret_x, y0 - DISP_STACK - 1, zc), (0, 1, 0), DISP_STACK + 2.5) for sx in (-1, 1)]
    for (x, z) in hood_corner_bosses():
        cuts.append(countersink((x, y1, z), direction=(0, -1, 0), depth=6))
    cuts.append(box(-12, 12, y0 - 1, y1 + 1, -FLOOR_T - 1, 4.0))  # 4 mm above the floor: camera ribbon + display wires
    return C(l, *cuts)


# ---------------------------------------------------------------- base and Pi plate
def make_base():
    y_face = MULLION_DEPTH + BASE_WALL_T
    pi_top_z = BASE_TOP_T - PI_TOP_BELOW_SURFACE
    wall_bottom = pi_top_z - PI_H - 4
    top = box(-BASE_LEN / 2, BASE_LEN / 2, 0, y_face, 0, BASE_TOP_T)
    wall = box(-BASE_LEN / 2, BASE_LEN / 2, MULLION_DEPTH, y_face, wall_bottom, BASE_TOP_T)
    shell = U(top, wall)
    if REAR_LIP_H > 0:
        shell = U(shell, box(-BASE_LEN / 2, BASE_LEN / 2, 0, 3, -REAR_LIP_H, 0))
    lo = wall_bottom - REAR_LIP_H - 1
    shell = shell.intersect(prism_xy(-BASE_LEN / 2, BASE_LEN / 2, 0, y_face, BASE_R, 0, lo, BASE_TOP_T + 1))
    shell = shell.intersect(prism_xz(-BASE_LEN / 2, BASE_LEN / 2, wall_bottom, BASE_TOP_T + 1, 0, BASE_R,
                                     -1, y_face + 1))
    shell = shell.intersect(prism_yz(-1, y_face, lo, BASE_TOP_T, BASE_EDGE_R, BASE_LEN))
    bosses, holes = pi_standoffs(y_face, pi_top_z, -PI_W / 2)
    b = U(shell, *bosses)
    cuts = list(holes)
    for sx in (-1, 1):
        cuts.append(cyl(M3_CLEAR / 2, (sx * MOUNT_X, MOUNT_Y, -1), (0, 0, 1), BASE_TOP_T + 2))
        cuts.append(hexprism(M3_NUT_AF, V(sx * MOUNT_X, MOUNT_Y, -0.01), M3_NUT_H + 0.01))
    win_top = -MULLION_FACE_H - 2
    if wall_bottom + 6 < win_top:
        wx = (-30, 12) if not PORTS_ON_ROOM_RIGHT else (-12, 30)
        cuts.append(box(wx[0], wx[1], MULLION_DEPTH - 1, y_face + 1, wall_bottom + 6, win_top))
    return C(b, *cuts)


_orig_pi_plate = W.make_pi_plate


def make_pi_plate():
    p = _orig_pi_plate()
    Wd, Hd = PI_W + 8, PI_H + 8
    return p.intersect(prism_xz(-Wd / 2, Wd / 2, -Hd / 2, Hd / 2, 6.0, 6.0, -10, 20)).clean()


# swap the restyled parts into the original module so its build_all / assembly helpers use them
W.make_hood, W.make_lid, W.make_base, W.make_pi_plate = make_hood, make_lid, make_base, make_pi_plate


if __name__ == "__main__":
    out = os.path.dirname(HERE)
    for d in ("step", "stl"):
        os.makedirs(os.path.join(out, d), exist_ok=True)
    parts = W.build_all()
    for name, s in parts.items():
        cq.exporters.export(cq.Workplane().add(s), os.path.join(out, "step", name + ".step"))
        p = W.to_print(name, s)
        cq.exporters.export(cq.Workplane().add(p), os.path.join(out, "stl", name + ".stl"),
                            tolerance=0.02, angularTolerance=0.1)
        bb = p.BoundingBox()
        print(f"{name:16s} print size {bb.xlen:6.1f} x {bb.ylen:6.1f} x {bb.zlen:6.1f} mm  valid={s.isValid()}  solids={len(s.Solids())}")
    asm = cq.Assembly(name="wth_window_mount_v2_retro")
    asm.add(parts["base_pi_mount"], name="base_pi_mount", color=cq.Color(0x82 / 255, 0xA2 / 255, 0x67 / 255))
    asm.add(W.hood_to_base(parts["hood"]), name="hood", color=cq.Color(0x1A / 255, 0x1A / 255, 0x1A / 255))
    asm.add(W.hood_to_base(W.place_yoke(parts["camera_yoke"])), name="camera_yoke", color=cq.Color(0.9, 0.57, 0.22))
    asm.add(W.hood_to_base(W.place_on_axis(parts["camera_cradle"])), name="camera_cradle", color=cq.Color(0.95, 0.76, 0.2))
    asm.add(W.hood_to_base(parts["screen_lid"]), name="screen_lid", color=cq.Color(0x1A / 255, 0x1A / 255, 0x1A / 255))
    asm.add(W.hood_to_base(parts["screen_retainer"]), name="screen_retainer", color=cq.Color(0.9, 0.57, 0.22))
    asm.export(os.path.join(out, "step", "assembly_all_parts.step"))
    print("assembly written")
