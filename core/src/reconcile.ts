import type {
  ReactElement
} from './element.js';
import type { ProviderType } from './context.js';
import { scheduleWork } from './scheduler.js';
import { shouldYield } from './yield.js';
import {
  type Fiber,
  Placement,
  Update,
  Deletion,
  createFiber,
  deletions,
  wipFiber,
  wipRoot,
  currentRoot,
  nextUnitOfWork,
  scheduleUpdate,
  setNextUnitOfWork,
  setHookIndex,
  setCurrentRoot,
  setWipRoot,
  setWipFiber
} from './fiber.js';
import { isFragment, createFragment } from './fragment.js';

function render(element: ReactElement, container: Element | Text) {
  const newFiber = createFiber(container.nodeName, { children: [element] }, container);
  newFiber.alternate = currentRoot;

  if(currentRoot) {
    currentRoot.alternate = newFiber;
  }

  setWipRoot(newFiber);
  setNextUnitOfWork(newFiber);

  scheduleWork(workLoop);
}

function workLoop() {
  while (nextUnitOfWork && !shouldYield()) {
    setNextUnitOfWork(performUnitOfWork(nextUnitOfWork));
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  if (fiber.type && (fiber.type as any).$$typeof === Symbol.for('react.provider')) {
    updateContextProvider(fiber);
  } else if (fiber.type === (createFragment as any)) {
    updateFragmentComponent(fiber);
  } else if (typeof fiber.type === 'function') {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  return null;
}

function updateFunctionComponent(fiber: Fiber) {
  setWipFiber(fiber);
  setHookIndex(0);
  wipFiber!.hooks = [];
  const children = (fiber.type as Function)(fiber.props);
  reconcileChildren(fiber, children);
}

function updateContextProvider(fiber: Fiber) {
  // Update the context value
  const context = (fiber.type as unknown as ProviderType<any>)._context;
  context._currentValue = fiber.props.value;
  // Reconcile children
  if(fiber.props.children !== undefined) {
    reconcileChildren(fiber, fiber.props.children);
  }
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  if(fiber.props.children !== undefined) {
    reconcileChildren(fiber, fiber.props.children);
  }
}

function updateFragmentComponent(fiber: Fiber) {
  const children = fiber.props.children;
  reconcileChildren(fiber, children as any);
}

type ReconciledChildrenElements = (ReactElement | string)[] | ReactElement | string;

function reconcileChildren(wipFiber: Fiber, elements: ReconciledChildrenElements) {
  if (elements == null) {
    // If elements is null, reconcile with an empty array
    reconcileChildrenArray(wipFiber, wipFiber.alternate?.child || null, []);
  } else if (Array.isArray(elements)) {
    reconcileChildrenArray(wipFiber, wipFiber.alternate?.child || null, elements);
  } else {
    // Handle single child
    reconcileChildrenArray(wipFiber, wipFiber.alternate?.child || null, [elements]);
  }
}

function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: (ReactElement | string)[]
): Fiber | null {
  let index = 0;
  let oldFiber = currentFirstChild;
  let newFiber: Fiber | null = null;
  let prevSibling: Fiber | null = null;

  for (; index < newChildren.length; index++) {
    const newChild = newChildren[index];
    const isTextElement = typeof newChild === 'string' || typeof newChild === 'number';

    if (isFragment(newChild)) {
      // Recursively reconcile Fragment children
      reconcileChildrenArray(returnFiber, oldFiber, newChild.props.children);
    } else {
      const sameType = 
        oldFiber && 
        ((isTextElement && oldFiber.type === 'TEXT_ELEMENT') ||
         (!isTextElement && oldFiber.type === newChild.type));

      if (sameType) {
        // Update the existing Fiber
        newFiber = {
          ...oldFiber!,
          props: isTextElement ? { nodeValue: newChild } : newChild.props,
          ref: (newChild as ReactElement).ref,
          alternate: oldFiber,
          effectTag: Update,
        };
      } else {
        if (oldFiber) {
          // Delete the old Fiber
          oldFiber.effectTag = Deletion;
          deletions.push(oldFiber);
        }
        // Create a new Fiber
        if(isTextElement) {
          newFiber = createFiber('TEXT_ELEMENT', { nodeValue: newChild }, null);
        } else {
          newFiber = createFiber(newChild.type, newChild.props, null);
          newFiber.ref = (newChild as ReactElement).ref;
        }
        newFiber.effectTag = Placement;
      }

      newFiber.parent = returnFiber;

      if (index === 0) {
        returnFiber.child = newFiber;
      } else if (prevSibling) {
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
  }

  // If there are more old Fibers than new children, delete the extras
  while (oldFiber) {
    oldFiber.effectTag = Deletion;
    deletions.push(oldFiber);
    oldFiber = oldFiber.sibling;
  }

  return returnFiber.child;
}

function createDom(fiber: Fiber): Element | Text | null {
  if (typeof fiber.type === 'string') {
    const dom =
      fiber.type === 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props);
    return dom;
  } else if (typeof fiber.type === 'function') {
    // Function components don't have a direct DOM representation
    return null;
  } else if (fiber.type && (fiber.type as any).$$typeof === Symbol.for('react.provider')) {
    // Context Providers don't have a direct DOM representation
    return null;
  } else if (fiber.type && (fiber.type as any).$$typeof === Symbol.for('react.context')) {
    // Context Consumers don't have a direct DOM representation
    return null;
  } else {
    console.warn('Unknown fiber type:', fiber.type);
    return null;
  }
}

const setAsAttr = new Set(['style']);

function updateDom(dom: Element | Text, prevProps: any, nextProps: any) {
  switch(dom.nodeType) {
    case 1: {
      updateDomElement(dom as Element, prevProps, nextProps);
      break;
    }
    case 3: {
      updateDomText(dom as Text, nextProps);
      break;
    }
  }
  
}

function updateDomElement(dom: Element, prevProps: any, nextProps: any) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(key => !(key in nextProps))
    .forEach(name => {
      (dom as any)[name] = '';
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      if(name.startsWith('data-') || name.startsWith('aria-')) {
        (dom as any).setAttribute(name, nextProps[name]);
      } else {
        (dom as any)[name] = nextProps[name];
      }
    });

  // Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });

  // Special handling for style prop
  if ('style' in prevProps || 'style' in nextProps) {
    const prevStyle = prevProps.style || {};
    const nextStyle = nextProps.style || {};

    // Remove old styles
    for (let key in prevStyle) {
      if (!(key in nextStyle)) {
        (dom as HTMLElement).style[key as any] = '';
      }
    }

    // Set new or changed styles
    for (let key in nextStyle) {
      if (prevStyle[key] !== nextStyle[key]) {
        let value = nextStyle[key];
        if (typeof value === 'number' && !isUnitlessNumber[key]) {
          value = value + 'px';
        }
        if(key.startsWith('--')) {
           (dom as HTMLElement).style.setProperty(key, value); 
        } else {
           (dom as HTMLElement).style[key as any] = value; 
        }
      }
    }
  }
}

function setRef(ref: string | ((instance: any) => void) | { current: any } | null, value: any) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref !== null && typeof ref === 'object') {
    ref.current = value;
  }
}

