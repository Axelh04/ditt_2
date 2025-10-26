import { useRef, forwardRef, useImperativeHandle } from 'react';
import { SVGMorpher } from '../../utils/svgMorpher';

interface SVGDisplayProps {
  isLoading: boolean;
}

export interface SVGDisplayHandle {
  displayStage: (svg: string, animate: boolean) => void;
  cancel: () => void;
}

export const SVGDisplay = forwardRef<SVGDisplayHandle, SVGDisplayProps>(({ isLoading }, ref) => {
  const svgDisplayRef = useRef<HTMLDivElement>(null);
  const morpherRef = useRef<SVGMorpher>(new SVGMorpher(1500));

  useImperativeHandle(ref, () => ({
    displayStage: (svg: string, animate: boolean) => {
      if (!svgDisplayRef.current) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const newSVG = doc.documentElement as unknown as SVGSVGElement;

      if (!animate || svgDisplayRef.current.children.length === 0) {
        // No animation, just replace
        svgDisplayRef.current.innerHTML = '';
        svgDisplayRef.current.appendChild(newSVG);
      } else {
        // Morph from current to new
        const currentSVG = svgDisplayRef.current.querySelector('svg');
        
        if (currentSVG) {
          morpherRef.current.morph(currentSVG as SVGSVGElement, newSVG);
        }
      }
    },
    cancel: () => {
      morpherRef.current.cancel();
    }
  }));

  return (
    <div className="svg-viewport">
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Generating voiceovers...</p>
        </div>
      ) : (
        <div ref={svgDisplayRef} className="svg-container" />
      )}
    </div>
  );
});

SVGDisplay.displayName = 'SVGDisplay';

