import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '3D Scene Demo',
  description: 'A 3D scene demo with React Three Fiber',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 