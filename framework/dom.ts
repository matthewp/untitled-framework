import { enqueue } from './render';

function render(element: any, target: any) {
  console.log('enqueing');
  enqueue(element, target, null, null);
}

export { render };
