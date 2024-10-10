import type { Context } from './context.js';
import { wipRoot, hookIndex, wipFiber, scheduleUpdate, setHookIndex } from './fiber.js';
import { Ref } from './ref.js';

// Hook types
interface EffectHook {
  tag: 'effect';
  effect: () => void | (() => void);
  cleanup: (() => void) | undefined;
  deps: any[] | undefined;
  lastDeps: any[] | undefined;
  workId: number | undefined;
}

interface LayoutEffectHook {
  tag: 'layout-effect';
  effect: () => void | (() => void);
  cleanup: (() => void) | undefined;
  deps: any[] | undefined;
  lastDeps: any[] | undefined;
}

interface ReducerHook<S, A> {
  tag: 'reducer';
  state: S;
  dispatch: (action: A) => void;
}

interface ImperativeHandleHook<T> {
  tag: 'imperative-handle';
  ref: Ref<T>;
  create: () => T;
  deps: any[] | undefined;
  lastDeps: any[] | undefined;
}

interface IdHook {
  tag: 'id';
  id: string;
}

interface MemoHook<T> {
  tag: 'memo';
  memoizedValue: T;
  deps: any[] | undefined;
}

interface CallbackHook<T extends Function> {
  tag: 'callback';
  callback: T;
  deps: any[] | undefined;
}

interface RefHook<T> {
  tag: 'ref';
  current: T;
}

type AnyHook = EffectHook | LayoutEffectHook | ReducerHook<any, any> | ImperativeHandleHook<any> | IdHook | MemoHook<any> | CallbackHook<any> | RefHook<any>;

// Base hook function
function baseHook<T extends AnyHook>(createHook: () => T): T {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as T | undefined;
  
  const hook = oldHook || createHook();

  wipFiber!.hooks!.push(hook);
  setHookIndex(hookIndex + 1);

  return hook;
}

// useState
function useState<T>(initial: T): [T, (action: T | ((prevState: T) => T)) => void] {
  return useReducer((state: T, action: T | ((prevState: T) => T)) => {
    return typeof action === 'function' ? (action as (prevState: T) => T)(state) : action;
  }, initial);
}

// useReducer
function useReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  init?: (initialState: S) => S
): [S, (action: A) => void] {
  const hook = baseHook(() => ({
    tag: 'reducer' as const,
    state: init ? init(initialState) : initialState,
    dispatch: null as any
  }));

  const currentFiber = wipFiber!;
  hook.dispatch = (action: A) => {
    const newState = reducer(hook.state, action);
    if (newState !== hook.state) {
      hook.state = newState;
      scheduleUpdate(currentFiber);
    }
  };

  return [hook.state, hook.dispatch];
}

// useEffect
function useEffect(effect: () => void | (() => void), deps?: any[]) {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as EffectHook | undefined;
  
  const hook: EffectHook = {
    tag: 'effect',
    effect,
    cleanup: undefined,
    deps,
    lastDeps: oldHook?.deps,
    workId: undefined,
  };

  wipFiber!.hooks!.push(hook);
  setHookIndex(hookIndex + 1);
}

// useLayoutEffect
function useLayoutEffect(effect: () => void | (() => void), deps?: any[]) {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as LayoutEffectHook | undefined;
  
  const hook: LayoutEffectHook = {
    tag: 'layout-effect',
    effect,
    cleanup: undefined,
    deps,
    lastDeps: oldHook?.deps,
  };

  wipFiber!.hooks!.push(hook);
  setHookIndex(hookIndex + 1);
}

// useImperativeHandle
function useImperativeHandle<T, R extends T>(
  ref: Ref<T>,
  create: () => R,
  deps?: any[]
): void {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as ImperativeHandleHook<T> | undefined;
  
  const hook: ImperativeHandleHook<T> = {
    tag: 'imperative-handle',
    ref,
    create,
    deps,
    lastDeps: oldHook?.deps,
  };

  wipFiber!.hooks!.push(hook);
  setHookIndex(hookIndex + 1);
}

// useId
let globalIdCounter = 0;

function useId(): string {
  return baseHook(() => ({
    tag: 'id' as const,
    id: `:r${globalIdCounter++}:`
  })).id;
}

// useMemo implementation
function useMemo<T>(factory: () => T, deps?: any[]): T {
  return baseHook(() => {
    const hook: MemoHook<T> = {
      tag: 'memo',
      memoizedValue: factory(),
      deps
    };
    return hook;
  }).memoizedValue;
}

// useCallback implementation
function useCallback<T extends Function>(callback: T, deps?: any[]): T {
  return baseHook(() => {
    const hook: CallbackHook<T> = {
      tag: 'callback',
      callback,
      deps
    };
    return hook;
  }).callback;
}

// useRef implementation
function useRef<T>(initialValue: T): { current: T } {
  return baseHook(() => {
    const hook: RefHook<T> = {
      tag: 'ref',
      current: initialValue
    };
    return hook;
  });
}

function useContext<T>(context: Context<T>): T {
  return context._currentValue;
}

export {
  type AnyHook,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useId
};
