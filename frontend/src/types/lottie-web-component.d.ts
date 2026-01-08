// Allow using the <lottie-player> web component in TSX without type errors
// This is UI-only and does not affect runtime behavior.
declare namespace JSX {
  interface IntrinsicElements {
    'lottie-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      autoplay?: boolean | string;
      loop?: boolean | string;
      background?: string;
      speed?: number | string;
      src?: string;
      style?: React.CSSProperties;
    };
  }
}
