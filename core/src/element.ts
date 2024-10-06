const REACT_ELEMENT_TYPE = Symbol.for('react.element');

// TODO this is not right
type ComponentType<T> = unknown;

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
  type: string | ComponentType<any>;
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

export {
  type ReactElement,
  createElement,
}
