"""
Raspberry Pi Camera Module 3 (NoIR) stand-in model for visualising the assembly.

Key dimensions follow the published footprint (25 x 24 mm board, 4 x M2 holes on a
21 x 12.5 mm pattern 2 mm from the top edge, ~11.5 mm overall thickness, 15-pin FPC
connector on the back at the bottom edge). Lens height/position are approximate.

Local frame (same as wth_mount.camera_dummy): board centre at x=0, z=CAM_BOARD_Z,
lens pointing toward -y (the glass), board back face at y = PLATE_Y0 - CAM_STANDOFF_H.
"""
import cadquery as cq
from cadquery import Vector as V

from wth_mount import (CAM_W, CAM_H, CAM_HOLES_X, CAM_HOLES_FROM_TOP, CAM_BOARD_Z,
                       PLATE_Y0, CAM_STANDOFF_H, box, cyl, U, C)

PCB_T = 1.0


def camera_module3_parts():
    """[(name, shape, (r, g, b))]"""
    top = CAM_BOARD_Z + CAM_H / 2
    y_back = PLATE_Y0 - CAM_STANDOFF_H          # board back face (touches the standoffs)
    y_front = y_back - PCB_T                     # component side, toward the glass
    pcb = box(-CAM_W / 2, CAM_W / 2, y_front, y_back, top - CAM_H, top)
    pcb = cq.Workplane().add(pcb).edges("|Y").fillet(1.0).val()
    holes = [cyl(1.1, (sx * CAM_HOLES_X, y_front - 1, top - d), (0, 1, 0), PCB_T + 2)
             for sx in (-1, 1) for d in CAM_HOLES_FROM_TOP]
    pcb = C(pcb, *holes)
    pads = [C(cyl(1.6, (sx * CAM_HOLES_X, y_front - 0.04, top - d), (0, 1, 0), 0.04),
              cyl(1.1, (sx * CAM_HOLES_X, y_front - 1, top - d), (0, 1, 0), PCB_T + 2))
            for sx in (-1, 1) for d in CAM_HOLES_FROM_TOP]

    lz = top - 9.5                               # optical centre (approximate)
    holder = box(-4.25, 4.25, y_front - 4.6, y_front, lz - 4.25, lz + 4.25)
    barrel = cyl(3.7, (0, y_front - 4.6, lz), (0, -1, 0), 3.4)
    glass = cyl(2.6, (0, y_front - 8.0, lz), (0, -1, 0), 0.4)
    ring = C(cyl(3.7, (0, y_front - 8.0, lz), (0, -1, 0), 0.6), cyl(2.6, (0, y_front - 9, lz), (0, 1, 0), 3))
    sensor_flex = box(-3.5, 3.5, y_front - 0.6, y_front, lz - 10.5, lz - 4.25)
    chips = [box(-10.5, -6.5, y_front - 0.9, y_front, top - 22, top - 17.5),
             box(6.0, 10.0, y_front - 0.9, y_front, top - 22, top - 18.5),
             box(-9.5, -7.0, y_front - 0.6, y_front, top - 9, top - 6)]

    # 15-pin 1 mm FPC connector on the back, at the bottom edge, and a short ribbon tail
    conn = box(-10.0, 10.0, y_back, y_back + 2.4, top - CAM_H, top - CAM_H + 5.5)
    latch = box(-9.0, 9.0, y_back + 2.4, y_back + 2.7, top - CAM_H + 0.3, top - CAM_H + 4.5)
    # ribbon stub dropping out of the cradle; in reality it bends back under the display header
    # to the notch in the lid, so only the first few mm are modelled
    ribbon = box(-8.0, 8.0, y_back + 0.8, y_back + 0.95, top - CAM_H - 6, top - CAM_H + 1)

    return [
        ("cam_pcb", pcb, (0.08, 0.36, 0.16)),
        ("cam_pads", U(*pads), (0.85, 0.7, 0.3)),
        ("cam_lens_holder", U(holder, barrel, ring, sensor_flex), (0.06, 0.06, 0.06)),
        ("cam_lens_glass", glass, (0.25, 0.3, 0.45)),
        ("cam_chips", U(*chips), (0.12, 0.12, 0.12)),
        ("cam_connector", U(conn, latch), (0.9, 0.85, 0.75)),
        ("cam_ribbon", ribbon, (0.95, 0.55, 0.2)),
    ]


def camera_module3():
    return U(*[s for _, s, _ in camera_module3_parts()])
