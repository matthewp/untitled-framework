import './style.css';
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

import { render } from 'react-dom';

function App() {
  return <div>Hello world</div>;
}

let dom = (
  <Theme>
  	<App />
  </Theme> 
);

render(dom, document.querySelector('#app'));
