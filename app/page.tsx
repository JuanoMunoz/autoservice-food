import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

const BUSINESS = {
  name: 'CheesePapas',
  slogan: 'Cuando pienses en papas piensa en cheesepapas',
  street: 'Cl. 26 #28-58',
  city: 'Marinilla',
  postalCode: '054020',
  region: 'Antioquia',
  country: 'CO',
  phone: '+57 310 3967137',
  phoneHref: 'tel:+573103967137',
  hours: '11:45–22:00',
  hoursOpen: '11:45',
  hoursClose: '22:00',
  lat: 6.170119,
  lng: -75.335535,
  deliveryBase: 5000,
  deliveryKmIncluded: 3,
  deliveryExtraKm: 2000,
} as const

const MAPS_EMBED = `https://www.google.com/maps?q=${BUSINESS.lat},${BUSINESS.lng}&z=17&output=embed`
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${BUSINESS.lat},${BUSINESS.lng}`

export const metadata: Metadata = {
  title: 'CheesePapas Marinilla | Papas Costeñas, Rancheras y Familiares a Domicilio',
  description: 'CheesePapas en Marinilla, Antioquia (Cl. 26 #28-58). Costeñas, rancheras, familiares y más, de 11:45 a 22:00. Pide a domicilio en todo Marinilla o recoge en el local.',
  keywords: [
    'CheesePapas Marinilla',
    'papas Marinilla',
    'costeña Marinilla',
    'ranchera Marinilla',
    'comida rápida Marinilla Antioquia',
    'domicilios Marinilla',
    'papas a domicilio Marinilla',
    'autoservicio comida rápida',
  ],
  openGraph: {
    title: 'CheesePapas Marinilla — Costeñas, Rancheras y Familiares',
    description: 'Cl. 26 #28-58, Marinilla. Lun–Dom 11:45–22:00. Domicilios en todo Marinilla. ¡Ordena en línea!',
    images: [{ url: '/logo-cheesepapas.webp', width: 512, height: 512, alt: 'Logo CheesePapas' }],
  },
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface ShowcaseProduct {
  id: string
  name: string
  description: string | null
  price: number
  imageRoute: string | null
}

const MARQUEE_WORDS = ['Costeñas', 'Rancheras', 'Familiares', 'Brutales', 'Personales', 'Salsas de la casa']

export default async function HomePage() {
  let products: ShowcaseProduct[] = []
  let drinks: Array<{ id: string; name: string; price: number; imageRoute: string | null }> = []
  try {
    const [productRows, drinkRows] = await Promise.all([
      prisma.products.findMany({
        select: { id: true, name: true, description: true, price: true, imageRoute: true },
        orderBy: { price: 'asc' },
      }),
      prisma.drink.findMany({
        select: { id: true, name: true, price: true, imageRoute: true },
        orderBy: { price: 'asc' },
      }),
    ])
    products = productRows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      imageRoute: r.imageRoute,
    }))
    drinks = drinkRows.map((r) => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      imageRoute: r.imageRoute,
    }))
  } catch {
    products = []
    drinks = []
  }

  const featuredNames = ['Costeña personal', 'Costeña Max', 'Familiares', 'Ranchera personal', 'Chessepapas max', 'Papas brutales']
  const featured = featuredNames
    .map((n) => products.find((p) => p.name.toLowerCase() === n.toLowerCase()))
    .filter((p): p is ShowcaseProduct => !!p)
  const showcase = (featured.length > 0 ? featured : products.slice(0, 6)).slice(0, 6)
  const heroDish = showcase.find((p) => p.imageRoute) ?? showcase[0] ?? products.find((p) => p.imageRoute)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FastFoodRestaurant',
    name: BUSINESS.name,
    image: 'https://cheesepapas.vercel.app/logo-cheesepapas.webp',
    telephone: BUSINESS.phone,
    url: 'https://cheesepapas.vercel.app',
    servesCuisine: ['Papas Fritas', 'Comida Rápida', 'Fast Food'],
    priceRange: '$',
    slogan: BUSINESS.slogan,
    hasMenu: 'https://cheesepapas.vercel.app/order/products',
    description: 'Papas artesanales, costeñas, rancheras y familiares en Marinilla, Antioquia. Domicilios en todo Marinilla.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.street,
      addressLocality: BUSINESS.city,
      postalCode: BUSINESS.postalCode,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.lat,
      longitude: BUSINESS.lng,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: BUSINESS.hoursOpen,
      closes: BUSINESS.hoursClose,
    },
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0b]/90 backdrop-blur-md border-b border-stone-800/70 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo-cheesepapas.webp"
            alt="Logo CheesePapas"
            width={48}
            height={48}
            className="w-11 h-11 object-contain transition-transform group-hover:scale-105"
            priority
            unoptimized
          />
          <span className="text-2xl font-saira font-extrabold text-white tracking-wider">
            Cheese<span className="text-amber-400">Papas</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6 text-sm font-bold text-stone-300">
          <a href="#menu-destacado" className="hover:text-amber-400 transition-colors">Carta Marinilla</a>
          <a href="#encuentranos" className="hover:text-amber-400 transition-colors">Encuéntranos</a>
          <a href="#por-que-elegirnos" className="hover:text-amber-400 transition-colors">¿Por qué CheesePapas?</a>
          <a href="#como-funciona" className="hover:text-amber-400 transition-colors">¿Cómo Pedir?</a>
          <a href="#preguntas-frecuentes" className="hover:text-amber-400 transition-colors">Preguntas Frecuentes</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/order"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-2 min-h-11"
            id="nav-cta-ordenar"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Ordenar Ahora</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 cp-dots opacity-60 pointer-events-none" aria-hidden="true" />
          <div className="absolute -top-32 right-[-10%] w-[480px] h-[480px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" aria-hidden="true" />

          <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center px-4 sm:px-8 lg:px-12 pt-14 pb-16 sm:pt-20 sm:pb-24">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              <p className="font-galindo text-amber-400/90 text-lg sm:text-xl">
                desde Marinilla, con queso de verdad
              </p>

              <h1 className="text-5xl sm:text-7xl font-saira font-extrabold text-white tracking-tight leading-[0.95]">
                Papas que se<br />antojan <span className="text-amber-400">solas.</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-400 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Costeñas, rancheras y familiares en {BUSINESS.street}, Marinilla.
                Todos los días de {BUSINESS.hours} · a domicilio o para recoger.
              </p>

              {/* Action Buttons (CTAs) */}
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/order"
                  id="hero-cta-main"
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-8 py-4 rounded-full text-base transition-all shadow-xl shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-3 min-h-12"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Hacer pedido</span>
                </Link>

                <Link
                  href="/order/products"
                  className="w-full sm:w-auto text-stone-100 font-bold px-7 py-4 rounded-full text-sm transition-all flex items-center justify-center gap-2 border border-stone-700 hover:border-amber-500/60 hover:text-amber-300 min-h-12"
                >
                  <span>Ver la carta</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </Link>
              </div>

              {/* Meta row */}
              <dl className="pt-6 border-t border-stone-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <dt className="sr-only">Horario</dt>
                  <dd className="text-lg sm:text-xl font-saira font-extrabold text-white">11:45–22:00</dd>
                  <dd className="text-xs text-stone-500 font-bold">Todos los días</dd>
                </div>
                {/* <div>
                  <dt className="sr-only">Domicilio base</dt>
                  <dd className="text-lg sm:text-xl font-saira font-extrabold text-white">$5.000</dd>
                  <dd className="text-xs text-stone-500 font-bold">Domicilio base</dd>
                </div> */}
                <div>
                  <dt className="sr-only">Cobertura</dt>
                  <dd className="text-lg sm:text-xl font-saira font-extrabold text-white">Marinilla</dd>
                  <dd className="text-xs text-stone-500 font-bold">Cobertura total</dd>
                </div>
              </dl>
            </div>

            {/* Right Hero Dish */}
            <div className="lg:col-span-5 flex justify-center">
              <figure className="relative w-full max-w-sm sm:max-w-md">
                <div className="overflow-hidden rounded-[2rem] border border-stone-800 shadow-2xl shadow-black/60">
                  {heroDish?.imageRoute ? (
                    <Image
                      src={heroDish.imageRoute}
                      alt={heroDish.name}
                      width={800}
                      height={600}
                      className="w-full aspect-[4/3] object-cover"
                      priority
                      unoptimized
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 flex items-center justify-center p-10">
                      <Image
                        src="/logo-cheesepapas.webp"
                        alt="CheesePapas Marinilla"
                        width={320}
                        height={320}
                        className="w-44 h-44 sm:w-56 sm:h-56 object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
                        priority
                        unoptimized
                      />
                    </div>
                  )}
                </div>
                {heroDish && (
                  <figcaption className="absolute -bottom-6 left-4 right-4 sm:left-6 sm:right-6 bg-[#141414] border border-stone-800 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 shadow-xl">
                    <div className="min-w-0 text-left">
                      <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">La más pedida</p>
                      <p className="font-saira font-extrabold text-lg text-white truncate">{heroDish.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-saira font-extrabold text-xl text-amber-400">{formatCOP(heroDish.price)}</p>
                      <Link href="/order/products" className="text-xs font-black text-stone-300 hover:text-amber-300 transition-colors">
                        Pedir →
                      </Link>
                    </div>
                  </figcaption>
                )}
              </figure>
            </div>
          </div>

          {/* Marquee */}
          <div className="relative border-y border-stone-800/80 bg-[#111111] py-3 overflow-hidden" aria-hidden="true">
            <div className="cp-marquee-track flex w-max items-center gap-8 pr-8">
              {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((w, i) => (
                <span key={i} className="flex items-center gap-8 font-saira font-extrabold uppercase tracking-[0.2em] text-sm text-stone-500 whitespace-nowrap">
                  {w} <span className="text-amber-500">✦</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* REAL MENU SHOWCASE (BD) */}
        <section id="menu-destacado" className="py-16 sm:py-24 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-3">
                <p className="font-galindo text-amber-400/90 text-lg">recién salidas del aceite</p>
                <h2 className="text-4xl sm:text-5xl font-saira font-extrabold text-white tracking-tight">
                  La carta
                </h2>
                <p className="text-sm text-stone-400 font-medium max-w-lg">
                  Precios vigentes de nuestra cocina. Todo se pide en línea, con extras y salsas de la casa.
                </p>
              </div>
              <Link
                href="/order/products"
                className="inline-flex items-center gap-2 text-sm font-black text-amber-400 hover:text-amber-300 transition-colors shrink-0"
              >
                <span>Ver carta completa</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {showcase.map((p, i) => (
                <article key={p.id} className="group bg-[#141414] border border-stone-800/90 rounded-[1.5rem] overflow-hidden hover:border-amber-500/50 transition-all flex flex-col">
                  <div className="relative overflow-hidden">
                    {p.imageRoute ? (
                      <Image
                        src={p.imageRoute}
                        alt={p.name}
                        width={600}
                        height={450}
                        className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 flex items-center justify-center p-8">
                        <Image
                          src="/logo-cheesepapas.webp"
                          alt="CheesePapas"
                          width={160}
                          height={160}
                          className="w-24 h-24 object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                          loading="lazy"
                          unoptimized
                        />
                      </div>
                    )}
                    <span className="absolute top-4 left-4 bg-[#0a0a0b]/85 backdrop-blur-sm text-amber-300 border border-amber-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      {i === 0 ? 'La más pedida' : i === 1 ? 'Tamaño max' : i === 2 ? 'Para compartir' : 'De la carta'}
                    </span>
                  </div>
                  <div className="p-6 space-y-2 flex flex-col flex-1">
                    <h3 className="text-2xl font-saira font-extrabold text-white leading-none">{p.name}</h3>
                    {p.description && (
                      <p className="text-sm text-stone-400 font-medium leading-relaxed line-clamp-2">{p.description}</p>
                    )}
                    <div className="pt-3 mt-auto flex justify-between items-center">
                      <span className="text-2xl font-saira font-extrabold text-amber-400">{formatCOP(p.price)}</span>
                      <Link
                        href="/order/products"
                        className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-5 py-2.5 rounded-full text-sm transition-all active:scale-95 min-h-11 inline-flex items-center"
                      >
                        Ordenar
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
              {showcase.length === 0 && (
                <p className="text-sm text-stone-400 col-span-full text-center">
                  Muy pronto verás aquí nuestra carta. Mientras tanto, explora el{' '}
                  <Link href="/order/products" className="text-amber-400 font-bold">menú completo</Link>.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* DRINKS */}
        {drinks.length > 0 && (
          <section id="bebidas" className="pb-16 sm:pb-24 px-4 sm:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="space-y-3">
                <p className="font-galindo text-amber-400/90 text-lg">para bajarlo todo</p>
                <h2 className="text-4xl sm:text-5xl font-saira font-extrabold text-white tracking-tight">
                  Bebidas
                </h2>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {drinks.slice(0, 4).map((d) => (
                  <li key={d.id}>
                    <Link
                      href="/order/products"
                      className="flex items-center gap-4 bg-[#141414] border border-stone-800/90 rounded-2xl p-4 hover:border-amber-500/50 transition-all group"
                    >
                      {d.imageRoute ? (
                        <Image
                          src={d.imageRoute}
                          alt={d.name}
                          width={96}
                          height={96}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                          loading="lazy"
                          unoptimized
                        />
                      ) : (
                        <span className="w-14 h-14 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-saira font-extrabold text-xl text-amber-400 shrink-0" aria-hidden="true">
                          {d.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-white truncate group-hover:text-amber-300 transition-colors">{d.name}</span>
                        <span className="block text-sm font-saira font-extrabold text-amber-400">{formatCOP(d.price)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* FEATURE HIGHLIGHTS */}
        <section id="por-que-elegirnos" className="py-16 sm:py-24 px-4 sm:px-8 bg-[#111111] border-y border-stone-800/70">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="space-y-3 max-w-2xl">
              <p className="font-galindo text-amber-400/90 text-lg">nuestra promesa</p>
              <h2 className="text-4xl sm:text-5xl font-saira font-extrabold text-white tracking-tight">
                Hechas al momento,<br />crujientes siempre.
              </h2>
            </div>

            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 list-none">
              {[
                { n: '01', t: 'Recién hechas', d: 'Papas doradas al momento: crujientes por fuera y suaves por dentro, siempre calientes.' },
                { n: '02', t: 'Recetas de la casa', d: 'Costeña con suero costeño, ranchera, brutales y familiares: sabores que solo encuentras aquí.' },
                { n: '03', t: 'Toppings a elegir', d: 'Personaliza tus papas con extras y todas nuestras salsas de la casa en el menú interactivo.' },
                { n: '04', t: 'Domicilio Marinilla', d: `Cobertura en todo Marinilla por ${formatCOP(BUSINESS.deliveryBase)} (${BUSINESS.deliveryKmIncluded} km incluidos). O recoge en ${BUSINESS.street}.` },
              ].map((f) => (
                <li key={f.n} className="space-y-3 border-t border-stone-800 pt-6">
                  <span className="font-saira font-extrabold text-5xl cp-outline-num" aria-hidden="true">{f.n}</span>
                  <h3 className="font-saira font-extrabold text-xl text-white">{f.t}</h3>
                  <p className="text-sm text-stone-400 font-medium leading-relaxed">{f.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ENCUÉNTRANOS EN MARINILLA */}
        <section id="encuentranos" className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto space-y-10">
          <div className="space-y-3 max-w-2xl">
            <p className="font-galindo text-amber-400/90 text-lg">visítanos</p>
            <h2 className="text-4xl sm:text-5xl font-saira font-extrabold text-white tracking-tight">
              En el corazón de Marinilla
            </h2>
            <p className="text-sm text-stone-400 font-medium">
              Ven al local o pide a domicilio. Estamos abiertos todos los días.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="bg-[#141414] border border-stone-800/90 rounded-[1.5rem] p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Dirección</h3>
                  <p className="text-sm text-stone-300 font-medium">
                    {BUSINESS.street}, {BUSINESS.city}, {BUSINESS.postalCode}, {BUSINESS.region}, {BUSINESS.country}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Horario</h3>
                  <p className="text-sm text-stone-300 font-medium">Lunes a domingo · {BUSINESS.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Domicilios</h3>
                  <p className="text-sm text-stone-300 font-medium">
                    Todo Marinilla · {formatCOP(BUSINESS.deliveryBase)} ({BUSINESS.deliveryKmIncluded} km incluidos, +{formatCOP(BUSINESS.deliveryExtraKm)}/km adicional)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Teléfono</h3>
                  <a href={BUSINESS.phoneHref} className="text-sm text-amber-400 font-bold hover:text-amber-300">
                    {BUSINESS.phone}
                  </a>
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-6 py-3.5 rounded-full text-sm transition-all active:scale-95 flex items-center justify-center gap-2 min-h-12"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Cómo llegar</span>
                </a>
                <Link
                  href="/order"
                  className="flex-1 text-white border border-stone-700 hover:border-amber-500/60 font-bold px-6 py-3.5 rounded-full text-sm transition-all flex items-center justify-center gap-2 min-h-12"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Pedir a domicilio</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] overflow-hidden border border-stone-800/90 min-h-80">
              <iframe
                title={`Mapa: ${BUSINESS.name} en ${BUSINESS.city}`}
                src={MAPS_EMBED}
                className="w-full h-full min-h-80 grayscale-[35%] contrast-[1.05]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="como-funciona" className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
          <div className="space-y-3 max-w-xl">
            <p className="font-galindo text-amber-400/90 text-lg">así de fácil</p>
            <h2 className="text-4xl sm:text-5xl font-saira font-extrabold text-white tracking-tight">
              Pide en 3 pasos
            </h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 list-none">
            {[
              { n: '1', t: 'Elige cómo', d: `Domicilio en todo Marinilla o recoge en ${BUSINESS.street}.` },
              { n: '2', t: 'Arma tu antojo', d: 'Costeñas, rancheras, familiares o personales, con extras y salsas de la casa.' },
              { n: '3', t: 'Disfruta caliente', d: 'Sigue tu pedido en vivo mientras lo preparamos recién hecho para ti.' },
            ].map((s) => (
              <li key={s.n} className="relative space-y-3">
                <span className="font-saira font-extrabold text-7xl cp-outline-num leading-none" aria-hidden="true">{s.n}</span>
                <h3 className="font-saira font-extrabold text-2xl text-white">{s.t}</h3>
                <p className="text-sm text-stone-400 font-medium leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS (SEO FAQ) */}
        <section id="preguntas-frecuentes" className="py-16 sm:py-24 px-4 sm:px-8 bg-[#111111] border-t border-stone-800/70">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="space-y-3">
              <p className="font-galindo text-amber-400/90 text-lg">resolvemos tus dudas</p>
              <h2 className="text-4xl sm:text-5xl font-saira font-extrabold text-white tracking-tight">
                Preguntas frecuentes
              </h2>
            </div>

            <div className="space-y-4">
              <details className="group bg-[#0a0a0b] border border-stone-800 rounded-2xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Dónde están ubicados?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-stone-400 leading-relaxed font-medium">
                  Estamos en <strong className="text-white">{BUSINESS.street}, {BUSINESS.city} ({BUSINESS.region})</strong>,
                  abiertos todos los días de {BUSINESS.hours}.
                </p>
              </details>

              <details className="group bg-[#0a0a0b] border border-stone-800 rounded-2xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Cuánto cuesta el domicilio en Marinilla?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
              </details>

              <details className="group bg-[#0a0a0b] border border-stone-800 rounded-2xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Cómo puedo hacer un pedido a domicilio en CheesePapas?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-stone-400 leading-relaxed font-medium">
                  Es muy sencillo. Haz clic en el botón <strong className="text-white">Ordenar Ahora</strong>, selecciona la opción <strong className="text-white">A Domicilio</strong>, elige tu ubicación en el mapa o ingresa tu dirección en Marinilla, añade tus productos al carrito y confirma tu pedido.
                </p>
              </details>

              <details className="group bg-[#0a0a0b] border border-stone-800 rounded-2xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Cuánto tarda la entrega de los pedidos a domicilio?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-stone-400 leading-relaxed font-medium">
                  El tiempo estimado de preparación y entrega oscila entre 20 y 35 minutos dependiendo de tu zona en Marinilla. Puedes monitorear el estado de tu pedido en tiempo real desde la pantalla de confirmación.
                </p>
              </details>

              <details className="group bg-[#0a0a0b] border border-stone-800 rounded-2xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Puedo personalizar mis papas con adiciones y salsas?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-stone-400 leading-relaxed font-medium">
                  ¡Sí! Puedes agregar extras y elegir entre todas nuestras salsas de la casa en el menú interactivo antes de enviar tu orden.
                </p>
              </details>

              <details className="group bg-[#0a0a0b] border border-stone-800 rounded-2xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Cuáles son los métodos de pago disponibles?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-stone-400 leading-relaxed font-medium">
                  Aceptamos pago en efectivo al momento de la entrega o consumo y transferencias electrónicas en línea (Nequi / Bancolombia).
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* FOOTER BANNER CTA */}
        <section className="relative overflow-hidden bg-amber-500 text-stone-950">
          <div className="absolute inset-0 cp-dots opacity-40 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-4xl mx-auto text-center space-y-6 px-4 sm:px-8 py-16 sm:py-20">
            <p className="font-galindo text-xl sm:text-2xl text-stone-900">¿antojo de unas verdaderas?</p>
            <h2 className="text-4xl sm:text-6xl font-saira font-extrabold tracking-tight leading-none">
              CheesePapas hoy.
            </h2>
            <p className="text-base sm:text-lg font-bold italic text-stone-900">
              Cuando pienses en papas piensa en cheesepapas
            </p>
            <div className="pt-2">
              <Link
                href="/order"
                className="inline-flex items-center gap-3 bg-stone-950 hover:bg-stone-900 text-white font-black px-8 py-4 rounded-full text-base shadow-2xl transition-all active:scale-95 min-h-12"
                id="footer-cta-ordenar"
              >
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>Haz tu pedido ahora</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0b] border-t border-stone-800/70 text-stone-400 py-10 px-4 sm:px-8 text-xs font-medium">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-cheesepapas.webp"
                alt="CheesePapas Logo"
                width={36}
                height={36}
                className="w-8 h-8 object-contain"
                unoptimized
              />
              <span className="text-xl font-saira font-extrabold text-white">
                Cheese<span className="text-amber-400">Papas</span>
              </span>
            </div>

            <p className="text-stone-400">
              © {new Date().getFullYear()} CheesePapas. Autoservicio de Comida Rápida. Todos los derechos reservados.
            </p>

            <div className="flex items-center gap-4 text-stone-300 font-bold">
              <a href={BUSINESS.phoneHref} className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Tel: {BUSINESS.phone}
              </a>
              <span>•</span>
              <Link href="/login" className="hover:text-amber-400 transition-colors">
                Acceso Admin
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 border-t border-stone-800/60 pt-6 text-stone-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {BUSINESS.street}, {BUSINESS.city}, {BUSINESS.region}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Lun–Dom · {BUSINESS.hours}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              Domicilios en todo Marinilla
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
