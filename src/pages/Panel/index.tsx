import { createRoot } from 'react-dom/client';

import Panel from './Panel';
import './index.css';

const container = document.getElementById('app-container');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(<Panel />); 