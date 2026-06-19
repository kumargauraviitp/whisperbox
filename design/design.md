# NGL-Style Anonymous Messaging App — Design Document

## Concept
A vibrant, immersive anonymous messaging platform where users can send private messages to the website owner and check replies using a simple self-chosen username. No real credentials needed — just a memorable random name.

## Visual System

### Color Palette (Neon Dark)
- **Background**: `#0a0a0f` (deep space black)
- **Surface**: `rgba(255,255,255,0.05)` with glassmorphism blur
- **Primary Accent**: `#00f2ff` (electric cyan)
- **Secondary Accent**: `#ff00a0` (hot magenta)
- **Tertiary Accent**: `#7b2ff7` (neon purple)
- **Success**: `#00ff88` (electric green)
- **Warning**: `#ffaa00` (neon amber)
- **Text Primary**: `#ffffff`
- **Text Secondary**: `rgba(255,255,255,0.6)`
- **Text Muted**: `rgba(255,255,255,0.35)`

### Typography
- **Headings**: Inter, weight 800, tight tracking (-0.02em)
- **Body**: Inter, weight 400, 1.6 line height
- **Mono**: JetBrains Mono (for usernames, code-like elements)
- **Hero**: 4rem mobile, 6rem desktop
- **H2**: 2.5rem mobile, 3.5rem desktop
- **Body**: 1rem mobile, 1.125rem desktop

### Layout
- Max content width: 1200px
- Mobile: 16px padding
- Tablet: 24px padding
- Desktop: 32px padding
- Border radius: 24px (cards), 16px (buttons), 9999px (pills)
- Card spacing: 24px gap

### 3D Background (Three.js)
- Floating geometric particles (icosahedrons, tetrahedrons)
- 50-60 particles with slow rotation and drift
- Wireframe style with neon glow
- Mouse parallax interaction (subtle)
- Color mixing between cyan, magenta, purple
- Particle connection lines when close (threshold: 120px)
- Responsive: fewer particles on mobile (20-30)

### Glassmorphism
- Background: `rgba(10, 10, 15, 0.6)`
- Backdrop blur: `blur(20px)`
- Border: `1px solid rgba(255,255,255,0.1)`
- Box shadow: `0 8px 32px rgba(0,0,0,0.3)`

### Animation Language (Framer Motion)
- **Page transitions**: Fade + slide up, 0.4s, ease-out
- **Card entrance**: Stagger 0.1s, fade up from 30px
- **Button hover**: Scale 1.05, glow intensify, 0.2s
- **Input focus**: Border glow pulse, 0.3s
- **3D particles**: Continuous slow rotation, 0.001-0.003 rad/frame
- **Success state**: Confetti burst, 1s
- **Loading**: Pulsing gradient, 1.5s cycle

## Page Structure

### Route: `/` — Landing Page
- Full-screen 3D background
- Centered content with two main actions
- Hero text: "Say what you can't say aloud"
- Subtext: "Anonymous messages. No judgment. No trace."
- Two large CTA cards:
  - "Send a Message" (cyan accent)
  - "Check My Replies" (magenta accent)
- Bottom: "Owner Login" small link (subtle, right-aligned)
- Mobile: Cards stack vertically

### Route: `/send` — Send Message
- 3D background (same system)
- Form card with glassmorphism:
  - Username input (with hint: "Not your real username — any random name works! Just remember it.")
  - Message textarea (max 500 chars, with counter)
  - Send button with glow animation
- After sending: Success animation + "Check replies later using your username"
- Mobile: Full width form, reduced padding

### Route: `/replies` — Check Replies
- Username input to look up
- Message list showing all sent messages with their reply status
- For each message: original message, timestamp, reply (if any), "Waiting for reply" state
- If no messages found: "No messages found. Did you send one first?"
- Mobile: Stacked card layout

### Route: `/admin` — Owner Panel (PIN: 1111)
- PIN entry screen (4 digits)
- Dashboard: Stats cards (total messages, pending replies, replied)
- Message list with reply functionality
- Each message: sender username, message content, timestamp, reply input
- Mobile: Same layout, stacked

## Data Model (LocalStorage)

```typescript
interface Message {
  id: string;
  senderUsername: string;
  content: string;
  createdAt: number;
  reply?: string;
  repliedAt?: number;
}
```

Storage key: `ngl_messages_v1`

## Responsive Breakpoints
- Mobile: < 640px (single column, full width cards, fewer 3D particles)
- Tablet: 640px - 1024px (2 columns where appropriate, medium padding)
- Desktop: > 1024px (full layout, max content width, full 3D particles)

## Shared Components
- `ParticleBackground` — Three.js canvas component (on all pages)
- `GlassCard` — Glassmorphism wrapper
- `NeonButton` — Glowing button with hover animation
- `NeonInput` — Styled input with glow focus
- `AnimatedText` — Staggered text reveal
- `PageTransition` — Framer motion wrapper for route transitions
- `MessageCard` — Display a message with reply status

## Dependencies
- three, @types/three
- framer-motion
- react-router-dom
- lucide-react
- tailwindcss v4 (via CSS import)

## Performance
- Three.js canvas: use `dpr={Math.min(window.devicePixelRatio, 2)}`
- Particles: reduce count on mobile (< 640px → 25 particles)
- Animation: use `will-change: transform` on animated elements
- Lazy load routes if needed
