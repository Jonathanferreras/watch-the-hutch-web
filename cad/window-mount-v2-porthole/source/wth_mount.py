"""
Watch The Hutch - window mount v2, retro-futuristic styling (parametric, CadQuery)

Parts (all fit the FlashForge Finder v1 140 x 140 x 140 mm volume):
  base_pi_mount     mullion cap (same idea as v1.0) with a new Pi 5 mount on the room face
  pi5_plate         stand-alone Pi 5 plate, to screw/glue onto the existing v1.0 base instead
  hood              light-tight box that sits on the base and seals against the glass
  camera_yoke       pan stage (rotates on a pin in the hood floor, locked by an arc slot)
  camera_cradle     tilt stage holding the Camera Module 3 NoIR
  screen_lid        back panel of the hood, holds the 1.28" round GC9A01 display
  screen_retainer   bar that clamps the display into the lid
  porthole_bezel    riveted ring around the display (glue/peg onto the lid)

Coordinates: x = along the mullion, y = from the glass toward the room, z = up.
Run:  python3 wth_mount.py   (writes ../step, ../stl, ../previews)
"""
import math
import os
import cadquery as cq
from cadquery import Vector as V

# ---------------------------------------------------------------- parameters
# Window mullion (measure yours: top depth from glass bead to room face, and face height)
MULLION_DEPTH = 45.0      # y, glass-side edge of base to room face of mullion
MULLION_FACE_H = 44.0     # z, height of the mullion's room-facing face (from photo estimate)
BASE_LEN = 100.0          # x, length of the cap along the mullion
BASE_TOP_T = 5.0          # thickness of the top plate (holds captive M3 nuts)
BASE_WALL_T = 4.0         # thickness of the front wall the Pi mounts to
REAR_LIP_H = 0.0          # optional lip hanging down at the glass side (0 = none)

# Raspberry Pi 5
PI_W, PI_H = 85.0, 56.0   # board, ports (USB/Ethernet) on the +x end, GPIO along the top
PI_HOLE_X = (3.5, 61.5)   # from the left (non-port) edge
PI_HOLE_Y = (3.5, 52.5)   # from the top edge
PI_STANDOFF_H = 5.0
PI_TAP_D = 2.2            # pilot for M2.5 screw tapping into plastic (2.5 if using heat-set... see README)
PI_TOP_BELOW_SURFACE = 2.0  # Pi top edge sits this far below the base top surface
PORTS_ON_ROOM_RIGHT = True  # USB/Ethernet on the right when you face the window (as in IMG_7020)

# Camera Module 3 (same footprint as v2): 25 x 24 board, holes 21 x 12.5
CAM_W, CAM_H = 25.0, 24.0
CAM_HOLES_X = 10.5        # +/- from centre
CAM_HOLES_FROM_TOP = (2.0, 14.5)
CAM_TAP_D = 1.7           # pilot for M2 self-tapping screws
CAM_STANDOFF_H = 4.0

# Round display (1.28" GC9A01 module), measured from Jonny's own model of it
DISP_PCB_D = 38.0         # diameter of the round part of the PCB (measured from Jonny's model)
DISP_VIEW_D = 33.0        # window in the lid (glass is ~35.6, active area 32.4)
DISP_TAB_W = 23.0         # width of the pin tab below the circle
DISP_TAB_H = 9.5          # how far the tab sticks out below the circle
DISP_STACK = 3.6          # glass 2.0 + PCB 1.6 (retainer clamps at this height)
DISP_CENTER_Z = 36.0      # display centre above the hood floor

# Hood
WALL = 2.5
FLOOR_T = 4.0
HOOD_IN_W = 74.0
HOOD_IN_H = 58.0
HOOD_IN_D = 50.0
FLANGE = 4.0              # gasket flange around the glass opening (top + sides)
FLANGE_T = 2.5
LID_T = 3.0

