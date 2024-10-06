
// Symbol definitions
const REACT_PROVIDER_TYPE = Symbol.for('react.provider');
const REACT_CONTEXT_TYPE = Symbol.for('react.context');

// Types
type Subscriber<T> = (value: T) => void;

interface ReactProviderType<T> {
  $$typeof: symbol;
  _context: ReactContext<T>;
}

interface ReactContext<T> {
  $$typeof: symbol;
  Provider: ReactProviderType<T>;
  Consumer: ReactContext<T>;
  _currentValue: T;
  _currentValue2: T;
  _threadCount: number;
  _defaultValue: T;
  _globalName: string | null;
  _calculateChangedBits: ((a: T, b: T) => number) | null;
  _subscribers: Set<Subscriber<T>>;
}

function createContext<T>(defaultValue: T): ReactContext<T> {
  const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    Provider: ({
      $$typeof: REACT_PROVIDER_TYPE,
      _context: null as any, // Will be set below
    } as ReactProviderType<T>),
    Consumer: null as any, // Will be set to context itself
    _currentValue: defaultValue,
    _currentValue2: defaultValue, // Used for concurrent mode
    _threadCount: 0,
    _defaultValue: defaultValue,
    _globalName: null, // Used for DevTools
    _calculateChangedBits: null,
    _subscribers: new Set(),
  };

  context.Provider._context = context;
  context.Consumer = context;

  if (process.env.NODE_ENV !== 'production') {
    (context as any)._currentRenderer = null;
    (context as any)._currentRenderer2 = null;
  }

  return context;
}

export {
  type ReactContext as Context,
  createContext
};
