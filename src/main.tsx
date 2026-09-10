import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './app/App.tsx'

// 设计令牌预览页（开发用）：http://localhost:5173/?preview=tokens
const DesignSystemPreview = lazy(() =>
  import('./screens/DesignSystemPreview').then((m) => ({ default: m.DesignSystemPreview })),
)

const isTokenPreview =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('preview') === 'tokens'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isTokenPreview ? (
      <Suspense fallback={null}>
        <DesignSystemPreview />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