# Retro styling (none of these change fits or screw positions)
HOOD_R_TOP = 12.0         # rounded "cabinet" top corners (seen from the room)
HOOD_R_BOT = 3.0
FRAME_D = 6.0             # walls run past the lid so the screen sits in a recessed CRT-style frame
LID_LEDGE = 1.0           # step the lid seats against (keeps room light out)
STRIPE_ZS = (16.0, 21.0, 26.0)   # speed-line ribs on the hood sides
STRIPE_R = 1.0
BEZEL_OUT_R = 22.0
BEZEL_H = 3.0
RIVETS = 8
BEZEL_DOWEL_R = 19.25     # 3 dowels cut from 1.75 mm filament locate the bezel on the lid
DOWEL_HOLE_D = 1.9
BASE_SKIRT = 8.0          # extra wall below the Pi for the speed-line ribs
BASE_CORNER_R = 10.0

# Pan / tilt
AXIS_Y = 26.0             # tilt axis distance from the glass
AXIS_Z = HOOD_IN_H / 2    # tilt axis height above hood floor
PIVOT_PIN_D = 7.8
YOKE_R = 21.0
YOKE_T = 4.0
LOCK_R = 14.0             # pan lock arc-slot radius
PAN_RANGE = 25.0          # +/- degrees
ARM_X0, ARM_X1 = 15.0, 18.0
ARM_HALF_D = 5.0
CRADLE_HALF_W = 14.5
CRADLE_HALF_H = 14.0

# Hood-to-base fasteners
MOUNT_X = 31.0            # +/- x of the two M3 bolts
MOUNT_Y = 15.0            # nut position in the base (from glass edge)
SLOT_Y = (8.0, 22.0)      # slot in hood floor; hood can slide +/-7 mm toward/away from glass

M3_CLEAR = 3.4
M3_TAP = 2.6
M3_NUT_AF = 5.8           # 5.5 nut + clearance
M3_NUT_H = 2.6
M2_CLEAR = 2.4
M2_TAP = 1.7

# ---------------------------------------------------------------- helpers
def box(x0, x1, y0, y1, z0, z1):
    return cq.Solid.makeBox(x1 - x0, y1 - y0, z1 - z0, V(x0, y0, z0))


def cyl(r, p0, direction, length):
    return cq.Solid.makeCylinder(r, length, V(*p0), V(*direction))


def hexprism(af, p0, h, direction=(0, 0, 1)):
    w = cq.Workplane(cq.Plane(origin=p0, xDir=_perp(direction), normal=direction))
    return w.polygon(6, af / math.cos(math.radians(30))).extrude(h).val()


def _perp(d):
    d = V(*d)
    return (V(1, 0, 0) if abs(d.x) < 0.9 else V(0, 1, 0)).cross(d).normalized()


def countersink(p_top, d_head=6.4, d_hole=M3_CLEAR, depth=20, direction=(0, 0, -1)):
    """cone + hole going in `direction` from the surface point p_top"""
    dv = V(*direction)
    cone = cq.Solid.makeCone(d_head / 2, d_hole / 2, (d_head - d_hole) / 2,
                             V(*p_top), dv)
    return cone.fuse(cyl(d_hole / 2, p_top, direction, depth))


def U(*shapes):
    s = shapes[0]
    for o in shapes[1:]:
        s = s.fuse(o)
    return s.clean()


def C(base, *shapes):
    for o in shapes:
        base = base.cut(o)
    return base.clean()


def arc_slot(r, width, a_center, a_half, z0, h, cx=0, cy=0):
    """slot along an arc around (cx, cy), angles in degrees from +y toward +x"""
    pts_o, pts_i = [], []
    n = 24
    for i in range(n + 1):
        a = math.radians(a_center - a_half + 2 * a_half * i / n)
        pts_o.append((cx + (r + width / 2) * math.sin(a), cy + (r + width / 2) * math.cos(a)))
        pts_i.append((cx + (r - width / 2) * math.sin(a), cy + (r - width / 2) * math.cos(a)))
    poly = pts_o + pts_i[::-1]
    body = cq.Workplane("XY").workplane(offset=z0).polyline(poly).close().extrude(h).val()
    ends = []
    for a in (a_center - a_half, a_center + a_half):
        a = math.radians(a)
        ends.append(cyl(width / 2, (cx + r * math.sin(a), cy + r * math.cos(a), z0), (0, 0, 1), h))
    return U(body, *ends)


