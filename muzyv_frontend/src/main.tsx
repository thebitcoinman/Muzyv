import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => {
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.top = '0';
  el.style.left = '0';
  el.style.width = '100%';
  el.style.background = 'red';
  el.style.color = 'white';
  el.style.padding = '20px';
  el.style.zIndex = '99999';
  el.innerText = 'Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno;
  document.body.appendChild(el);
});

window.addEventListener('unhandledrejection', (e) => {
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.top = '50px';
  el.style.left = '0';
  el.style.width = '100%';
  el.style.background = 'darkred';
  el.style.color = 'white';
  el.style.padding = '20px';
  el.style.zIndex = '99999';
  el.innerText = 'Unhandled Promise Rejection: ' + e.reason;
  document.body.appendChild(el);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
