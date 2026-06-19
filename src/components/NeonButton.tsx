import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface NeonButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  color?: 'cyan' | 'magenta' | 'purple' | 'green'
  disabled?: boolean
  className?: string
}

const colorMap = {
  cyan: 'var(--cyan)',
  magenta: 'var(--magenta)',
  purple: 'var(--purple)',
  green: 'var(--green)',
}

function NeonButton({
  children,
  onClick,
  type = 'button',
  color = 'cyan',
  disabled = false,
  className = '',
}: NeonButtonProps) {
  const glowColor = colorMap[color]

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`neon-button ${className}`}
      style={{ '--glow-color': glowColor } as React.CSSProperties}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  )
}

export default NeonButton