def rr_prism(hw, z0, z1, rt, rb, y0, y1):
    """prism along y with a rounded-rectangle (x, z) section; rt/rb = top/bottom corner radii"""
    wp = cq.Workplane(cq.Plane(origin=(0, y1, 0), xDir=(1, 0, 0), normal=(0, -1, 0)))
    c45 = math.cos(math.radians(45))
    w = wp.moveTo(-hw + rb, z0).lineTo(hw - rb, z0)
    if rb > 0:
        w = w.threePointArc((hw - rb + rb * c45, z0 + rb - rb * c45), (hw, z0 + rb))
    w = w.lineTo(hw, z1 - rt)
    if rt > 0:
        w = w.threePointArc((hw - rt + rt * c45, z1 - rt + rt * c45), (hw - rt, z1))
    w = w.lineTo(-hw + rt, z1)
    if rt > 0:
        w = w.threePointArc((-hw + rt - rt * c45, z1 - rt + rt * c45), (-hw, z1 - rt))
    w = w.lineTo(-hw, z0 + rb)
    if rb > 0:
        w = w.threePointArc((-hw + rb - rb * c45, z0 + rb - rb * c45), (-hw + rb, z0))
    return w.close().extrude(y1 - y0).val()


def rib(p0, p1, r):
    """half-round speed-line rib between two points, with domed ends"""
    a, b = V(*p0), V(*p1)
    d = b - a
    return U(cq.Solid.makeCylinder(r, d.Length, a, d.normalized()),
             cq.Solid.makeSphere(r, a, angleDegrees1=-90, angleDegrees2=90),
             cq.Solid.makeSphere(r, b, angleDegrees1=-90, angleDegrees2=90))


def pi_standoffs(face_y, top_z, x_left):
    """Pi 5 bosses on a wall whose room face is at y=face_y. Returns (bosses, holes)."""
    bosses, holes = [], []
    for hx in PI_HOLE_X:
        for hy in PI_HOLE_Y:
            x, z = x_left + hx, top_z - hy
            if PORTS_ON_ROOM_RIGHT:  # viewed from the room, +x is on the left
                x = -x
            bosses.append(cyl(3.2, (x, face_y, z), (0, 1, 0), PI_STANDOFF_H))
            holes.append(cyl(PI_TAP_D / 2, (x, face_y + PI_STANDOFF_H, z), (0, -1, 0), PI_STANDOFF_H + 3.5))
    return bosses, holes


# ---------------------------------------------------------------- base with Pi mount
def make_base():
    y_face = MULLION_DEPTH + BASE_WALL_T
    top = box(-BASE_LEN / 2, BASE_LEN / 2, 0, y_face, 0, BASE_TOP_T)
    pi_top_z = BASE_TOP_T - PI_TOP_BELOW_SURFACE
    wall_bottom = pi_top_z - PI_H - 4 - BASE_SKIRT
    wall = rr_prism(BASE_LEN / 2, wall_bottom, BASE_TOP_T, 0, BASE_CORNER_R, MULLION_DEPTH, y_face)
    ribs = [rib((-BASE_LEN / 2 + BASE_CORNER_R + 2 + i * 6, y_face, wall_bottom + 2.5 + i * 2.6),
                (BASE_LEN / 2 - BASE_CORNER_R - 2 - i * 6, y_face, wall_bottom + 2.5 + i * 2.6), STRIPE_R * 0.9)
            for i in range(3)]
    parts = [top, wall, *ribs]
    if REAR_LIP_H > 0:
        parts.append(box(-BASE_LEN / 2, BASE_LEN / 2, 0, 3, -REAR_LIP_H, 0))
    # stiffening gussets at the ends, inside the corner (sit beside the mullion? no: above it).
    x_left = -PI_W / 2
    bosses, holes = pi_standoffs(y_face, pi_top_z, x_left)
    b = U(*parts, *bosses)
    cuts = list(holes)
    # captive nuts for the hood bolts, inserted from underneath before fitting on the mullion
    for sx in (-1, 1):
        cuts.append(cyl(M3_CLEAR / 2, (sx * MOUNT_X, MOUNT_Y, -1), (0, 0, 1), BASE_TOP_T + 2))
        cuts.append(hexprism(M3_NUT_AF, V(sx * MOUNT_X, MOUNT_Y, -0.01), M3_NUT_H + 0.01))
    return C(b, *cuts)


