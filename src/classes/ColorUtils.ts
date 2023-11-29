export class Color {
  private r: number;
  private g: number;
  private b: number;

  private constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  get rgb() {
    return { r: this.r, g: this.g, b: this.b };
  }
  get hex() {
    const rH = this.r.toString(16).padStart(2, "0");
    const gH = this.g.toString(16).padStart(2, "0");
    const bH = this.b.toString(16).padStart(2, "0");
    return `#${rH}${gH}${bH}`;
  }

  /**
   * @returns h: [0...360]degree, s: [0...100]%, l: [0...100]%
   */
  get hsl() {
    return Color.rgb2hsl(this.r, this.g, this.b);
  }

  /**
   * Create Color object from RGB hex string
   * @param hex RGB hex string
   * @returns Color object, null if error
   * @example Color.fromHex("#fff")
   * @example Color.fromHex("aabbcc")
   * @example Color.fromHex("#112233")
   */
  static fromHex(hex: string) {
    if (hex.startsWith("#")) hex = hex.substring(1);
    if (hex.length === 3) {
      hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    if (hex.length !== 6) return null;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return Color.fromRGB(r, g, b);
  }

  /**
   * Create Color object from RGB values
   * @param r Red value, [0...255]
   * @param g Green value, [0...255]
   * @param b Blue value, [0...255]
   * @returns Color object, null if error
   */
  static fromRGB(r: number, g: number, b: number) {
    if (Color.isValidRGB(r) && Color.isValidRGB(g) && Color.isValidRGB(b))
      return new Color(r, g, b);
    return null;
  }

  /**
   * Create Color object from HSL values
   * @param h Hue [0...360]degree
   * @param s Saturation [0...100]%
   * @param l Lightness [0...100]%
   * @returns Color object, null if error
   */
  static fromHSL(h: number, s: number, l: number) {
    while (h < 0) h += 360;
    if (h > 360) h %= 360;
    if (s < 0) s = 0;
    if (s > 100) s = 100;
    if (l < 0) l = 0;
    if (l > 100) l = 100;

    const { r, g, b } = Color.hsl2rgb(h, s, l);
    return new Color(r, g, b);
  }

  static generateFromString(str: string) {
    if (str === "null") return Color.fromHex("#000")!;
    const n = [...str].reduce((prev, curr) => prev + curr.charCodeAt(0), 0);
    return Color.fromHex(
      ((n * 1234567) % Math.pow(2, 24)).toString(16).padStart(6, "0")
    )!;
  }

  decideForeground() {
    const { l } = this.hsl;
    if (l > 50) return Color.fromHex("#000");
    return Color.fromHex("#fff");
  }

  darker(maxLightness: number) {
    const { h, s, l } = this.hsl;
    return Color.fromHSL(h, s, l > maxLightness ? maxLightness : l);
  }

  mixWith(color: Color) {
    const cur = this.hsl;
    const mix = color.hsl;
    return Color.fromHSL(
      (cur.h + mix.h) / 2,
      (cur.s + mix.s) / 2,
      (cur.l + mix.l) / 2
    );
  }

  private static isValidRGB(val: number) {
    return val >= 0 && val <= 255;
  }

  private static hue2rgb(p: number, q: number, t: number) {
    if (t < 0) t++;
    if (t > 1) t--;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
    return p;
  }
  private static hsl2rgb(h: number, s: number, l: number) {
    h = (h % 360) / 360;
    s = s / 100;
    l = l / 100;

    let r = 0;
    let g = 0;
    let b = 0;

    if (s == 0) {
      r = l;
      g = l;
      b = l;
    }
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = Math.min(Math.floor(Color.hue2rgb(p, q, h + 1 / 3) * 256), 255);
    g = Math.min(Math.floor(Color.hue2rgb(p, q, h) * 256), 255);
    b = Math.min(Math.floor(Color.hue2rgb(p, q, h - 1 / 3) * 256), 255);
    return { r, g, b };
  }

  private static rgb2hsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);

    let h = 0;
    let s = 0;
    let l = 0;
    l = (max + min) / 2;
    if (max === min) {
      h = 0;
    } else if (max === r && g >= b) {
      h = 60 * ((g - b) / (max - min));
    } else if (max === r && g < b) {
      h = 60 * ((g - b) / (max - min)) + 360;
    } else if (max === g) {
      h = 60 * ((b - r) / (max - min)) + 120;
    } else if (max === b) {
      h = 60 * ((r - g) / (max - min)) + 240;
    }

    if (l === 0 || max === min) {
      s = 0;
    } else if (l > 0 && l <= 0.5) {
      s = (max - min) / (2 * l);
    } else if (l > 0.5) {
      s = (max - min) / (2 - 2 * l);
    }
    s *= 100;
    l *= 100;
    return { h, s, l };
  }
}
