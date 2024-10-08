import './style.css';
import "@radix-ui/themes/styles.css";
import { Flex, Theme, Text, Button } from "@radix-ui/themes";
import { useEffect, useRef, useState } from 'react';
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

function App() {
  return (
  	<Flex direction="column" gap="2">
			<Text>Hello from Radix Themes :)</Text>
			<Button>Let's go</Button>
		</Flex>
  );
}

let dom = (
  <Theme accentColor="crimson" grayColor="sand" radius="large" scaling="95%">
  	<App />
    <Toolbar />
  </Theme> 
);

dom = (
  <>
    <App />
    <Toolbar />
  </>
)

render(dom, document.querySelector('#app'));
