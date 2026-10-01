// A layer of static characters (terrain, walls, items): one instanced mesh
// per character code, rebuilt whenever the cells change.  In standing mode
// (the low cameras) the 'stand' characters are drawn upright and turned to
// face the camera; walls and ground cover look the same in both modes.
import * as THREE from 'three';
import { glyphGeometry, glyphHeight, glyphStyle, standingGeometry, standHeight, tileGeometry } from './glyphs.js';

export const EGA = PALETTE.map(([r, g, b]) => new THREE.Color(r / 255, g / 255, b / 255));

const glyphMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
const tileMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
const m4 = new THREE.Matrix4(), color = new THREE.Color();
const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0), NO_TURN = new THREE.Quaternion();

export class Layer {
  // brightness scales every colour (used to dim the previews); grey turns
  // the colours to shades of grey (areas not yet visited).
  constructor(parent, brightness = 1, grey = false) {
    this.group = new THREE.Group();
    this.brightness = brightness;
    this.grey = grey;
    this.cells = [];
    this.standing = false;
    this.yaw = 0;
    this.upright = [];          // instanced meshes of standing characters, with their cells
    parent.add(this.group);
  }

  clear() {
    for (const m of this.group.children) m.dispose();
    this.group.clear();
    this.upright = [];
  }

  // cells: [worldX, worldZ, attr << 8 | code]
  set(cells) {
    this.cells = cells;
    this.build();
  }

  setStanding(standing) {
    if (standing === this.standing) return false;
    this.standing = standing;
    this.build();
    return true;
  }

  // Turns the standing characters to face a camera looking along `yaw`.
  setYaw(yaw) {
    if (Math.abs(yaw - this.yaw) < 1e-4) return false;
    this.yaw = yaw;
    if (!this.upright.length) return false;
    quat.setFromAxisAngle(UP, -yaw);
    for (const { mesh, list, code } of this.upright) {
      const h = standHeight(code);
      list.forEach(([x, z], i) => {
        pos.set(x + 0.5, 0, z + 0.5); scl.set(h * 9 / 16, h, 1);
        mesh.setMatrixAt(i, m4.compose(pos, quat, scl));
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    return true;
  }

  build() {
    this.clear();
    const flat = new Map(), up = new Map(), tiles = [];
    for (const c of this.cells) {
      const code = c[2] & 255, attr = c[2] >> 8, fc = attr & 15;
      const stand = this.standing && glyphStyle(code, fc) === 'stand';
      if (stand ? standingGeometry(code) : glyphGeometry(code)) {
        const map = stand ? up : flat;
        if (!map.has(code)) map.set(code, []);
        map.get(code).push(c);
      }
      if ((attr >> 4) & 7) tiles.push(c);
    }
    for (const [code, list] of flat) {
      const mesh = new THREE.InstancedMesh(glyphGeometry(code), glyphMaterial, list.length);
      list.forEach(([x, z, v], i) => {
        const fc = (v >> 8) & 15;
        pos.set(x + 0.5, 0, z + 0.5); scl.set(1, glyphHeight(code, fc), 1);
        mesh.setMatrixAt(i, m4.compose(pos, NO_TURN, scl));
        mesh.setColorAt(i, this.tint(EGA[fc]));
      });
      this.group.add(mesh);
    }
    for (const [code, list] of up) {
      const mesh = new THREE.InstancedMesh(standingGeometry(code), glyphMaterial, list.length);
      list.forEach(([, , v], i) => mesh.setColorAt(i, this.tint(EGA[(v >> 8) & 15])));
      this.group.add(mesh);
      this.upright.push({ mesh, list, code });
    }
    const yaw = this.yaw;
    this.yaw = NaN;
    this.setYaw(yaw);
    if (tiles.length) {
      const mesh = new THREE.InstancedMesh(tileGeometry, tileMaterial, tiles.length);
      tiles.forEach(([x, z, v], i) => {
        const bc = (v >> 12) & 7;
        pos.set(x + 0.5, 0.002, z + 0.5); scl.set(1, 1, 1);
        mesh.setMatrixAt(i, m4.compose(pos, NO_TURN, scl));
        mesh.setColorAt(i, this.tint(EGA[bc]).multiplyScalar(0.55));
      });
      this.group.add(mesh);
    }
  }

  // A palette colour as this layer shows it.
  tint(c) {
    color.copy(c);
    if (this.grey) {
      const l = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;
      color.setRGB(l, l, l);
    }
    return color.multiplyScalar(this.brightness);
  }

  dispose() { this.clear(); this.group.removeFromParent(); }
}
