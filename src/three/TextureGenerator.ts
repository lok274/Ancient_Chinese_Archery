import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator
 * Renders World Archery (WA) / Olympic 122cm 5-Color 10-Ring Target Face,
 * Olympic Stadium Turf Field with distance lane markings, and Team China / Olympic Banners.
 */
export class TextureGenerator {
  /**
   * Generates official World Archery / Olympic 5-Color 10-Ring Target Face (國際射箭總會五色十環靶紙)
   * Rings 10 & 9 ( + Inner X-ring): Olympic Gold (#facc15)
   * Rings 8 & 7: Olympic Red (#e11d48 / #dc2626)
   * Rings 6 & 5: Olympic Cyan-Blue (#0284c7)
   * Rings 4 & 3: Matte Black (#1e293b)
   * Rings 2 & 1: Crisp White (#f8fafc)
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

    // Reinforced weather-resistant Olympic target paper backing
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, size, size);

    // Corner target face pins & World Archery / Olympic regulation markings
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WA 122cm · OLYMPIC 70M', 34, 48);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#dc2626';
    ctx.fillText('TEAM CHINA · 中國射箭', size - 34, 48);

    // 5 Color Zones from outside in (10 concentric scoring rings)
    const colorZones = [
      { r: 1.0, color: '#f8fafc', border: '#334155' }, // Rings 1-2: White
      { r: 0.8, color: '#1e293b', border: '#0f172a' }, // Rings 3-4: Black
      { r: 0.6, color: '#0284c7', border: '#0369a1' }, // Rings 5-6: Blue
      { r: 0.4, color: '#dc2626', border: '#991b1b' }, // Rings 7-8: Red
      { r: 0.2, color: '#facc15', border: '#ca8a04' }, // Rings 9-10: Gold/Yellow
    ];

    for (const zone of colorZones) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * zone.r, 0, Math.PI * 2);
      ctx.fillStyle = zone.color;
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = zone.border;
      ctx.stroke();
    }

    // Concentric 1-to-10 score divider lines
    for (let i = 1; i <= 10; i++) {
      const r = (maxR * i) / 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = i % 2 === 0 ? 3 : 2;
      // White divider line between Black 3 and Black 4 ring per WA rules
      ctx.strokeStyle = i === 7 ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.55)';
      ctx.stroke();
    }

    // Inner X-Ring (內十環 X-Ring at r = 0.05 of maxR)
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.05, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(15,23,42,0.75)';
    ctx.stroke();
    ctx.setLineDash([]);

    // Center "+" Pinhole Crosshair
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();

    // Ring numbers along horizontal & vertical axes
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let ringNum = 1; ringNum <= 9; ringNum++) {
      const rNorm = (10.5 - ringNum) / 10;
      const rPx = maxR * rNorm;
      ctx.fillStyle = ringNum === 3 || ringNum === 4 ? '#f8fafc' : '#0f172a';
      ctx.fillText(String(ringNum), cx + rPx, cy);
    }

    // Outer compressed foam target boss rim
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx, cy, maxR + 7, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  /**
   * Stadium Architectural Concrete & Slate Panels
   */
  public static createBrickTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    const w = 512;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    const rows = 8;
    const cols = 4;
    const rowH = h / rows;
    const colW = w / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (colW / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        const y = r * rowH;

        const lightness = 24 + Math.floor(Math.random() * 8);
        ctx.fillStyle = `hsl(215, 22%, ${lightness}%)`;
        ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
      }
    }

    // Subtle Olympic Blue & China Red accent stripe along top
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, w, 14);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 14, w, 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  /**
   * Olympic Archery Stadium Turf Field (奧運射箭場修剪草坪與白線射道)
   */
  public static createGroundTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Alternating mowed Olympic stadium grass stripes
    ctx.fillStyle = '#1e4d2b';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#255c34';
    ctx.fillRect(0, 0, size, size / 2);

    // Fine grass blade texture
    for (let i = 0; i < 32000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const alpha = Math.random() * 0.1;
      ctx.fillStyle =
        Math.random() > 0.5 ? `rgba(16,40,22,${alpha})` : `rgba(120,190,110,${alpha})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Crisp white shooting lane lines & center corridor
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(size * 0.36, 0, 3, size);
    ctx.fillRect(size * 0.64, 0, 3, size);

    // Horizontal distance yardage line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(0, size * 0.5, size, 3);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(18, 18);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  /**
   * Team China & Olympic Archery Banner (中國射箭隊紅金旌旗 / 奧運賽場旗幟)
   */
  public static createBannerTexture(
    renderer: THREE.WebGLRenderer,
    char: string = '華'
  ): THREE.CanvasTexture {
    const w = 256;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Team China Crimson Red & Gold gradient banner
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#b91c1c');
    grad.addColorStop(0.6, '#991b1b');
    grad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Gold border trim
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#facc15';
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Top CHN header
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText('TEAM CHINA · CHN', w / 2, 56);

    // Center calligraphy emblem (中國 / 射藝)
    ctx.font = 'bold 112px "Noto Serif TC", serif';
    ctx.fillStyle = '#fef9c3';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char === '武' ? '中' : char === '帥' ? '華' : char, w / 2, h * 0.48);

    // Subtle 5-ring inspired colored bar at bottom
    const barColors = ['#0284c7', '#facc15', '#0f172a', '#16a34a', '#dc2626'];
    const segW = (w - 40) / 5;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = barColors[i];
      ctx.fillRect(20 + i * segW, h - 46, segW, 10);
    }

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
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(0.6, '#38bdf8');
    grad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    return canvas;
  }
}
