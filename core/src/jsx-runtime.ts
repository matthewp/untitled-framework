import { createElement } from './element.js';

const Fragment = (props: any) => {
  return props.children;
};

function jsx(type: any, props: any, key: any, __self: any, __source: any) {
  const element = createElement(type, props, props.children);
  return element;
}

export { jsx, jsx as jsxs, jsx as jsxDEV, Fragment };
