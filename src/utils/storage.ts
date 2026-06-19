export interface Message {
  id: string
  senderUsername: string
  content: string
  createdAt: number
  reply?: string
  repliedAt?: number
}
