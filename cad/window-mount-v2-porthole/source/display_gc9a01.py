"""
1.28" round GC9A01 display module, sized from Jonny's own model (measured in Fusion):
38.0 mm round PCB, 35.5 x 2.0 mm glass, 1.6 mm PCB, 23.0 mm pin tab reaching 9.5 mm
below the circle, 7-pin header with 2.6 mm plastic and pins 8.6 mm behind the board.
Header row position on the tab is approximate.

Hood frame: glass front on the lid's inner face (y = HOOD_IN_D) facing +y, centre at
(0, DISP_CENTER_Z), tab pointing down.
"""
from wth_mount import (DISP_PCB_D, DISP_TAB_W, DISP_TAB_H, DISP_CENTER_Z, HOOD_IN_D, box, cyl, U)

GLASS_D, GLASS_T, PCB_T = 35.5, 2.0, 1.6
ACTIVE_D = 32.4
HDR_PLASTIC, HDR_PINS = 2.6, 8.6


def display_parts():
    zc, y0 = DISP_CENTER_Z, HOOD_IN_D
    yg = y0 - GLASS_T                    # glass back / PCB front
    yp = yg - PCB_T                      # PCB back
    glass = cyl(GLASS_D / 2, (0, yg, zc), (0, 1, 0), GLASS_T)
    active = cyl(ACTIVE_D / 2, (0, y0 - 0.01, zc), (0, 1, 0), 0.02)
    z_tab = zc - DISP_PCB_D / 2 - DISP_TAB_H
    pcb = U(cyl(DISP_PCB_D / 2, (0, yp, zc), (0, 1, 0), PCB_T),
            box(-DISP_TAB_W / 2, DISP_TAB_W / 2, yp, yg, z_tab, zc))
    zr = z_tab + 2.5                     # header row centre
    hdr = box(-8.9, 8.9, yp - HDR_PLASTIC, yp, zr - 1.25, zr + 1.25)
    pins = U(*[box(x - 0.32, x + 0.32, yp - HDR_PINS, yg + 1.5, zr - 0.32, zr + 0.32)
               for x in [(i - 3) * 2.54 for i in range(7)]])
    return [
        ("disp_glass", glass, (0.05, 0.05, 0.07)),
        ("disp_active", active, (0.11, 0.16, 0.27)),
        ("disp_pcb", pcb, (0.12, 0.31, 0.62)),
        ("disp_header", hdr, (0.1, 0.1, 0.1)),
        ("disp_pins", pins, (0.83, 0.69, 0.22)),
    ]


def display_gc9a01():
    return U(*[s for _, s, _ in display_parts()])
