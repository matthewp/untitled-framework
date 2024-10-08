import type { ReactElement } from './element.js';

type ReactNode = ReactElement | string | number | boolean | null | undefined;

const Children = {
  map(children: ReactNode | ReactNode[], fn: (child: ReactNode, index: number) => ReactNode): ReactNode[] {
    return Children.toArray(children).map(fn);
  },

  forEach(children: ReactNode | ReactNode[], fn: (child: ReactNode, index: number) => void): void {
    Children.toArray(children).forEach(fn);
  },

  count(children: ReactNode | ReactNode[]): number {
    return Children.toArray(children).length;
  },

  only(children: ReactNode | ReactNode[]): ReactNode {
    const array = Children.toArray(children);
    if (array.length !== 1) {
      throw new Error('Children.only() expects only one child.');
    }
    return array[0];
  },

  toArray(children: ReactNode | ReactNode[]): ReactNode[] {
    if (children == null) {
      return [];
    }
    return Array.isArray(children) ? children.flat() : [children];
  }
};

export { Children };
