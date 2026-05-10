import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './game/state/store'
import { CareerPackProvider } from './game/content/CareerPackProvider'
import './styles/global.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  (window as unknown as { __store: typeof store }).__store = store;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <CareerPackProvider>
        <App />
      </CareerPackProvider>
    </Provider>
  </StrictMode>,
)
