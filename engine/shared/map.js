// NEUTRALIA grey-box map. Shared verbatim by client and server, so the
// renderer and the collision solver are looking at exactly the same world.
// box: centre x/z, size w/d, height h, base y.

export const MAP = {
  name: 'greybox-01',
  groundSize: 64,
  bounds: { minX: -32, maxX: 32, minZ: -32, maxZ: 32 },
  boxes: [
    { x:   0, z: -32, w: 64, d: 2, h: 8,   y: 0, kind: 'wall'  },
    { x:   0, z:  32, w: 64, d: 2, h: 8,   y: 0, kind: 'wall'  },
    { x: -32, z:   0, w: 2, d: 64, h: 8,   y: 0, kind: 'wall'  },
    { x:  32, z:   0, w: 2, d: 64, h: 8,   y: 0, kind: 'wall'  },
    { x: -12, z: -10, w: 8, d: 2, h: 2.2, y: 0, kind: 'cover' },
    { x: -12, z:  -4, w: 2, d: 8, h: 3.2, y: 0, kind: 'cover' },
    { x:  -4, z:   6, w: 6, d: 6, h: 1.4, y: 0, kind: 'ramp'  },
    { x:   6, z:  -6, w: 4, d: 10, h: 2.6,y: 0, kind: 'cover' },
    { x:  14, z:   8, w: 10, d: 2, h: 2.2,y: 0, kind: 'cover' },
    { x:  16, z: -14, w: 2, d: 6, h: 3.4, y: 0, kind: 'tower' },
    { x:  -6, z:  16, w: 12, d: 2, h: 2.0,y: 0, kind: 'cover' },
    { x:  20, z:  20, w: 6, d: 6, h: 1.2, y: 0, kind: 'ramp'  },
    { x: -20, z:  18, w: 6, d: 6, h: 3.6, y: 0, kind: 'tower' },
    { x:   0, z:  20, w: 3, d: 3, h: 1.0, y: 0, kind: 'cover' },
    { x: -22, z: -18, w: 3, d: 3, h: 1.0, y: 0, kind: 'cover' },
    { x:  22, z: -20, w: 8, d: 2, h: 2.0, y: 0, kind: 'cover' }
  ],
  spawns: [
    { x: -24, z: -24, yaw: 0 },
    { x:  24, z: -24, yaw: 0 },
    { x: -24, z:  24, yaw: Math.PI },
    { x:  24, z:  24, yaw: Math.PI },
    { x:   0, z: -26, yaw: 0 },
    { x:   0, z:  26, yaw: Math.PI }
  ]
};
