import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CheesePapas Autoservicio',
    short_name: 'CheesePapas',
    description: 'sistema de pedidos CheesePapas.',
    start_url: '/order/products',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/logo-cheesepapas.webp',
        sizes: '512x512',
        type: 'image/webp',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
