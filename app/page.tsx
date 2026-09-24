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
  CheckCircle2,
  ChevronRight,
  Phone,
  Clock,
  HeartHandshake
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'CheesePapas | Las Mejores Papas Fritas Artesanales & Comida Rápida a Domicilio',
  description: 'Disfruta de CheesePapas: las mejores papas crujientes bañadas en queso cheddar fundido, tocineta crujiente y salsas especiales. Haz tu pedido a domicilio o en el local en segundos.',
  keywords: [
    'CheesePapas',
    'papas fritas artesanales',
    'papas con queso cheddar',
    'comida rápida a domicilio',
    'pedir papas online',
    'autoservicio comida rápida',
    'papas con tocineta'
  ],
  openGraph: {
    title: 'CheesePapas — Las Mejores Papas Artesanales & Domicilio',
    description: 'Papas frita doble cocción bañadas en cremoso queso cheddar y toppings premium. ¡Ordena en línea fácil y rápido!',
    images: [{ url: '/logo-cheesepapas.webp', width: 512, height: 512, alt: 'Logo CheesePapas' }],
  },
}

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FastFoodRestaurant',
    name: 'CheesePapas',
    image: 'https://cheesepapas.vercel.app/logo-cheesepapas.webp',
    telephone: '+57 310 3967137',
    url: 'https://cheesepapas.vercel.app',
    servesCuisine: ['Papas Fritas', 'Comida Rápida', 'Fast Food'],
    priceRange: '$$',
    slogan: 'Cuando pienses en papas piensa en cheesepapas',
    hasMenu: 'https://cheesepapas.vercel.app/order/products',
    description: 'Autoservicio de papas artesanales con queso cheddar derretido, toppings premium y servicio a domicilio.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CO',
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
          <a href="#menu-destacado" className="hover:text-amber-400 transition-colors">Especialidades</a>
          <a href="#por-que-elegirnos" className="hover:text-amber-400 transition-colors">¿Por qué CheesePapas?</a>
          <a href="#como-funciona" className="hover:text-amber-400 transition-colors">¿Cómo Pedir?</a>
          <a href="#preguntas-frecuentes" className="hover:text-amber-400 transition-colors">Preguntas Frecuentes</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/order"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-2"
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
                <Sparkles className="w-3.5 h-3.5" />
                <span>¡Autoservicio & Domicilios en Minutos!</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-saira font-extrabold text-white tracking-tight leading-[1.1]">
                Las Papas Fritas Artesanales Más <span className="text-amber-400 underline decoration-amber-500/40 decoration-wavy">Crujientes & Quesosas</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Papas seleccionadas con doble cocción doradita, bañadas en abundante queso cheddar cremoso fundido al instante y combinadas con los mejores toppings artesanales.
              </p>

              {/* Action Buttons (CTAs) */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/order"
                  id="hero-cta-main"
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-4 rounded-xl text-base transition-all shadow-xl shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-3 border-2 border-amber-400"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>¡HACER PEDIDO AHORA!</span>
                </Link>

                <Link
                  href="/order/products"
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold px-7 py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 hover:border-slate-600"
                >
                  <span>Explorar Menú Completo</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-amber-400">100%</p>
                  <p className="text-xs text-slate-400 font-bold">Queso Cheddar Real</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-amber-400">Doble</p>
                  <p className="text-xs text-slate-400 font-bold">Cocción Crujiente</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-amber-400">⚡ Fast</p>
                  <p className="text-xs text-slate-400 font-bold">Entrega Domicilio</p>
                </div>
              </div>
            </div>

            {/* Right Hero Image Frame */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 text-center">
                <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56">
                  <Image
                    src="/logo-cheesepapas.webp"
                    alt="CheesePapas Especiales"
                    fill
                    className="object-contain drop-shadow-[0_10px_25px_rgba(245,158,11,0.25)]"
                    priority
                    unoptimized
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider">Top de la Casa</span>
                    <span className="text-xs font-bold text-slate-400">⭐ 4.9 / 5.0</span>
                  </div>
                  <h3 className="font-saira font-extrabold text-xl text-white">CheesePapas Supremas</h3>
                  <p className="text-xs text-slate-400 font-medium">Bañadas en extra cheddar fundido, tocineta ahumada crujiente y salsa especial CheesePapas.</p>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-lg font-black text-white">$16.900</span>
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
              Nos enfocamos en un solo objetivo: crear el plato de papas más apetitoso, crujiente y sabroso de la ciudad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-black">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Doble Cocción Crocante</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Nuestras papas son doradas a la perfección: doraditas por fuera y suaves y esponjosas por dentro.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-black">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Salsa Cheddar Secreta</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Elaborada diariamente con queso cheddar de calidad superior, suave, cremosa y siempre caliente.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-black">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Toppings A Elegir</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Personaliza tus papas con tocineta ahumada, jalapeños picantes, carne desmechada y salsas de la casa.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-black">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Pedido Rápido & Fácil</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Pide desde la web sin esperar en filas. Recibe en la puerta de tu casa o consume en nuestro local.
              </p>
            </div>
          </div>
        </section>

        {/* POPULAR MENU SHOWCASE */}
        <section id="menu-destacado" className="py-16 px-4 sm:px-8 bg-slate-900/40 border-y border-slate-800/60">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Menú Favorito</h2>
                <p className="text-2xl sm:text-4xl font-saira font-extrabold text-white">
                  Nuestras Combinaciones Más Pedidas
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
              {/* Product 1 */}
              <article className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between hover:border-amber-500/50 transition-all">
                <div className="space-y-3">
                  <div className="inline-block bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    ⭐ Favorito nº 1
                  </div>
                  <h3 className="text-xl font-extrabold text-white">CheesePapas Clásicas</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Porción abundante de papas crujientes bañadas en nuestra icónica salsa de queso cheddar caliente.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-xl font-black text-amber-400">$12.900</span>
                  <Link
                    href="/order/products"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-colors"
                  >
                    Ordenar
                  </Link>
                </div>
              </article>

              {/* Product 2 */}
              <article className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between hover:border-amber-500/50 transition-all">
                <div className="space-y-3">
                  <div className="inline-block bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    🥓 Extra Tocineta
                  </div>
                  <h3 className="text-xl font-extrabold text-white">CheesePapas con Tocineta</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Papas doraditas con abundante cheddar fundido y bites crocantes de tocineta ahumada artesanal.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-xl font-black text-amber-400">$15.900</span>
                  <Link
                    href="/order/products"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-colors"
                  >
                    Ordenar
                  </Link>
                </div>
              </article>

              {/* Product 3 */}
              <article className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between hover:border-amber-500/50 transition-all">
                <div className="space-y-3">
                  <div className="inline-block bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    🔥 Súper Completo
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Combo Papas + Bebida Helada</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Tus CheesePapas favoritas acompañadas de una gaseosa o bebida fría a tu elección.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-xl font-black text-amber-400">$18.500</span>
                  <Link
                    href="/order/products"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-colors"
                  >
                    Ordenar
                  </Link>
                </div>
              </article>
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
                Selecciona si deseas recibir tu pedido a domicilio en tu puerta o comer directamente en el local.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                2
              </div>
              <h3 className="font-extrabold text-lg text-white">Arma tu Combo</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Escoge tus papas, añade toppings extra (tocineta, jalapeños, queso) y tus salsas preferidas.
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
                  <span>¿Cómo puedo hacer un pedido a domicilio en CheesePapas?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  Es muy sencillo. Haz clic en el botón <strong className="text-white">"Ordenar Ahora"</strong>, selecciona la opción <strong className="text-white">"A Domicilio"</strong>, elige tu ubicación en el mapa o ingresa tu dirección, añade tus productos al carrito y confirma tu pedido.
                </p>
              </details>

              <details className="group bg-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Cuánto tarda la entrega de los pedidos a domicilio?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  El tiempo estimado de preparación y entrega oscila entre 20 y 35 minutos dependiendo de tu zona de ubicación. Puedes monitorear el estado de tu pedido en tiempo real desde la pantalla de confirmación.
                </p>
              </details>

              <details className="group bg-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer transition-colors [&[open]]:border-amber-500/50">
                <summary className="font-extrabold text-sm sm:text-base text-white flex justify-between items-center">
                  <span>¿Puedo personalizar mis papas con adiciones y salsas?</span>
                  <span className="text-amber-400 font-black text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  ¡Sí! Puedes agregar tocineta, jalapeños, queso extra, suero costeño y elegir entre todas nuestras salsas artesanales en el menú interactivo antes de enviar tu orden.
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
              "Cuando pienses en papas piensa en cheesepapas"
            </p>
            <div className="pt-2">
              <Link
                href="/order"
                className="inline-flex items-center gap-3 bg-slate-950 hover:bg-slate-900 text-white font-black px-8 py-4 rounded-xl text-base shadow-2xl transition-all active:scale-95 border-2 border-slate-900"
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
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
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
            <a href="tel:+573103967137" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Tel: +57 310 3967137
            </a>
            <span>•</span>
            <Link href="/login" className="hover:text-amber-400 transition-colors">
              Acceso Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