# ---------------------------------------------------------------- stand-alone Pi plate
def make_pi_plate():
    W, H, T = PI_W + 8, PI_H + 8, 4.0
    plate = box(-W / 2, W / 2, -T, 0, -H / 2, H / 2)
    bosses, holes = pi_standoffs(0, PI_H / 2, -PI_W / 2)
    p = U(plate, *bosses)
    cuts = list(holes)
    # 4 countersunk M3 holes in the plate margin, between the Pi holes, to fix it to the v1 base
    for x in (-W / 2 + 4.5, W / 2 - 4.5):
        for z in (-H / 2 + 4.5, H / 2 - 4.5):
            cuts.append(countersink((x, 0, z), direction=(0, -1, 0), depth=10))
    wx = (-28, 14) if not PORTS_ON_ROOM_RIGHT else (-14, 28)
    cuts.append(box(wx[0], wx[1], -T - 1, 1, -18, 18))  # lightening window
    return C(p, *cuts)


# ---------------------------------------------------------------- hood
def hood_corner_bosses():
    """(x, z, boss radius) of the four lid screws"""
    xb, zt = HOOD_IN_W / 2 - 3.5, HOOD_IN_H - 3.5
    xt = HOOD_IN_W / 2 - (HOOD_R_TOP - WALL) * 0.42 - 1.5   # tucked into the rounded top corners
    zt = HOOD_IN_H - (HOOD_R_TOP - WALL) * 0.42 - 1.5
    return [(sx * xb, 3.5, 3.5) for sx in (-1, 1)] + [(sx * xt, zt, 4.5) for sx in (-1, 1)]


def hood_outer(y0, y1, grow=0.0):
    xo = HOOD_IN_W / 2 + WALL + grow
    return rr_prism(xo, -FLOOR_T, HOOD_IN_H + WALL + grow, HOOD_R_TOP + grow, HOOD_R_BOT, y0, y1)


def hood_cavity(y0, y1, grow=0.0):
    return rr_prism(HOOD_IN_W / 2 + grow, -grow, HOOD_IN_H + grow, HOOD_R_TOP - WALL + grow, 0, y0, y1)


def make_hood():
    y_back = HOOD_IN_D + FRAME_D
    outer = hood_outer(0, y_back)
    flange = rr_prism(HOOD_IN_W / 2 + WALL + FLANGE, -FLOOR_T, HOOD_IN_H + WALL + FLANGE,
                      HOOD_R_TOP + FLANGE, HOOD_R_BOT, 0, FLANGE_T)
    # lid screw bosses (+ webs into the corner), kept inside the cabinet outline
    keep = []
    for (x, z, r) in hood_corner_bosses():
        sx, sz = math.copysign(1, x), (1 if z > HOOD_IN_H / 2 else -1)
        keep.append(cyl(r, (x, HOOD_IN_D - 12, z), (0, 1, 0), 12))
        cx, cz = sx * (HOOD_IN_W / 2 + 1), (HOOD_IN_H + 1 if sz > 0 else -1)
        keep.append(box(min(x, cx), max(x, cx), HOOD_IN_D - 12, HOOD_IN_D, min(z, cz), max(z, cz)))
    keep.append(cyl(PIVOT_PIN_D / 2, (0, AXIS_Y, -0.5), (0, 0, 1), YOKE_T))
    cavity = C(hood_cavity(-1, HOOD_IN_D), *keep)
    frame = hood_cavity(HOOD_IN_D - 0.01, y_back + 1, grow=LID_LEDGE)
    h = C(U(outer, flange), cavity, frame)
    # speed-line ribs along both sides
    xo = HOOD_IN_W / 2 + WALL
    ribs = [rib((sx * xo, FLANGE_T + 4, z), (sx * xo, y_back - 4 - i * 6, z), STRIPE_R)
            for sx in (-1, 1) for i, z in enumerate(STRIPE_ZS)]
    h = U(h, *ribs)
    cuts = []
    for (x, z, r) in hood_corner_bosses():
        cuts.append(cyl(M3_TAP / 2, (x, HOOD_IN_D + 1, z), (0, -1, 0), 11))
    for sx in (-1, 1):
        cuts.append(U(cyl(M3_CLEAR / 2, (sx * MOUNT_X, SLOT_Y[0], -FLOOR_T - 1), (0, 0, 1), FLOOR_T + 2),
                      cyl(M3_CLEAR / 2, (sx * MOUNT_X, SLOT_Y[1], -FLOOR_T - 1), (0, 0, 1), FLOOR_T + 2),
                      box(sx * MOUNT_X - M3_CLEAR / 2, sx * MOUNT_X + M3_CLEAR / 2, SLOT_Y[0], SLOT_Y[1],
                          -FLOOR_T - 1, 1)))
    # pan-lock nut, trapped in the floor underside
    lock = (0, AXIS_Y + LOCK_R)
    cuts.append(cyl(M3_CLEAR / 2, (lock[0], lock[1], -FLOOR_T - 1), (0, 0, 1), FLOOR_T + 2))
    cuts.append(hexprism(M3_NUT_AF, V(lock[0], lock[1], -FLOOR_T - 0.01), M3_NUT_H + 0.01))
    # cable exit through the bottom of the frame, lined up with the lid notch
    cuts.append(box(-12, 12, HOOD_IN_D - 0.5, y_back + 1, -FLOOR_T - 1, 0))
    return C(h, *cuts)


