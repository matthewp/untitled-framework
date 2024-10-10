import './style.css';
import "@radix-ui/themes/styles.css";
import { Flex, Theme, Text, Button } from "@radix-ui/themes";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { render } from 'react-dom'
import Toolbar from './src/Toolbar';

function Counter() {
  const [count, setCount] = useState(1);
  return (
    <div>
      <span>Count: {count}</span>
      <br />
      <button type="button" onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

function RadixApp() {
  const [count, setCount] = useState(0);
  return (
    <Theme accentColor="crimson" grayColor="sand" radius="large" scaling="95%">
    	<Flex direction="column" gap="2">
  			<Text>Hello from Radix Themes :)</Text>
  			<Button onClick={() => setCount(count + 1)}>Let's go {count}</Button>
        <Toolbar />
  		</Flex>
    </Theme>
  );
}

function ComplexApp() {
  const [name, setName] = useState('');
  return (
    <div>
      <div>Name: {name}</div>
      <input type="text" onChange={ev => {
        setName(ev.target.value);
      }} />
      <br />
      <Counter />      
    </div>
  )
}

function EffectApp() {
  const [val] = useState('value');
  const [other, setOther] = useState('other');
  useEffect(() => {
    console.log('In the effect');
    setOther('other2');
  }, [val]);
  return (
    <div>Value: {val}</div>
  )
}

function OuterApp() {
  return (
    <div>
      <EffectApp />
    </div>
  );
}

let dom = <RadixApp />;

render(dom, document.querySelector('#app'));
