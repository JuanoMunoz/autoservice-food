import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cheesepapas.vercel.app'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/order`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/order/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/order/checkout`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  try {
    const products = await prisma.products.findMany({
      select: { id: true, updatedAt: true }
    })
    const drinks = await prisma.drink.findMany({
      select: { id: true, updatedAt: true }
    })

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/order/product/${product.id}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const drinkRoutes: MetadataRoute.Sitemap = drinks.map((drink) => ({
      url: `${baseUrl}/order/drink/${drink.id}`,
      lastModified: drink.updatedAt ? new Date(drink.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticRoutes, ...productRoutes, ...drinkRoutes]
  } catch (error) {
    console.error('Error generating dynamic sitemap routes:', error)
    return staticRoutes
  }
}
