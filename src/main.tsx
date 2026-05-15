import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './game/state/store'
import { CareerPackProvider } from './game/content/CareerPackProvider'
import { DevControlsProvider } from './game/dev/DevControlsProvider'
import { initAnalytics } from './game/analytics/track'
import './styles/global.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  (window as unknown as { __store: typeof store }).__store = store;
}

initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <CareerPackProvider>
        <DevControlsProvider>
          <App />
        </DevControlsProvider>
      </CareerPackProvider>
    </Provider>
  </StrictMode>,
)
