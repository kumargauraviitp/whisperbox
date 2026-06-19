import { motion } from 'framer-motion'

interface NeonInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  type?: 'text' | 'textarea' | 'password'
  className?: string
  autoFocus?: boolean
}

function NeonInput({
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
  className = '',
  autoFocus = false,
}: NeonInputProps) {
  const sharedProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    placeholder,
    maxLength,
    className: `neon-input ${type === 'textarea' ? 'neon-textarea' : ''} ${className}`,
    autoFocus,
  }

  if (type === 'textarea') {
    return <motion.textarea {...sharedProps} rows={5} />
  }

  return <motion.input {...sharedProps} type={type === 'password' ? 'password' : 'text'} />
}

export default NeonInput