function updateDomText(dom: Text, nextProps: any) {
  dom.nodeValue = nextProps.nodeValue;
}

const isUnitlessNumber: { [key: string]: boolean } = {
  animationIterationCount: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true,
};

let isCommitting = false;
let pendingUpdates: Fiber[] = [];

function commitRoot() {
  isCommitting = true;
  deletions.forEach(commitWork);
  commitWork(wipRoot!.child);
  
  runLayoutEffects(wipRoot!);

  const finishedWork = wipRoot!;
  
  const workId = scheduleWork(() => runEffects(finishedWork));
  storeEffectWorkId(finishedWork, workId);

  setCurrentRoot(finishedWork);
  setWipRoot(null);

  isCommitting = false;

  // Process any updates that were scheduled during the commit phase
  while (pendingUpdates.length > 0) {
    const update = pendingUpdates.shift();
    scheduleUpdate(update!);
  }
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber!.dom;

  if (fiber.effectTag === Placement && fiber.dom != null) {
    domParent?.appendChild(fiber.dom);
    if (fiber.ref) {
      setRef(fiber.ref, fiber.dom);
    }
  } else if (fiber.effectTag === Update && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props);
    if (fiber.ref !== fiber.alternate?.ref) {
      if (fiber.alternate?.ref) {
        setRef(fiber.alternate.ref, null);
      }
      if (fiber.ref) {
        setRef(fiber.ref, fiber.dom);
      }
    }
  } else if (fiber.effectTag === Deletion && domParent) {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber, domParent: Element | Text) {
  if (fiber.dom) {
    commitDeletionSingle(fiber, domParent);
  } else {
    // Recursively find and remove child DOM nodes
    commitDeletionRecursive(fiber, domParent);
  }
}

function commitDeletionSingle(fiber: Fiber, domParent: Element | Text) {
  if (fiber.ref) {
    setRef(fiber.ref, null);
  }
  if(fiber.dom!.parentNode)
    domParent.removeChild(fiber.dom!);
}

function commitDeletionRecursive(fiber: Fiber, domParent: Element | Text) {
  if (fiber.dom) {
    commitDeletionSingle(fiber, domParent);
  } else if (fiber.child) {
    commitDeletionRecursive(fiber.child, domParent);
  }  
  // After processing the child, move to the sibling
  if (fiber.sibling) {
    commitDeletionRecursive(fiber.sibling, domParent);
  }
}

function isEvent(key: string) {
  return key.startsWith('on');
}

function isProperty(key: string) {
  return key !== 'children' && !isEvent(key);
}

function isNew(prev: any, next: any) {
  return (key: string) => prev[key] !== next[key];
}

function runLayoutEffects(fiber: Fiber) {
  if (!fiber) return;

  if (fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      if (hook.tag === 'layout-effect') {
        if (hook.cleanup) {
          hook.cleanup();
        }
        const cleanup = hook.effect();
        if (typeof cleanup === 'function') {
          hook.cleanup = cleanup;
        }
      } else if (hook.tag === 'imperative-handle') {
        const value = hook.create();
        if (typeof hook.ref === 'function') {
          hook.ref(value);
        } else if (hook.ref !== null) {
          hook.ref.current = value;
        }
      }
    });
  }

  runLayoutEffects(fiber.child!);
  runLayoutEffects(fiber.sibling!);
}

function runEffects(fiber: Fiber) {
  if (!fiber) return;

  if (fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      if (hook.tag === 'effect') {
        if (hook.cleanup) {
          hook.cleanup();
        }
        const cleanup = hook.effect();
        if (typeof cleanup === 'function') {
          hook.cleanup = cleanup;
        }
        hook.workId = undefined;
      }
    });
  }

  runEffects(fiber.child!);
  runEffects(fiber.sibling!);
}

function storeEffectWorkId(fiber: Fiber, workId: number) {
  if (!fiber) return;

  if (fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      if (hook.tag === 'effect') {
        hook.workId = workId;
      }
    });
  }

  storeEffectWorkId(fiber.child!, workId);
  storeEffectWorkId(fiber.sibling!, workId);
}

export {
  isCommitting,
  pendingUpdates,
  render
};
