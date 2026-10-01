// A layer of static characters (terrain, walls, items): one instanced mesh
// per character code, rebuilt whenever the cells change.
import * as THREE from 'three';
import { glyphGeometry, glyphHeight, tileGeometry } from './glyphs.js';

export const EGA = PALETTE.map(([r, g, b]) => new THREE.Color(r / 255, g / 255, b / 255));

const glyphMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
const tileMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

export class Layer {
  // brightness scales every colour (used to dim the previews).
  constructor(parent, brightness = 1) {
    this.group = new THREE.Group();
    this.brightness = brightness;
    parent.add(this.group);
  }

  clear() {
    for (const m of this.group.children) m.dispose();
    this.group.clear();
  }

  // cells: [worldX, worldZ, attr << 8 | code]
  set(cells) {
    this.clear();
    const byCode = new Map(), tiles = [];
    for (const c of cells) {
      const code = c[2] & 255, attr = c[2] >> 8;
      if (glyphGeometry(code)) {
        if (!byCode.has(code)) byCode.set(code, []);
        byCode.get(code).push(c);
      }
      if ((attr >> 4) & 7) tiles.push(c);
    }
    const m4 = new THREE.Matrix4(), color = new THREE.Color();
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
    for (const [code, list] of byCode) {
      const mesh = new THREE.InstancedMesh(glyphGeometry(code), glyphMaterial, list.length);
      list.forEach(([x, z, v], i) => {
        const fc = (v >> 8) & 15;
        pos.set(x + 0.5, 0, z + 0.5); scl.set(1, glyphHeight(code, fc), 1);
        mesh.setMatrixAt(i, m4.compose(pos, quat, scl));
        mesh.setColorAt(i, color.copy(EGA[fc]).multiplyScalar(this.brightness));
      });
      this.group.add(mesh);
    }
    if (tiles.length) {
      const mesh = new THREE.InstancedMesh(tileGeometry, tileMaterial, tiles.length);
      tiles.forEach(([x, z, v], i) => {
        const bc = (v >> 12) & 7;
        pos.set(x + 0.5, 0.002, z + 0.5); scl.set(1, 1, 1);
        mesh.setMatrixAt(i, m4.compose(pos, quat, scl));
        mesh.setColorAt(i, color.copy(EGA[bc]).multiplyScalar(0.55 * this.brightness));
      });
      this.group.add(mesh);
    }
  }

  dispose() { this.clear(); this.group.removeFromParent(); }
}
