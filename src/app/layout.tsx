import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Optimized font loading for Next.js 16
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Ensures text is visible immediately
  variable: '--font-inter', // Allows you to use it in CSS if needed
})

export const metadata: Metadata = {
  title: 'MatthOrg - The All-in-One Business Platform',
  description: 'Centralize staff, tasks, sales, and projects. Streamline your operations and boost productivity.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}