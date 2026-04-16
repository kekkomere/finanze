import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Manto',
  description: 'Le tue finanze, senza drammi.',
  manifest: '/manifest.json',
  themeColor: '#7F77DD',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Manto',
  },
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="it">
      <head>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Manto"/>
        <meta name="theme-color" content="#7F77DD"/>
      </head>
      <body>{children}</body>
    </html>
  )
}