# ---------------------------------------------------------------- pan yoke (local: axis at origin)
def make_yoke():
    z_disc = -AXIS_Z
    disc = cyl(YOKE_R, (0, 0, z_disc), (0, 0, 1), YOKE_T)
    arms = []
    for sx in (-1, 1):
        x0, x1 = sorted((sx * ARM_X0, sx * ARM_X1))
        arms.append(box(x0, x1, -ARM_HALF_D, ARM_HALF_D, z_disc + YOKE_T - 0.01, 0))
        arms.append(cyl(ARM_HALF_D, (x0, 0, 0), (1, 0, 0), x1 - x0))
    y = U(disc, *arms)
    # gussets: triangular ribs on the outside of each arm
    for sx in (-1, 1):
        x_out = sx * ARM_X1
        rib = (cq.Workplane("XZ").polyline([(x_out, z_disc + YOKE_T), (x_out + sx * 3, z_disc + YOKE_T),
                                            (x_out, z_disc + YOKE_T + 10)]).close()
               .extrude(1.5, both=True).val())
        y = y.fuse(rib)
    cuts = [cyl(PIVOT_PIN_D / 2 + 0.25, (0, 0, z_disc - 1), (0, 0, 1), YOKE_T + 2),
            arc_slot(LOCK_R, M3_CLEAR, 0, PAN_RANGE, z_disc - 1, YOKE_T + 2)]
    for sx in (-1, 1):
        cuts.append(cyl(M3_CLEAR / 2, (sx * (ARM_X1 + 1), 0, 0), (-sx, 0, 0), ARM_X1 - ARM_X0 + 2))
    # opening in the disc under the camera so the ribbon can pass
    return C(y.clean(), *cuts)


# ---------------------------------------------------------------- tilt cradle (local: axis at origin)
PLATE_Y0, PLATE_Y1 = -6.0, -3.0          # plate (front face toward glass at -6)
CAM_BOARD_Z = 2.0                         # camera board centre above axis


def cam_holes():
    top = CAM_BOARD_Z + CAM_H / 2
    return [(sx * CAM_HOLES_X, top - d) for sx in (-1, 1) for d in CAM_HOLES_FROM_TOP]


