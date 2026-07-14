// ============================================================
// 零点接线台 — 通用错误边界组件
// 包裹在 App / GameScreen 等关键节点，防止整个应用白屏
// ============================================================

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  /** 降级 UI 标题（可选） */
  title?: string
  /** 降级 UI 描述（可选） */
  description?: string
  /** 出错回调（例如上报日志） */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          padding: 32,
          gap: 12,
          color: 'var(--text-primary)',
        }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <h2 style={{ margin: 0, fontSize: 18, color: '#ef4444' }}>
            {this.props.title ?? '页面发生异常'}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, textAlign: 'center' }}>
            {this.props.description ?? '组件渲染过程中遇到意外错误。请尝试刷新页面或重试。'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{
              fontSize: 11, color: '#ff6b6b', maxWidth: '100%', overflow: 'auto',
              padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 6,
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            style={{
              padding: '8px 24px', backgroundColor: '#dc2626', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 'bold',
              cursor: 'pointer', marginTop: 4,
            }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
