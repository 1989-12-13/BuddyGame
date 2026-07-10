import { useState, useEffect, useRef, type KeyboardEvent } from 'react'

export function TypewriterText({
  text,
  speed = 40,
  onComplete,
}: {
  text: string
  speed?: number
  onComplete?: () => void
}) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)
  const completedRef = useRef(false)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    completedRef.current = false

    if (!text) return

    const interval = setInterval(() => {
      indexRef.current += 1
      setDisplayed(text.slice(0, indexRef.current))

      if (indexRef.current >= text.length) {
        clearInterval(interval)
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      }
    }, speed)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  // Skip typewriter on click
  const handleSkip = () => {
    if (indexRef.current < text.length) {
      indexRef.current = text.length
      setDisplayed(text)
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.()
      }
    }
  }

  return (
    <span onClick={handleSkip} style={{ cursor: 'pointer' }}>
      {displayed}
      {indexRef.current < text.length && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            background: 'var(--accent-cyan)',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'blink-cursor 0.8s step-end infinite',
          }}
        />
      )}
    </span>
  )
}

export function DialogueBox({
  speakerName,
  text,
  isTyping,
  onTypingComplete,
  npcTrust,
  npcStance,
}: {
  speakerName: string
  text: string
  isTyping: boolean
  onTypingComplete?: () => void
  npcTrust?: number
  npcStance?: string
}) {
  const stanceLabel: Record<string, string> = {
    cooperative: '合作',
    neutral: '中立',
    resistant: '抗拒',
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(14,27,43,0.85) 0%, rgba(7,17,31,0.92) 100%)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(91,231,255,0.12)',
        borderRadius: '8px 8px 0 0',
        padding: 'var(--space-sm) var(--space-lg) var(--space-md)',
        position: 'relative',
        minHeight: 100,
        flexShrink: 0,
      }}
    >
      {/* Name tag + trust indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(91,231,255,0.1)',
            border: '1px solid rgba(91,231,255,0.2)',
            borderRadius: 2,
            padding: '2px 12px',
          }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.05em',
          }}>
            {speakerName}
          </span>
        </div>

        {/* Trust & Stance indicators */}
        {npcTrust !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>信任</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: npcTrust >= 60 ? 'var(--success-green)' : npcTrust >= 35 ? 'var(--alert-orange)' : 'var(--danger-red)',
                fontWeight: 600,
              }}>
                {npcTrust}
              </span>
            </div>
            {npcStance && (
              <span style={{
                padding: '1px 8px',
                borderRadius: 2,
                fontSize: 10,
                background: npcStance === 'cooperative' ? 'rgba(114,241,184,0.12)' :
                           npcStance === 'resistant' ? 'rgba(255,84,104,0.12)' :
                           'rgba(255,155,84,0.12)',
                color: npcStance === 'cooperative' ? 'var(--success-green)' :
                       npcStance === 'resistant' ? 'var(--danger-red)' :
                       'var(--alert-orange)',
              }}>
                {stanceLabel[npcStance] ?? npcStance}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dialogue text */}
      <div
        style={{
          fontSize: 'clamp(13px, 1.5vw, 16px)',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
          minHeight: 40,
        }}
      >
        {isTyping ? (
          <TypewriterText text={text} speed={35} onComplete={onTypingComplete} />
        ) : (
          text
        )}
      </div>
    </div>
  )
}

export function ChoiceButton({
  label,
  text,
  index,
  disabled,
  onClick,
}: {
  label: string
  text: string
  index: number
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        width: '100%',
        padding: '8px var(--space-md)',
        background: disabled ? 'rgba(14,27,43,0.5)' : 'rgba(14,27,43,0.8)',
        border: '1px solid rgba(91,231,255,0.12)',
        borderRadius: 2,
        color: disabled ? 'var(--text-secondary)' : 'var(--text-primary)',
        fontSize: 'clamp(12px, 1.3vw, 14px)',
        textAlign: 'left',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s ease',
        animation: `fade-in-up 0.3s ease-out ${index * 0.08}s both`,
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'rgba(91,231,255,0.4)'
          e.currentTarget.style.background = 'rgba(14,27,43,0.95)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(91,231,255,0.12)'
        e.currentTarget.style.background = 'rgba(14,27,43,0.8)'
      }}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: 2,
        background: 'rgba(91,231,255,0.15)',
        color: 'var(--accent-cyan)',
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {label}
      </span>
      <span>{text}</span>
    </button>
  )
}

export function FreeInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
}) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-sm)',
        animation: 'fade-in-up 0.3s ease-out 0.35s both',
      }}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(14,27,43,0.8)',
        border: '1px solid rgba(91,231,255,0.12)',
        borderRadius: 2,
        padding: '0 var(--space-md)',
      }}>
        <span style={{
          color: 'var(--text-secondary)',
          fontSize: 13,
          marginRight: 8,
          flexShrink: 0,
        }}>
          ⌨
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="自由沟通：输入你的真实指令……"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 14,
            padding: '10px 0',
          }}
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        style={{
          padding: '10px 16px',
          background: value.trim() ? 'rgba(91,231,255,0.15)' : 'rgba(14,27,43,0.5)',
          border: `1px solid ${value.trim() ? 'rgba(91,231,255,0.25)' : 'rgba(91,231,255,0.08)'}`,
          borderRadius: 2,
          color: value.trim() ? 'var(--accent-cyan)' : 'var(--text-secondary)',
          fontSize: 13,
          fontWeight: 500,
          cursor: value.trim() ? 'pointer' : 'default',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
        }}
      >
        发送
      </button>
    </div>
  )
}
