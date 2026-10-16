import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import App from './App';
import './styles.css';
// Feature overrides must follow the original site's responsive rules.
import './phase2.css';
import './phase3.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
