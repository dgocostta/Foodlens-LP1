import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'FoodLens — Cinema Menus for Restaurants',
  description: 'Stop showing PDFs. Start selling vibes. Cinematic video menus that increase orders.',
  icons: {
    icon: 'https://customer-assets.emergentagent.com/wingman/6e978d7c-1e64-42c4-b4ae-a71d4297a51c/attachments/b2e12e6cc719455bbc9b633b05df069b_image.png',
    shortcut: 'https://customer-assets.emergentagent.com/wingman/6e978d7c-1e64-42c4-b4ae-a71d4297a51c/attachments/b2e12e6cc719455bbc9b633b05df069b_image.png',
    apple: 'https://customer-assets.emergentagent.com/wingman/6e978d7c-1e64-42c4-b4ae-a71d4297a51c/attachments/b2e12e6cc719455bbc9b633b05df069b_image.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ff5a1f',
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