def make_cradle():
    plate = box(-CRADLE_HALF_W, CRADLE_HALF_W, PLATE_Y0, PLATE_Y1, -CRADLE_HALF_H, CRADLE_HALF_H)
    cheeks = []
    for sx in (-1, 1):
        x0, x1 = sorted((sx * (CRADLE_HALF_W - 4), sx * CRADLE_HALF_W))
        cheeks.append(box(x0, x1, PLATE_Y1 - 0.01, 2.0, -8, 8))
        cheeks.append(cyl(8, (x0, 2.0, 0), (1, 0, 0), x1 - x0).cut(box(x0 - 1, x1 + 1, -20, 2.0, -20, 20)))
        # make cheek 10 mm deep total with rounded back
    standoffs = [cyl(2.5, (x, PLATE_Y0, z), (0, -1, 0), CAM_STANDOFF_H) for (x, z) in cam_holes()]
    c = U(plate, *cheeks, *standoffs)
    cuts = [cyl(CAM_TAP_D / 2, (x, PLATE_Y0 - CAM_STANDOFF_H - 1, z), (0, 1, 0), CAM_STANDOFF_H + 4)
            for (x, z) in cam_holes()]
    # ribbon connector + cable clearance at the bottom of the plate
    cuts.append(box(-9.5, 9.5, PLATE_Y0 - 1, PLATE_Y1 + 1, -CRADLE_HALF_H - 1, CAM_BOARD_Z - CAM_H / 2 + 6))
    for sx in (-1, 1):
        cuts.append(cyl(M3_TAP / 2, (sx * (CRADLE_HALF_W + 1), 0, 0), (-sx, 0, 0), 9))
    return C(c, *cuts)


def camera_dummy():
    """rough Camera Module 3 envelope for clearance checks / renders (not printed)"""
    top = CAM_BOARD_Z + CAM_H / 2
    y_b = PLATE_Y0 - CAM_STANDOFF_H
    board = box(-CAM_W / 2, CAM_W / 2, y_b - 1.0, y_b, top - CAM_H, top)
    lens_z = top - 9.5
    lens = U(box(-4.25, 4.25, y_b - 6, y_b - 1.0, lens_z - 4.25, lens_z + 4.25),
             cyl(3.5, (0, y_b - 6, lens_z), (0, -1, 0), 4.5))
    return U(board, lens)


# ---------------------------------------------------------------- screen lid + retainer
def lid_xz():
    xo = HOOD_IN_W / 2 + WALL
    return xo


def disp_outline(z_c, grow, y0, y1):
    circ = cyl(DISP_PCB_D / 2 + grow, (0, y0, z_c), (0, 1, 0), y1 - y0)
    tab = box(-DISP_TAB_W / 2 - grow, DISP_TAB_W / 2 + grow, y0, y1,
              z_c - DISP_PCB_D / 2 - DISP_TAB_H - grow, z_c)
    return U(circ, tab)


def make_lid():
    """Lid in hood coordinates: y = HOOD_IN_D .. HOOD_IN_D + LID_T, recessed inside the hood frame."""
    y0, y1 = HOOD_IN_D, HOOD_IN_D + LID_T
    plate = hood_cavity(y0, y1, grow=LID_LEDGE - 0.25)
    zc = DISP_CENTER_Z
    # locating rim around the display PCB on the inner face
    rim = C(disp_outline(zc, 1.8, y0 - DISP_STACK, y0 + 0.01), disp_outline(zc, 0.3, y0 - DISP_STACK - 1, y0 + 1))
    # the rim is open at the bottom of the tab so the header/wires can leave
    rim = C(rim, box(-DISP_TAB_W / 2 - 3, DISP_TAB_W / 2 + 3, y0 - DISP_STACK - 1, y0 + 1,
                     zc - DISP_PCB_D / 2 - DISP_TAB_H - 4, zc - DISP_PCB_D / 2 - 2))
    ret_x = DISP_PCB_D / 2 + 4.5
    bosses = [cyl(3.2, (sx * ret_x, y0 + 0.01, zc), (0, -1, 0), DISP_STACK + 0.01) for sx in (-1, 1)]
    l = U(plate, rim, *bosses)
    cuts = [cyl(DISP_VIEW_D / 2, (0, y0 - 10, zc), (0, 1, 0), 20)]
    cuts += [cyl(M2_TAP / 2, (sx * ret_x, y0 - DISP_STACK - 1, zc), (0, 1, 0), DISP_STACK + 2.5) for sx in (-1, 1)]
    for (x, z, r) in hood_corner_bosses():
        cuts.append(countersink((x, y1, z), direction=(0, -1, 0), depth=6))
    # cable exit (camera ribbon + display wires): seal with black tape/foam after routing
    cuts.append(box(-12, 12, y0 - 1, y1 + 1, -FLOOR_T - 1, 4.0))
    # peg holes for the porthole bezel
    for a in bezel_peg_angles():
        cuts.append(cyl(DOWEL_HOLE_D / 2, (BEZEL_DOWEL_R * math.cos(a), y1 + 1, zc - BEZEL_DOWEL_R * math.sin(a)),
                        (0, -1, 0), 3.2))
    # decorative grille: blind horizontal slots either side of the porthole (not through, stays light-tight)
    for sx in (-1, 1):
        for i in range(6):
            z = 19 + i * 5
            x0, x1 = sorted((sx * (BEZEL_OUT_R + 3.5), sx * (HOOD_IN_W / 2 - 3)))
            cuts.append(U(box(x0, x1, y1 - 1.0, y1 + 1, z - 0.8, z + 0.8),
                          cyl(0.8, (x0, y1 - 1.0, z), (0, 1, 0), 2), cyl(0.8, (x1, y1 - 1.0, z), (0, 1, 0), 2)))
    # badge text under the porthole
    txt = (cq.Workplane(cq.Plane(origin=(0, y1 + 0.01, 7.0), xDir=(-1, 0, 0), normal=(0, 1, 0)))
           .text("WATCH THE HUTCH", 3.6, -0.6, kind="bold", halign="center", valign="center").val())
    cuts.append(txt)
    return C(l, *cuts)


