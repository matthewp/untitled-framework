import type { ReactElement } from '../element.js';
import { render as performRender } from '../reconcile.js';

type Root = {
  render: (element: ReactElement) => void;
  unmount: () => void;
};

function createRoot(container: Element): Root {
  let root: ReactElement | null = null;

  function render(element: ReactElement) {
    root = element;
    performRender(element, container);
  }

  function unmount() {
    if (root) {
      container.innerHTML = '';
      // TODO call unmount stuff
      root = null;
    }
  }

  return { render, unmount };
}

export {
  createRoot
};
