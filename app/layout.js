import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'FoodLens — Cinema Menus for Restaurants',
  description: 'Stop showing PDFs. Start selling vibes. Cinematic video menus that increase orders.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-zinc-950 text-zinc-50 antialiased overflow-x-hidden`}>
        {children}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  )
}
