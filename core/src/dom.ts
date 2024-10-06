import { render as performRender } from './reconcile';

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
