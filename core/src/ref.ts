import { ReactElement } from './element';

// Define our own Ref type
type RefObject<T> = {
  current: T | null;
};
type Ref<T> = ((instance: T | null) => void) | RefObject<T>; 
type NullableRef<T> = Ref<T> | null;

// Define basic types that would normally come from React
type PropsWithChildren<P> = P & { children?: ReactElement | ReactElement[] };
type ComponentType<P = {}> = (props: P) => ReactElement | null;

type ForwardRefRenderFunction<T, P = {}> = ((
  props: P,
  ref: NullableRef<T>
) => ReactElement | null) & {
  displayName?: string;
};

interface ExoticComponent<P = {}> {
  (props: P): ReactElement | null;
  readonly $$typeof: symbol;
}

type PropsWithoutRef<P> = P extends { ref?: infer R } 
  ? Pick<P, Exclude<keyof P, 'ref'>> 
  : P;

type RefAttributes<T> = {
  ref?: NullableRef<T>;
};

interface ForwardRefExoticComponent<T, P = {}> 
  extends ExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  defaultProps?: Partial<P>;
  propTypes?: {
    [key in keyof P]?: any;
  };
  displayName?: string;
}

function forwardRef<T, P = {}>(
  render: ForwardRefRenderFunction<T, P>
): ForwardRefExoticComponent<T, P> {
  const ForwardRefComponent = function(
    props: PropsWithoutRef<P>,
    ref: NullableRef<T>
  ) {
    return render(props as any, ref);
  } as ForwardRefExoticComponent<T, P>;

  ForwardRefComponent.displayName = 
    render.displayName || render.name || 'ForwardRefComponent';

  (ForwardRefComponent as any).$$typeof = Symbol.for('react.forward_ref');

  return ForwardRefComponent;
}

export {
  forwardRef,
  type Ref,
  ForwardRefExoticComponent,
  ForwardRefRenderFunction
};
