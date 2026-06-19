import { motion } from 'framer-motion'
import { MessageSquare, Reply, Clock, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Message } from '../utils/storage'

interface MessageCardProps {
  message: Message
  index?: number
  isAdmin?: boolean
  onReply?: (id: string, reply: string) => void
  onDelete?: (id: string) => void
}

function MessageCard({ message, index = 0, isAdmin = false, onReply, onDelete }: MessageCardProps) {
  const formattedDate = new Date(message.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const replyDate = message.repliedAt
    ? new Date(message.repliedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="message-card"
    >
      <div className="message-card-header">
        <div className="message-card-user">
          <MessageSquare size={16} />
          <span className="mono-text">{message.senderUsername}</span>
        </div>
        <span className="message-card-time">{formattedDate}</span>
      </div>
      <p className="message-card-content">{message.content}</p>

      {message.reply ? (
        <div className="message-card-reply">
          <div className="reply-label">
            <Reply size={14} />
            <span>Owner Reply</span>
            {replyDate && <span className="reply-date">{replyDate}</span>}
          </div>
          <p>{message.reply}</p>
        </div>
      ) : (
        <div className="message-card-waiting">
          <Clock size={14} />
          <span>Waiting for reply...</span>
        </div>
      )}

      {isAdmin && !message.reply && onReply && (
        <AdminReplyForm messageId={message.id} onReply={onReply} />
      )}

      {isAdmin && onDelete && (
        <button
          className="message-delete-btn"
          onClick={() => {
            if (confirm('Delete this message permanently?')) onDelete(message.id)
          }}
          title="Delete message"
          aria-label="Delete message"
        >
          <Trash2 size={15} />
        </button>
      )}
    </motion.div>
  )
}

function AdminReplyForm({
  messageId,
  onReply,
}: {
  messageId: string
  onReply: (id: string, reply: string) => void
}) {
  const [reply, setReply] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reply.trim()) {
      onReply(messageId, reply.trim())
      setReply('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-reply-form">
      <input
        type="text"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Type your reply..."
        className="admin-reply-input"
      />
      <button type="submit" className="admin-reply-btn">
        Reply
      </button>
    </form>
  )
}

export default MessageCard
