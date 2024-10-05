const _tree = '~ad.tree~' as const;
type TreeSymbol = typeof _tree;

const isTreeSymbol = (item: unknown): item is TreeSymbol => item === _tree;

function createTree(): Tree {
  let out: Tree = [_tree];
  return out;
}

const Fragment = (_p: any, children: any) => {
  let tree = createTree();
  pushChildren(tree, children);
  return tree;
};

function isPrimitive(type: string) {
  return type === 'string' || type === 'number' || type === 'boolean';
}

const eventAttrExp = /^on[A-Z]/;
function signal(
  _tagName: string,
  attrName: string,
  attrValue: any,
  attrs: Record<string, any>
) {
  if (eventAttrExp.test(attrName)) {
    let eventName = attrName.toLowerCase();
    return [1, eventName, attrValue];
  }
}

function pushChild(tree: Tree, child: any) {
  if (child != null && !Array.isArray(child)) {
    if (false && isPID(child)) {
      tree.push([5, child]);
    } else if (child !== false) {
      tree.push([4, child + '']);
    }
    return;
  } else if (false && isBlessedString(child)) {
    tree.push([4, child]);
    return;
  }

  while (child && child.length) {
    let item = child.shift();
    if (false && isPID(item)) {
      tree.push([5, item]);
      continue;
    } else if (isTreeSymbol(item)) {
      continue;
    } else if (false && isTree(item)) {
      pushChild(tree, item);
      continue;
    }
    tree.push(item);
  }
}

function pushChildren(tree: Tree, children: any) {
  if (Array.isArray(children)) {
    if (false && isBlessedString(children)) {
      pushChild(tree, children);
    } else {
      children.forEach((child) => pushChild(tree, child));
    }
  } else if (typeof children === 'object') {
    pushChild(tree, children);
  }
}

function jsx(type: any, props: any, key: any, __self: any, __source: any) {
  let children = props?.children;
  let childrenType = typeof props?.children;

  if ((false && isTree(children)) || isPrimitive(childrenType)) {
    children = [children];
  }

  let isFn = typeof type === 'function';

  if (isFn) {
    return type(props || {}, children);
  }

  let tree = createTree();
  let uniq: any, evs: Array<any> | undefined;
  if (props) {
    props = Object.keys(props).reduce(function (acc, key) {
      let value = (props as any)[key];

      let eventInfo = signal(type as any, key, value, props as any);
      if (eventInfo) {
        if (!evs) evs = [];
        evs.push(eventInfo);
      } else if (key === 'key') {
        uniq = value;
      } else if (key === 'children') {
        return acc;
      } else {
        // @ts-ignore
        acc.push(key);
        // @ts-ignore
        acc.push(value);
      }

      return acc;
    }, []);
  }

  if (false && isPID(type)) {
    let _tree = createTree();
    pushChildren(_tree, children);
    tree.push([5, type, _tree]);
  } else {
    let open = [1, type, uniq];
    if (props) {
      open.push(props);
    }
    if (evs) {
      open.push(evs);
    }
    tree.push(open as any);
    pushChildren(tree, children);
    tree.push([2, type]);
  }

  return tree;
}

export { jsx, jsx as jsxs, jsx as jsxDEV, Fragment };