def bezel_peg_angles():
    return [math.radians(a) for a in (90, 210, 330)]


def make_bezel():
    """porthole ring around the display; in hood coordinates sitting on the lid face"""
    zc, y1 = DISP_CENTER_Z, HOOD_IN_D + LID_T
    ri, ro, h = DISP_VIEW_D / 2, BEZEL_OUT_R, BEZEL_H
    prof = [(ri, 0), (ro, 0), (ro, 1.2), (ro - 1.5, h), (ri + 1.5, h), (ri, h - 1.5)]
    ring = (cq.Workplane("XZ").polyline(prof).close()
            .revolve(360, (0, 0, 0), (0, 1, 0)).val())       # axis = local z of the ring
    # the XZ workplane maps (r, h) -> (x, z); revolve about z
    parts = [ring]
    for i in range(RIVETS):
        a = 2 * math.pi * (i + 0.5) / RIVETS
        rr = BEZEL_DOWEL_R
        parts.append(cq.Solid.makeSphere(1.1, V(rr * math.cos(a), rr * math.sin(a), h - 0.25),
                                         angleDegrees1=0, angleDegrees2=90))
    b = U(*parts)
    b = C(b, *[cyl(DOWEL_HOLE_D / 2, (BEZEL_DOWEL_R * math.cos(a), BEZEL_DOWEL_R * math.sin(a), -1), (0, 0, 1), 3.0)
               for a in bezel_peg_angles()])
    # local z (ring axis) -> +y, ring plane -> lid face
    b = b.rotate(V(0, 0, 0), V(1, 0, 0), -90)
    return b.translate(V(0, y1, zc))


def make_retainer():
    """in hood coordinates, sits on the lid bosses behind the display"""
    zc = DISP_CENTER_Z
    ret_x = DISP_PCB_D / 2 + 4.5
    y1 = HOOD_IN_D - DISP_STACK
    bar = U(box(-ret_x, ret_x, y1 - 3, y1, zc - 4, zc + 4),
            *[cyl(4, (sx * ret_x, y1 - 3, zc), (0, 1, 0), 3) for sx in (-1, 1)])
    cuts = [countersink((sx * ret_x, y1 - 3, zc), d_head=4.4, d_hole=M2_CLEAR, direction=(0, 1, 0), depth=5)
            for sx in (-1, 1)]
    # relief so the bar presses the PCB rim, not the parts on its back
    cuts.append(box(-10, 10, y1 - 0.8, y1 + 1, zc - 5, zc + 5))
    return C(bar, *cuts)


