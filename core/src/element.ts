import type { Context } from './context.js';

const REACT_ELEMENT_TYPE = Symbol.for('react.element');

// TODO this is not right
interface FunctionComponent<T> {
  (
    props: T
  ): ReactNode;

  displayName?: string;
}

type ComponentType<T> = FunctionComponent<T>;

// Define types for props and config
type Props = { [key: string]: any };
type Config = Props & {
  key?: string | number | null;
  ref?: any;
  __self?: any;
  __source?: any;
};

// Define the structure of a React Element
interface ReactElement {
  $$typeof: symbol;
  type: string | ComponentType<any> | Context<any>;
  key: string | null;
  ref: any;
  props: Props;
  _owner: any;
  _store: { [key: string]: any };
  _self: any;
  _source: any;
}

type ReactNode = ReactElement; // TODO and more

function createElement(
  type: string | ComponentType<any>,
  config: Config | null,
  ...children: ReactNode[]
): ReactElement {
  const props: Props = {};
  let key: string | null = null;
  let ref: any = null;
  let self: any = null;
  let source: any = null;

  if (config != null) {
    // Extract special props (key, ref) from config
    if (config.key !== undefined) {
      key = '' + config.key;
    }
    if (config.ref !== undefined) {
      ref = config.ref;
    }
    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;

    // Copy other props to the new props object
    for (const propName in config) {
      if (
        Object.prototype.hasOwnProperty.call(config, propName) &&
        !['key', 'ref', '__self', '__source'].includes(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // Process children
  const childrenLength = children.length;
  if (childrenLength === 1) {
    props.children = children[0];
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = children[i];
    }
    props.children = childArray;
  }

  // Apply default props for the type if it's a component with defaultProps
  if (typeof type === 'function' && (type as any).defaultProps) {
    const defaultProps = (type as any).defaultProps;
    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    _owner: null, // React uses this internally
    // Dev-only properties
    _store: {}, // Used in development for validation warnings
    _self: self,
    _source: source,
  };
}

function isValidElement(object: any): object is ReactElement {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}

function cloneElement(
  element: ReactElement,
  config: Config | null,
  ...children: ReactNode[]
): ReactElement {
  if (!isValidElement(element)) {
    throw new Error('cloneElement: not a valid React element.');
  }

  let props = { ...element.props };
  let key = element.key;
  let ref = element.ref;

  // Remaining props are the new props
  if (config != null) {
    if (config.ref !== undefined) {
      ref = config.ref;
    }
    if (config.key !== undefined) {
      key = '' + config.key;
    }

    // Resolve default props
    let defaultProps;
    if (element.type && (element.type as any).defaultProps) {
      defaultProps = (element.type as any).defaultProps;
    }
    for (let propName in config) {
      if (config.hasOwnProperty(propName) && !props.hasOwnProperty(propName)) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  // Resolve new children
  const childrenLength = children.length;
  if (childrenLength === 1) {
    props.children = children[0];
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = children[i];
    }
    props.children = childArray;
  }

  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: element.type,
    key: key,
    ref: ref,
    props: props,
    _owner: element._owner,
    _store: { ...element._store },
    _self: element._self,
    _source: element._source,
  };
}

export {
  type FunctionComponent,
  type ReactElement,
  cloneElement,
  createElement,
  isValidElement,
}
