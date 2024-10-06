import type { ReactElement } from './element.js';
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
  setNextUnitOfWork,
  setHookIndex,
  setCurrentRoot,
  setWipRoot,
  setWipFiber
} from './fiber.js';

function render(element: ReactElement, container: Element | Text) {
  setWipRoot(createFiber(container.nodeName, { children: [element] }, container));
  wipRoot!.alternate = currentRoot;
  setNextUnitOfWork(wipRoot!);

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
  if (typeof fiber.type === 'function') {
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
  const children = [(fiber.type as Function)(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber: Fiber, elements: any[]) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling: Fiber | null = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    const sameType =
      oldFiber &&
      element &&
      element.type === oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: Update,
        hooks: oldFiber!.hooks,
        child: null,
        sibling: null,
      };
    }
    if (element && !sameType) {
      newFiber = createFiber(element.type, element.props);
      newFiber.effectTag = Placement;
      newFiber.parent = wipFiber;
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = Deletion;
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling!.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

function createDom(fiber: Fiber): Element | Text {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props);

  return dom;
}

function updateDom(dom: Element | Text, prevProps: any, nextProps: any) {
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
      (dom as any)[name] = nextProps[name];
    });

  // Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot!.child);
  
  runLayoutEffects(wipRoot!);
  
  const workId = scheduleWork(() => runEffects(wipRoot!));
  storeEffectWorkId(wipRoot!, workId);

  setCurrentRoot(wipRoot);
  setWipRoot(null);
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
  } else if (fiber.effectTag === Update && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props);
  } else if (fiber.effectTag === Deletion && domParent) {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber, domParent: Element | Text) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child!, domParent);
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
  render
};