# ---------------------------------------------------------------- assembly helpers
def place_on_axis(shape, pan=0.0, tilt=0.0):
    """local pan/tilt part -> hood coordinates"""
    s = shape.rotate(V(0, 0, 0), V(1, 0, 0), tilt).rotate(V(0, 0, 0), V(0, 0, 1), pan)
    return s.translate(V(0, AXIS_Y, AXIS_Z))


def place_yoke(shape, pan=0.0):
    return shape.rotate(V(0, 0, 0), V(0, 0, 1), pan).translate(V(0, AXIS_Y, AXIS_Z))


def hood_to_base(shape):
    return shape.translate(V(0, 0, BASE_TOP_T + FLOOR_T))


def build_all():
    return {
        "base_pi_mount": make_base(),
        "pi5_plate": make_pi_plate(),
        "hood": make_hood(),
        "camera_yoke": make_yoke(),
        "camera_cradle": make_cradle(),
        "screen_lid": make_lid(),
        "screen_retainer": make_retainer(),
        "porthole_bezel": make_bezel(),
    }


# print orientation: (axis, angle) rotations applied before STL export so parts lie flat
PRINT_ROT = {
    "base_pi_mount": [((1, 0, 0), 180)],     # top surface on the bed, Pi wall standing up
    "pi5_plate": [((1, 0, 0), 90)],          # back on the bed, standoffs up
    "hood": [((1, 0, 0), 90)],               # glass flange on the bed, walls vertical
    "camera_yoke": [],                       # disc on the bed
    "camera_cradle": [((0, 1, 0), 90)],      # on its side (a cheek on the bed)
    "screen_lid": [((1, 0, 0), -90)],        # display face on the bed
    "screen_retainer": [((1, 0, 0), 90)],
    "porthole_bezel": [((1, 0, 0), 90)],    # flat back on the bed, rivets up
}


def to_print(name, s):
    for ax, ang in PRINT_ROT[name]:
        s = s.rotate(V(0, 0, 0), V(*ax), ang)
    bb = s.BoundingBox()
    return s.translate(V(-bb.center.x, -bb.center.y, -bb.zmin))


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.dirname(here)
    for d in ("step", "stl"):
        os.makedirs(os.path.join(out, d), exist_ok=True)
    parts = build_all()
    for name, s in parts.items():
        cq.exporters.export(cq.Workplane().add(s), os.path.join(out, "step", name + ".step"))
        p = to_print(name, s)
        cq.exporters.export(cq.Workplane().add(p), os.path.join(out, "stl", name + ".stl"),
                            tolerance=0.02, angularTolerance=0.1)
        bb = p.BoundingBox()
        print(f"{name:16s} print size {bb.xlen:6.1f} x {bb.ylen:6.1f} x {bb.zlen:6.1f} mm  valid={s.isValid()}")

    # positioned assembly (for checking the layout in Fusion 360); camera centred
    hz = BASE_TOP_T + FLOOR_T
    asm = cq.Assembly(name="wth_window_mount_v2")
    asm.add(parts["base_pi_mount"], name="base_pi_mount", color=cq.Color(130 / 255, 162 / 255, 103 / 255))
    asm.add(hood_to_base(parts["hood"]), name="hood", color=cq.Color(0.1, 0.1, 0.1))
    asm.add(hood_to_base(place_yoke(parts["camera_yoke"])), name="camera_yoke", color=cq.Color(0.9, 0.57, 0.22))
    asm.add(hood_to_base(place_on_axis(parts["camera_cradle"])), name="camera_cradle", color=cq.Color(0.95, 0.76, 0.2))
    asm.add(hood_to_base(parts["screen_lid"]), name="screen_lid", color=cq.Color(0.12, 0.12, 0.12))
    asm.add(hood_to_base(parts["screen_retainer"]), name="screen_retainer", color=cq.Color(0.9, 0.57, 0.22))
    asm.add(hood_to_base(parts["porthole_bezel"]), name="porthole_bezel", color=cq.Color(0.72, 0.45, 0.2))
    asm.export(os.path.join(out, "step", "assembly_all_parts.step"))
    print("assembly written")
