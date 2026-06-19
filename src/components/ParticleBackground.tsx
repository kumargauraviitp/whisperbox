import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const frameRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const isMobile = window.innerWidth < 640
    const particleCount = isMobile ? 25 : 55

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 30

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0a0a0f, 1)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const colors = [0x00f2ff, 0xff00a0, 0x7b2ff7, 0x00ff88]

    const geometries = [
      new THREE.IcosahedronGeometry(0.5, 0),
      new THREE.TetrahedronGeometry(0.6, 0),
      new THREE.OctahedronGeometry(0.4, 0),
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
    ]

    const particles: {
      mesh: THREE.Mesh
      speedX: number
      speedY: number
      speedZ: number
      rotX: number
      rotY: number
      rotZ: number
      baseX: number
      baseY: number
    }[] = []

    for (let i = 0; i < particleCount; i++) {
      const geo = geometries[Math.floor(Math.random() * geometries.length)]
      const color = colors[Math.floor(Math.random() * colors.length)]
      const material = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      })
      const mesh = new THREE.Mesh(geo, material)
      const x = (Math.random() - 0.5) * 50
      const y = (Math.random() - 0.5) * 40
      const z = (Math.random() - 0.5) * 30
      mesh.position.set(x, y, z)
      scene.add(mesh)

      particles.push({
        mesh,
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() - 0.5) * 0.02,
        speedZ: (Math.random() - 0.5) * 0.01,
        rotX: (Math.random() - 0.5) * 0.01,
        rotY: (Math.random() - 0.5) * 0.01,
        rotZ: (Math.random() - 0.5) * 0.005,
        baseX: x,
        baseY: y,
      })
    }

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00f2ff,
      transparent: true,
      opacity: 0.15,
    })
    const lineGeometry = new THREE.BufferGeometry()
    const linePositions = new Float32Array(particleCount * particleCount * 6)
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lines)

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)

      const mx = mouseRef.current.x * 0.5
      const my = mouseRef.current.y * 0.5

      let lineIndex = 0
      const lineThreshold = 12

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.mesh.position.x += p.speedX
        p.mesh.position.y += p.speedY
        p.mesh.position.z += p.speedZ

        p.mesh.position.x += (p.baseX + mx - p.mesh.position.x) * 0.001
        p.mesh.position.y += (p.baseY - my - p.mesh.position.y) * 0.001

        p.mesh.rotation.x += p.rotX
        p.mesh.rotation.y += p.rotY
        p.mesh.rotation.z += p.rotZ

        if (p.mesh.position.x > 25) p.mesh.position.x = -25
        if (p.mesh.position.x < -25) p.mesh.position.x = 25
        if (p.mesh.position.y > 20) p.mesh.position.y = -20
        if (p.mesh.position.y < -20) p.mesh.position.y = 20
        if (p.mesh.position.z > 15) p.mesh.position.z = -15
        if (p.mesh.position.z < -15) p.mesh.position.z = 15

        if (!isMobile) {
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j]
            const dx = p.mesh.position.x - p2.mesh.position.x
            const dy = p.mesh.position.y - p2.mesh.position.y
            const dz = p.mesh.position.z - p2.mesh.position.z
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
            if (dist < lineThreshold) {
              linePositions[lineIndex++] = p.mesh.position.x
              linePositions[lineIndex++] = p.mesh.position.y
              linePositions[lineIndex++] = p.mesh.position.z
              linePositions[lineIndex++] = p2.mesh.position.x
              linePositions[lineIndex++] = p2.mesh.position.y
              linePositions[lineIndex++] = p2.mesh.position.z
            }
          }
        }
      }

      lineGeometry.setDrawRange(0, lineIndex / 3)
      lineGeometry.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      renderer.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      particles.forEach((p) => {
        p.mesh.geometry.dispose()
        ;(p.mesh.material as THREE.Material).dispose()
      })
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="particle-bg"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

export default ParticleBackground
