import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/dm-sans'
import './index.css'
import App from './App.tsx'
import { getBrowserStorage, loadSettings } from './lib/storage.ts'

// apply a pinned theme before the first paint to avoid a flash
const theme = loadSettings(getBrowserStorage()).theme
if (theme !== 'system') document.documentElement.dataset.theme = theme

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
