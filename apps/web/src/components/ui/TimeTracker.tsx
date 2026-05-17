import { useState, useEffect, useRef } from 'react'
import { Pause, Square, Play } from 'lucide-react'

interface TimeTrackerProps {
  className?: string
}

export function TimeTracker({ className = '' }: TimeTrackerProps) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      if (ref.current) clearInterval(ref.current)
    }
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [running])

  function fmt(s: number) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  return (
    <div
      className={`p-5 flex flex-col justify-between ${className}`}
      style={{ background: 'var(--accent)', minHeight: '140px', borderRadius: 'var(--radius-island)', boxShadow: 'var(--shadow-island)' }}
    >
      <p className='text-sm font-semibold' style={{ color: 'rgba(255,255,255,0.75)' }}>Time Tracker</p>

      <p className='text-3xl font-bold tracking-wider tabular-nums' style={{ color: '#fff' }}>
        {fmt(seconds)}
      </p>

      <div className='flex gap-2'>
        <button
          onClick={() => setRunning((r) => !r)}
          className='flex h-9 w-9 items-center justify-center rounded-full transition-colors'
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
        >
          {running ? <Pause className='size-4' /> : <Play className='size-4' />}
        </button>
        <button
          onClick={() => { setRunning(false); setSeconds(0) }}
          className='flex h-9 w-9 items-center justify-center rounded-full transition-colors'
          style={{ background: 'var(--danger)', color: '#fff' }}
        >
          <Square className='size-4' />
        </button>
      </div>
    </div>
  )
}
