import { useEffect, useRef, memo } from 'react'
import { useTheme } from './ThemeProvider'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  type: 'atom' | 'electron' | 'molecule'
  orbitRadius?: number
  orbitSpeed?: number
  orbitAngle?: number
  connections: number[]
}

function ScientificBackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (theme !== 'scientific') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Color palette for scientific theme
    const colors = {
      primary: 'rgba(6, 182, 212, ',      // cyan-500
      secondary: 'rgba(139, 92, 246, ',   // violet-500
      accent: 'rgba(59, 130, 246, ',      // blue-500
      highlight: 'rgba(16, 185, 129, ',   // emerald-500
      glow: 'rgba(34, 211, 238, ',        // cyan-400
    }

    // Initialize particles
    const initParticles = () => {
      const particles: Particle[] = []
      const atomCount = Math.floor((canvas.width * canvas.height) / 25000)
      const electronCount = atomCount * 2

      // Create atoms (larger, slower particles)
      for (let i = 0; i < atomCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 4 + 3,
          color: Object.values(colors)[Math.floor(Math.random() * 4)],
          type: 'atom',
          connections: [],
        })
      }

      // Create electrons (smaller, faster, orbiting particles)
      for (let i = 0; i < electronCount; i++) {
        const parentAtom = particles[Math.floor(Math.random() * atomCount)]
        particles.push({
          x: parentAtom.x,
          y: parentAtom.y,
          vx: 0,
          vy: 0,
          radius: 2,
          color: colors.glow,
          type: 'electron',
          orbitRadius: Math.random() * 30 + 20,
          orbitSpeed: (Math.random() - 0.5) * 0.04,
          orbitAngle: Math.random() * Math.PI * 2,
          connections: [],
        })
      }

      return particles
    }

    particlesRef.current = initParticles()

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    const animate = () => {
      // Clear canvas completely each frame to prevent trailing
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current
      const atoms = particles.filter(p => p.type === 'atom')
      const electrons = particles.filter(p => p.type === 'electron')

      // Update and draw atoms
      atoms.forEach((atom, i) => {
        // Mouse repulsion
        const dx = mouseRef.current.x - atom.x
        const dy = mouseRef.current.y - atom.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const force = (150 - dist) / 150
          atom.vx -= (dx / dist) * force * 0.02
          atom.vy -= (dy / dist) * force * 0.02
        }

        // Update position
        atom.x += atom.vx
        atom.y += atom.vy

        // Boundary bounce
        if (atom.x < 0 || atom.x > canvas.width) atom.vx *= -1
        if (atom.y < 0 || atom.y > canvas.height) atom.vy *= -1

        // Keep in bounds
        atom.x = Math.max(0, Math.min(canvas.width, atom.x))
        atom.y = Math.max(0, Math.min(canvas.height, atom.y))

        // Draw atom with clean glow (no blur)
        const gradient = ctx.createRadialGradient(
          atom.x, atom.y, 0,
          atom.x, atom.y, atom.radius * 2.5
        )
        gradient.addColorStop(0, atom.color + '0.8)')
        gradient.addColorStop(0.4, atom.color + '0.4)')
        gradient.addColorStop(0.7, atom.color + '0.1)')
        gradient.addColorStop(1, atom.color + '0)')
        
        ctx.beginPath()
        ctx.arc(atom.x, atom.y, atom.radius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Core of the atom
        ctx.beginPath()
        ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2)
        ctx.fillStyle = atom.color + '1)'
        ctx.fill()
        
        // Highlight
        ctx.beginPath()
        ctx.arc(atom.x - atom.radius * 0.3, atom.y - atom.radius * 0.3, atom.radius * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fill()

        // Draw connections between nearby atoms
        atoms.forEach((other, j) => {
          if (i >= j) return
          const dx = other.x - atom.x
          const dy = other.y - atom.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 150) {
            const opacity = (1 - distance / 150) * 0.3
            ctx.beginPath()
            ctx.moveTo(atom.x, atom.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`
            ctx.lineWidth = 1
            ctx.stroke()

            // Draw molecular bond in the middle
            if (distance < 80) {
              const midX = (atom.x + other.x) / 2
              const midY = (atom.y + other.y) / 2
              ctx.beginPath()
              ctx.arc(midX, midY, 2, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(139, 92, 246, ${opacity * 2})`
              ctx.fill()
            }
          }
        })
      })

      // Update and draw electrons
      electrons.forEach((electron, i) => {
        const parentAtom = atoms[i % atoms.length]
        if (!electron.orbitAngle || !electron.orbitRadius || !electron.orbitSpeed) return

        electron.orbitAngle += electron.orbitSpeed
        electron.x = parentAtom.x + Math.cos(electron.orbitAngle) * electron.orbitRadius
        electron.y = parentAtom.y + Math.sin(electron.orbitAngle) * electron.orbitRadius

        // Draw subtle orbit path (thin solid line)
        ctx.beginPath()
        ctx.arc(parentAtom.x, parentAtom.y, electron.orbitRadius, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.06)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Draw electron with soft glow
        const electronGradient = ctx.createRadialGradient(
          electron.x, electron.y, 0,
          electron.x, electron.y, electron.radius * 3
        )
        electronGradient.addColorStop(0, 'rgba(34, 211, 238, 1)')
        electronGradient.addColorStop(0.3, 'rgba(34, 211, 238, 0.5)')
        electronGradient.addColorStop(1, 'rgba(34, 211, 238, 0)')
        
        ctx.beginPath()
        ctx.arc(electron.x, electron.y, electron.radius * 3, 0, Math.PI * 2)
        ctx.fillStyle = electronGradient
        ctx.fill()

        ctx.beginPath()
        ctx.arc(electron.x, electron.y, electron.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(34, 211, 238, 1)'
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [theme])

  if (theme !== 'scientific') return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ background: 'transparent', zIndex: -10, opacity: 0.5 }}
    />
  )
}

export const ScientificBackground = memo(ScientificBackgroundCanvas)
