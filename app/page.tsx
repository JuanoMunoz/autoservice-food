import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingBag,
  Truck,
  MapPin,
  Flame,
  Award,
  Sparkles,
  ChevronRight,
  Phone,
  Clock
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

export default async function HomePage() {
  let products: Array<{ id: string; name: string; price: number }> = []
  try {
    const rows = await prisma.products.findMany({
      select: { id: true, name: true, price: true },
      orderBy: { price: 'asc' },
    })
    products = rows.map((r) => ({ id: r.id, name: r.name, price: Number(r.price) }))
  } catch {
    products = []
  }

  const featuredNames = ['Costeña personal', 'Costeña Max', 'Familiares', 'Ranchera personal', 'Chessepapas max', 'Papas brutales']
  const featured = featuredNames
    .map((n) => products.find((p) => p.name.toLowerCase() === n.toLowerCase()))
    .filter((p): p is { id: string; name: string; price: number } => !!p)
  const showcase = (featured.length > 0 ? featured : products.slice(0, 6)).slice(0, 6)

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
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

        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-300">
          <a href="#menu-destacado" className="hover:text-amber-400 transition-colors">Carta Marinilla</a>
          <a href="#encuentranos" className="hover:text-amber-400 transition-colors">Encuéntranos</a>
          <a href="#por-que-elegirnos" className="hover:text-amber-400 transition-colors">¿Por qué CheesePapas?</a>
          <a href="#como-funciona" className="hover:text-amber-400 transition-colors">¿Cómo Pedir?</a>
          <a href="#preguntas-frecuentes" className="hover:text-amber-400 transition-colors">Preguntas Frecuentes</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/order"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-2 min-h-11"
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
        <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-8 lg:px-12 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/60">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>Marinilla, Antioquia · Domicilios en minutos</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-saira font-extrabold text-white tracking-tight leading-[1.1]">
                Las Papas Más <span className="text-amber-400 underline decoration-amber-500/40 decoration-wavy">Crujientes de Marinilla</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Costeñas, rancheras, familiares y porciones personales en {BUSINESS.street}, Marinilla.
                Abierto todos los días de {BUSINESS.hours}. Pide a domicilio en todo Marinilla o recoge en el local.
              </p>

              {/* Action Buttons (CTAs) */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/order"
                  id="hero-cta-main"
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-4 rounded-xl text-base transition-all shadow-xl shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-3 border-2 border-amber-400 min-h-12"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>¡HACER PEDIDO AHORA!</span>
                </Link>

                <Link
                  href="/order/products"
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold px-7 py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 hover:border-slate-600 min-h-12"
                >
                  <span>Explorar Menú Completo</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-amber-400">11:45–22:00</p>
                  <p className="text-xs text-slate-400 font-bold">Todos los días</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-amber-400">$5.000</p>
                  <p className="text-xs text-slate-400 font-bold">Domicilio base</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-amber-400">Marinilla</p>
                  <p className="text-xs text-slate-400 font-bold">Cobertura total</p>
                </div>
              </div>
            </div>

            {/* Right Hero Image Frame */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 text-center">
                <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56">
                  <Image
                    src="/logo-cheesepapas.webp"
                    alt="CheesePapas Marinilla"
                    fill
                    className="object-contain drop-shadow-[0_10px_25px_rgba(245,158,11,0.25)]"
                    priority
                    unoptimized
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider">La más pedida</span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Marinilla
                    </span>
                  </div>
                  <h3 className="font-saira font-extrabold text-xl text-white">Costeña Personal</h3>
                  <p className="text-xs text-slate-400 font-medium">Nuestra insignia: papas con suero costeño y queso. También en tamaño Max y Familiar.</p>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-lg font-black text-white">$19.000</span>
                    <Link
                      href="/order/products"
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-black transition-colors"
                    >
                      Pedir plato
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE HIGHLIGHTS */}
        <section id="por-que-elegirnos" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">¿Por qué vas a amar CheesePapas?</h2>
            <p className="text-2xl sm:text-4xl font-saira font-extrabold text-white">
              La Experiencia Suprema en Papas Fritas
            </p>
            <p className="text-sm text-slate-400 font-medium">
              Nos enfocamos en un solo objetivo: crear el plato de papas más apetitoso, crujiente y sabroso de Marinilla.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-black">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Recién Hechas</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Papas doradas al momento: crujientes por fuera y suaves por dentro, siempre calientes.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-black">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Recetas de la Casa</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Costeña con suero costeño, ranchera, brutales y familiares: sabores que solo encuentras aquí.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-black">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Toppings A Elegir</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Personaliza tus papas con extras y todas nuestras salsas de la casa en el menú interactivo.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-black">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Domicilio Marinilla</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Cobertura en todo Marinilla por $5.000 (3 km incluidos). O recoge en Cl. 26 #28-58.
              </p>
            </div>
          </div>
        </section>

        {/* REAL MENU SHOWCASE (BD) */}
        <section id="menu-destacado" className="py-16 px-4 sm:px-8 bg-slate-900/40 border-y border-slate-800/60">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Carta real · Marinilla</h2>
                <p className="text-2xl sm:text-4xl font-saira font-extrabold text-white">
                  Lo Que Sí Vendemos
                </p>
                <p className="text-sm text-slate-400 font-medium">
                  Precios vigentes de nuestra carta. El menú completo está en el pedido en línea.
                </p>
              </div>
              <Link
                href="/order/products"
                className="inline-flex items-center gap-2 text-xs font-black text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>Ver catálogo completo</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {showcase.map((p, i) => (
                <article key={p.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between hover:border-amber-500/50 transition-all">
                  <div className="space-y-3">
                    <div className="inline-block bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {i === 0 ? 'La más pedida' : i === 1 ? 'Tamaño Max' : i === 2 ? 'Para compartir' : 'De la carta'}
                    </div>
                    <h3 className="text-xl font-extrabold text-white">{p.name}</h3>
                  </div>
                  <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                    <span className="text-xl font-black text-amber-400">{formatCOP(p.price)}</span>
                    <Link
                      href="/order/products"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-colors"
                    >
                      Ordenar
                    </Link>
                  </div>
                </article>
              ))}
              {showcase.length === 0 && (
                <p className="text-sm text-slate-400 col-span-full text-center">
                  Muy pronto verás aquí nuestra carta. Mientras tanto, explora el{' '}
                  <Link href="/order/products" className="text-amber-400 font-bold">menú completo</Link>.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ENCUÉNTRANOS EN MARINILLA */}
        <section id="encuentranos" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Visítanos</h2>
            <p className="text-2xl sm:text-4xl font-saira font-extrabold text-white">
              Encuéntranos en Marinilla
            </p>
            <p className="text-sm text-slate-400 font-medium">
              Estamos en el corazón de Marinilla, Antioquia. Ven al local o pide a domicilio.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Dirección</h3>
                  <p className="text-sm text-slate-300 font-medium">
                    {BUSINESS.street}, {BUSINESS.city}, {BUSINESS.postalCode}, {BUSINESS.region}, {BUSINESS.country}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Horario</h3>
                  <p className="text-sm text-slate-300 font-medium">Lunes a domingo · {BUSINESS.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Domicilios</h3>
                  <p className="text-sm text-slate-300 font-medium">
                    Todo Marinilla · {formatCOP(BUSINESS.deliveryBase)} (3 km incluidos, +{formatCOP(BUSINESS.deliveryExtraKm)}/km adicional)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
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
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2 min-h-12"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Cómo llegar</span>
                </a>
                <Link
                  href="/order"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold px-6 py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 min-h-12"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Pedir a domicilio</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 min-h-80">
              <iframe
                title={`Mapa: ${BUSINESS.name} en ${BUSINESS.city}`}
                src={MAPS_EMBED}
                className="w-full h-full min-h-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="como-funciona" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Paso a Paso</h2>
            <p className="text-2xl sm:text-4xl font-saira font-extrabold text-white">
              ¿Cómo Realizar tu Pedido?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                1
              </div>
              <h3 className="font-extrabold text-lg text-white">Elige tu Servicio</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Domicilio en todo Marinilla o recoge en {BUSINESS.street}.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                2
              </div>
              <h3 className="font-extrabold text-lg text-white">Arma tu Pedido</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Costeñas, rancheras, familiares o personales, con extras y salsas de la casa.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                3
              </div>
              <h3 className="font-extrabold text-lg text-white">Disfruta al Instante</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Recibe tu factura con seguimiento en vivo mientras preparamos tu comida caliente y deliciosa.
              </p>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS (SEO FAQ) */}
        <section id="preguntas-frecuentes" className="py-16 px-4 sm:px-8 bg-slate-900/30 border-t border-slate-800/60">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Resolvemos tus dudas</h2>
              <p className="text-2xl sm:text-4xl font-saira font-extrabold text-white">
                Preguntas Frecuentes (FAQ)
              </p>
            </div>

            <div className="space-y-4">
              <details className="group bg-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Dónde están ubicados?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  Estamos en <strong className="text-white">{BUSINESS.street}, {BUSINESS.city} ({BUSINESS.region})</strong>,
                  abiertos todos los días de {BUSINESS.hours}.
                </p>
              </details>

              <details className="group bg-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Cuánto cuesta el domicilio en Marinilla?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  El domicilio base cuesta <strong className="text-white">{formatCOP(BUSINESS.deliveryBase)}</strong> con{' '}
                  {BUSINESS.deliveryKmIncluded} km incluidos, y {formatCOP(BUSINESS.deliveryExtraKm)} por kilómetro adicional.
                  Cubrimos todo Marinilla.
                </p>
              </details>

              <details className="group bg-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Cómo puedo hacer un pedido a domicilio en CheesePapas?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  Es muy sencillo. Haz clic en el botón <strong className="text-white">Ordenar Ahora</strong>, selecciona la opción <strong className="text-white">A Domicilio</strong>, elige tu ubicación en el mapa o ingresa tu dirección en Marinilla, añade tus productos al carrito y confirma tu pedido.
                </p>
              </details>

              <details className="group bg-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Cuánto tarda la entrega de los pedidos a domicilio?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  El tiempo estimado de preparación y entrega oscila entre 20 y 35 minutos dependiendo de tu zona en Marinilla. Puedes monitorear el estado de tu pedido en tiempo real desde la pantalla de confirmación.
                </p>
              </details>

              <details className="group bg-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Puedo personalizar mis papas con adiciones y salsas?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  ¡Sí! Puedes agregar extras y elegir entre todas nuestras salsas de la casa en el menú interactivo antes de enviar tu orden.
                </p>
              </details>

              <details className="group bg-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Cuáles son los métodos de pago disponibles?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  Aceptamos pago en efectivo al momento de la entrega o consumo, pago con tarjeta de débito/crédito y transferencias electrónicas en línea (Nequi / Bancolombia).
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* FOOTER BANNER CTA */}
        <section className="py-16 px-4 sm:px-8 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-saira font-extrabold tracking-tight">
              ¿Antojo de unas Verdaderas CheesePapas?
            </h2>
            <p className="text-base sm:text-xl font-black italic">
              Cuando pienses en papas piensa en cheesepapas
            </p>
            <div className="pt-2">
              <Link
                href="/order"
                className="inline-flex items-center gap-3 bg-slate-950 hover:bg-slate-900 text-white font-black px-8 py-4 rounded-xl text-base shadow-2xl transition-all active:scale-95 border-2 border-slate-900 min-h-12"
                id="footer-cta-ordenar"
              >
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>HAZ TU PEDIDO AHORA MISMO</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 py-10 px-4 sm:px-8 text-xs font-medium">
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

            <p className="text-slate-400">
              © {new Date().getFullYear()} CheesePapas. Autoservicio de Comida Rápida. Todos los derechos reservados.
            </p>

            <div className="flex items-center gap-4 text-slate-300 font-bold">
              <a href={BUSINESS.phoneHref} className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Tel: {BUSINESS.phone}
              </a>
              <span>•</span>
              <Link href="/login" className="hover:text-amber-400 transition-colors">
                Acceso Admin
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 border-t border-slate-800/60 pt-6 text-slate-400">
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
