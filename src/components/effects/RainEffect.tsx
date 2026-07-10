export function RainEffect() {
  const drops = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${0.4 + Math.random() * 0.6}s`,
    height: `${10 + Math.random() * 25}px`,
    opacity: 0.1 + Math.random() * 0.35,
  }))

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {drops.map((d) => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            left: d.left,
            top: -30,
            width: 1,
            height: d.height,
            background: `rgba(180,210,240,${d.opacity})`,
            animation: `rain-drop ${d.duration} linear ${d.delay} infinite`,
          }}
        />
      ))}

      {/* Lightning flash */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(200,220,255,0.06)',
          animation: 'lightning-flash 8s ease-out infinite',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
