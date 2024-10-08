import { Children } from './children.js';
import { createContext } from './context.js';
import { cloneElement, createElement, isValidElement } from './element.js';
import { Fragment } from './fragment.js';
import { forwardRef } from './ref.js';
import {
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useContext,
  useReducer,
  useRef
} from './hooks.js';

const Framework = {
  Children,
  createElement,
  forwardRef,
  createContext,

  useEffect,
  useCallback,
  useState,
  useLayoutEffect,
  useMemo,
  useContext,
  useReducer,
  useRef
};

export {
  Framework as default,

  Children,
  cloneElement,
  createElement,
  forwardRef,
  Fragment,
  createContext,
  isValidElement,

  useEffect,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState
};
