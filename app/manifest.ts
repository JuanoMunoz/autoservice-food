import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Skeleton Platform',
    short_name: 'skeleton',
    description: 'tu descripción aquí',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#125AF5',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
