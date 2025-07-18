import { createRoot } from 'react-dom/client';

import Newtab from './Newtab';
import './index.css';

const container = document.getElementById('app-container');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(<Newtab />); 