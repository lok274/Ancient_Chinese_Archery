import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator
 * Zero 404 dependencies, 100% Canvas-rendered textures for Ming-Qing Frontier Pass.
 */
export class TextureGenerator {
  /**
   * Generates traditional Chinese archery target face (皮侯 / 鵠心)
   * 10: Gold Bullseye (鵠心)
   * 9: Vermilion Red (朱紅)
   * 8-7: Ink Black (玄黑)
   * 6-5: Indigo Blue (靛青)
   * 4-3: Raw White (純素)
   */
  public static createTargetTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.46;

    // Background textured linen / raw hide (皮質麻布底)
    ctx.fillStyle = '#e8dcc4';
    ctx.fillRect(0, 0, size, size);

    // Subtle grain texture
    for (let i = 0; i < 20000; i++) {
      const gx = Math.random() * size;
      const gy = Math.random() * size;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }

    // Rings from outside in
    const rings = [
      { r: 1.0, color: '#f3ece2', label: '3-4' }, // White
      { r: 0.8, color: '#2b4162', label: '5-6' }, // Indigo Blue
      { r: 0.6, color: '#1c1d21', label: '7-8' }, // Ink Black
      { r: 0.4, color: '#a62626', label: '9' },   // Vermilion Red
      { r: 0.2, color: '#d4af37', label: '10' },  // Gold Bullseye (鵠心)
    ];

    for (const ring of rings) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * ring.r, 0, Math.PI * 2);
      ctx.fillStyle = ring.color;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.stroke();
    }

    // Concentric score divider lines
    for (let i = 1; i <= 10; i++) {
      const r = (maxR * i) / 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = i === 2 || i === 4 || i === 6 || i === 8 ? 2 : 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.stroke();
    }

    // Central crosshair & bullseye mark (鵠心準星)
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#8b0000';
    ctx.fill();

    // Chinese characters for traditional aesthetics (侯 / 鵠)
    ctx.font = 'bold 36px "Noto Serif TC", "Cinzel", serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('十', cx, cy - 2);

    // Hemp rope outer binding rim (麻繩編邊)
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#8c7853';
    ctx.beginPath();
    ctx.arc(cx, cy, maxR + 7, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  /**
   * Frontier Great Wall Gray Brick (明代青磚)
   */
  public static createBrickTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    const w = 512;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Base mortar color
    ctx.fillStyle = '#404347';
    ctx.fillRect(0, 0, w, h);

    const rows = 16;
    const cols = 8;
    const rowH = h / rows;
    const colW = w / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (colW / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        const y = r * rowH;

        // Brick body with natural hue variations
        const lightness = 38 + Math.floor(Math.random() * 12);
        ctx.fillStyle = `hsl(215, 6%, ${lightness}%)`;
        ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

        // Brick weathering texture
        for (let k = 0; k < 40; k++) {
          const px = x + 2 + Math.random() * (colW - 4);
          const py = y + 2 + Math.random() * (rowH - 4);
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)';
          ctx.fillRect(px, py, 2, 2);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  /**
   * Archery Ground Flagstone & Rammed Earth (演武場夯土地面)
   */
  public static createGroundTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Rich sandy loam / rammed earth base
    ctx.fillStyle = '#6e5a44';
    ctx.fillRect(0, 0, size, size);

    // Natural soil variations
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const alpha = Math.random() * 0.12;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(40,30,20,${alpha})` : `rgba(180,150,110,${alpha})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Flagstone lane strip down the center
    ctx.fillStyle = 'rgba(80, 85, 90, 0.4)';
    ctx.fillRect(size * 0.38, 0, size * 0.24, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  /**
   * Traditional Banner Canvas with Dragon / Character Insignia (武 / 旗)
   */
  public static createBannerTexture(renderer: THREE.WebGLRenderer, char: string = '武'): THREE.CanvasTexture {
    const w = 256;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Imperial vermilion banner
    ctx.fillStyle = '#8b1e1e';
    ctx.fillRect(0, 0, w, h);

    // Gold border trim
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(8, 8, w - 16, h - 16);

    // Serrated bottom edge fringe
    ctx.fillStyle = '#d4af37';
    const triangleH = 20;
    const count = 6;
    const step = w / count;
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, h);
      ctx.lineTo((i + 0.5) * step, h - triangleH);
      ctx.lineTo((i + 1) * step, h);
      ctx.fill();
    }

    // Traditional calligraphy character in center
    ctx.font = 'bold 120px "Noto Serif TC", serif';
    ctx.fillStyle = '#f7eed8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, w / 2, h * 0.45);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  /**
   * Sky gradient canvas for atmospheric horizon fog blending
   */
  public static createSkyCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#3a506b');    // Deep northern mountain twilight blue
    grad.addColorStop(0.6, '#b08968');  // Warm frontier dust horizon
    grad.addColorStop(1, '#cbb89d');    // Rammed earth horizon haze
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    return canvas;
  }
}
