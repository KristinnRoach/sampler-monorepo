export type LayoutType = 'desktop' | 'tablet' | 'mobile';

export const getLayoutFromWidth = (width: number): LayoutType => {
  if (width < 800) {
    return 'mobile';
  } else if (width < 1200) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};
