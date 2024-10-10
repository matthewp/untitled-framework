import { render as performRender } from '../reconcile.js';

function render(element: any, container: any) {
  performRender(element, container);
}

const FrameworkDOM = {
  render
};

export {
  FrameworkDOM as default,
  render
};
