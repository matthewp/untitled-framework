import type { AnyHook } from './hooks.js';
import type {
  FunctionComponent,
  ReactElement
} from './element.js';
import type { Context } from './context.js';
import { isCommitting, pendingUpdates, workLoop } from './reconcile.js';
import { scheduleWork } from './scheduler.js';

// Effect tags
const Placement = 'PLACEMENT';
const Update = 'UPDATE';
const Deletion = 'DELETION';

interface Fiber {
  type: string | FunctionComponent<any> | Context<any>;
  props: FiberProps;
  dom: Element | Text | null;
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: Fiber | null;
  effectTag: string | null;
  hooks: AnyHook[] | null;
  ref: any;
}

// Shared variables
let wipRoot: Fiber | null = null;
let currentRoot: Fiber | null = null;
let nextUnitOfWork: Fiber | null = null;
let deletions: Fiber[] = [];
let wipFiber: Fiber | null = null;
let hookIndex: number = 0;

interface FiberProps {
  children?: ReactElement[] | string;
  [key: string]: any;  // For other properties and event handlers
}

// Shared utility functions
function createFiber(
  type: string | FunctionComponent<any> | Context<any>,
  props: FiberProps,
  dom: Element | Text | null = null,
  ref: any = null
): Fiber {
  return {
    type,
    props,
    ref,
    dom,
    parent: null,
    child: null,
    sibling: null,
    alternate: null,
    effectTag: null,
    hooks: null,
  };
}

function scheduleUpdate(fiber: Fiber) {
  if(isCommitting) {
    pendingUpdates.push(fiber);
  } else {
    let wipFiber = createFiber(fiber.type, fiber.props, fiber.dom);
    wipFiber.alternate = fiber;
    wipFiber.effectTag = Update;
    pendingUpdates.push(wipFiber);
    fiber.alternate = wipFiber;

    scheduleWork(workLoop);
  }
}

function setNextUnitOfWork(fiber: Fiber | null) {
  nextUnitOfWork = fiber;
}

function setCurrentRoot(fiber: Fiber | null) {
  currentRoot = fiber;
}

function setWipRoot(fiber: Fiber | null) {
  wipRoot = fiber;
}

function setWipFiber(fiber: Fiber) {
  wipFiber = fiber;
}

function setHookIndex(index: number) {
  hookIndex = index;
}

export {
  type Fiber,
  type FiberProps,
  Placement,
  Update,
  Deletion,
  createFiber,
  scheduleUpdate,
  nextUnitOfWork,
  deletions,
  wipRoot,
  currentRoot,
  wipFiber,
  hookIndex,
  setHookIndex,
  setNextUnitOfWork,
  setCurrentRoot,
  setWipRoot,
  setWipFiber,
}
