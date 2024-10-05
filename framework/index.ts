import { jsx } from './jsx';

const Framework = {
  createElement(tag: any, props: any, children: any) {
    const p = props || {};
    p.children = children;
    return jsx(tag, p);
  },
};

export { Framework as default };
