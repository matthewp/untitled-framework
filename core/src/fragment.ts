// 1. Define the Fragment symbol
const FRAGMENT_TYPE = Symbol.for('react.fragment');

// 2. Create the Fragment component
const Fragment = FRAGMENT_TYPE;

const createFragment = (_props: any) => {
  return Fragment;
};
function isFragment(element: any): element is typeof Fragment {
  return (
    typeof element === 'object' &&
    element !== null &&
    element.type === FRAGMENT_TYPE
  );
}

export {
  createFragment,
  Fragment,
  isFragment,
}
