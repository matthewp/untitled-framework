import { createContext } from './context.js';
import { createElement } from './element.js';
import { forwardRef } from './ref.js';
import {
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useContext,
  useRef
} from './hooks.js';

const Framework = {
  createElement,
  forwardRef,
  createContext
};

export {
  Framework as default,

  createElement,
  forwardRef,
  createContext,

  useEffect,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
};
