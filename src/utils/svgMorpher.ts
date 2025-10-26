/**
 * SVG Morphing Engine
 * Handles smooth transitions between SVG states by interpolating element attributes
 */
export class SVGMorpher {
  private duration: number;
  private startTime: number | null;
  private animationFrame: number | null;

  constructor(duration = 1500) {
    this.duration = duration;
    this.startTime = null;
    this.animationFrame = null;
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    return { r: 255, g: 255, b: 255 };
  }

  private interpolateColor(color1: string, color2: string, progress: number): string {
    const c1 = this.parseColor(color1);
    const c2 = this.parseColor(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * progress);
    const g = Math.round(c1.g + (c2.g - c1.g) * progress);
    const b = Math.round(c1.b + (c2.b - c1.b) * progress);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private interpolateNumber(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  morph(fromSVG: SVGSVGElement, toSVG: SVGSVGElement, onComplete?: () => void): void {
    const fromElements: Record<string, Element> = {};
    const toElements: Record<string, Element> = {};

    fromSVG.querySelectorAll('[id]').forEach((el) => {
      if (el.id) fromElements[el.id] = el;
    });

    toSVG.querySelectorAll('[id]').forEach((el) => {
      if (el.id) toElements[el.id] = el;
    });

    interface Transition {
      element: Element;
      attributes: Record<string, { from: string; to: string; type: 'color' | 'number' }>;
    }

    const transitions: Transition[] = [];

    for (const id in fromElements) {
      if (toElements[id]) {
        const fromEl = fromElements[id];
        const toEl = toElements[id];

        const transition: Transition = {
          element: fromEl,
          attributes: {},
        };

        // Attributes to morph
        ['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'opacity', 'stroke-width'].forEach((attr) => {
          const fromVal = fromEl.getAttribute(attr);
          const toVal = toEl.getAttribute(attr);

          if (fromVal !== null && toVal !== null && fromVal !== toVal) {
            transition.attributes[attr] = {
              from: fromVal,
              to: toVal,
              type: (attr === 'fill' || attr === 'stroke') ? 'color' : 'number',
            };
          }
        });

        if (Object.keys(transition.attributes).length > 0) {
          transitions.push(transition);
        }
      }
    }

    const animate = (timestamp: number) => {
      if (!this.startTime) this.startTime = timestamp;
      const elapsed = timestamp - this.startTime;
      const rawProgress = Math.min(elapsed / this.duration, 1);
      const progress = this.easeInOutCubic(rawProgress);

      transitions.forEach((transition) => {
        for (const attr in transition.attributes) {
          const { from, to, type } = transition.attributes[attr];
          let value: string | number;

          if (type === 'color') {
            value = this.interpolateColor(from, to, progress);
          } else {
            value = this.interpolateNumber(parseFloat(from), parseFloat(to), progress);
          }

          transition.element.setAttribute(attr, value.toString());
        }
      });

      if (rawProgress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.startTime = null;
        if (onComplete) onComplete();
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  cancel(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      this.startTime = null;
    }
  }
}

