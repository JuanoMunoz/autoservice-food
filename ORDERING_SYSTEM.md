# 🧀 CheesePapas - Sistema de Pedidos

## Descripción General

El sistema de pedidos de CheesePapas es una aplicación de autoservicio tipo kiosco (similar a McDonald's o Burger King) que permite a los clientes hacer pedidos de manera intuitiva a través de una interfaz mobile-first.

## Flujo de Pedidos

El sistema consta de 5 pantallas principales:

### 1. Seleccionar Ubicación (`/order`)
- El usuario elige entre:
  - 🏪 **En el local**: Comer en el establecimiento
  - 🚗 **A domicilio**: Envío a dirección

### 2. Catálogo de Productos (`/order/products`)
- Visualización de productos disponibles en grid
- Tabs para filtrar por tipo: Comidas (🍟) y Bebidas (🥤)
- Cada producto muestra: nombre, descripción, imagen, precio
- Carrito flotante con total actualizado en tiempo real

### 3. Detalle del Producto
- **Productos** (`/order/product/[productId]`):
  - Selector de cantidad
  - Ingredientes adicionales (Topping) con precio
  - Selector de salsas (modal)
  
- **Bebidas** (`/order/drink/[drinkId]`):
  - Selector de cantidad solamente

### 4. Resumen del Pedido (`/order/checkout`)
- Resumen de items del carrito
- Nombre del cliente (opcional)
- **Si es a domicilio**: Modal para ingresar dirección y referencia
- Selector de método de pago: Efectivo 💵, Tarjeta 💳, Transferencia 🏦
- Total calculado automáticamente

### 5. Confirmación de Orden (`/order/confirmation/[orderId]`)
- Número de orden
- Estado actual de la orden (Recibida, Preparando, En Camino, Completada)
- Timeline de progreso
- Detalles del pedido y total
- Botón para cancelar (solo si está en CREATED o PREPARING)
- Opción de hacer otro pedido

## Arquitectura

### Context y State Management

**CartContext** (`lib/cart-context.tsx`)
- Maneja el estado global del carrito
- Persistencia en localStorage automática
- Métodos principales:
  - `setLocation()`: Selecciona ubicación
  - `addItem()`: Añade item al carrito
  - `removeItem()`: Elimina item
  - `updateItemQuantity()`: Cambia cantidad
  - `updateItemIngredients()`: Actualiza ingredientes
  - `updateItemSauces()`: Actualiza salsas
  - `setBuyerName()`: Guarda nombre
  - `setDeliveryAddress()`: Guarda dirección
  - `setPaymentType()`: Guarda método de pago
  - `getTotal()`: Calcula total
  - `getItemCount()`: Obtiene cantidad de items

### Types (`types/Order.ts`)

```typescript
interface CartProduct {
  id: string
  name: string
  description: string
  imageRoute?: string
  price: number
  quantity: number
  ingredients: CartIngredient[]
  sauces: CartSauce[]
}

interface CartDrink {
  id: string
  name: string
  description: string
  imageRoute?: string
  price: number
  quantity: number
}
```

### Hooks

**useCart()** (`app/_hooks/use-cart.ts`)
- Hook para acceder al context del carrito desde cualquier componente
- Valida que esté dentro de CartProvider

### Utilidades

**cartStorage.ts** (`utils/cartStorage.ts`)
- `getCartFromStorage()`: Carga carrito del localStorage
- `saveCartToStorage()`: Guarda carrito en localStorage
- `clearCartFromStorage()`: Limpia localStorage
- `formatCurrency()`: Formatea precios en COP
- `calculateItemTotal()`: Calcula total de un item

### Server Actions (`app/(public)/order/actions.ts`)

- `getProducts()`: Obtiene todos los productos
- `getDrinks()`: Obtiene todas las bebidas
- `getSauces()`: Obtiene todas las salsas
- `getIngredients()`: Obtiene todos los ingredientes
- `getProductDetail(id)`: Obtiene detalles de un producto con ingredientes
- `getDrinkDetail(id)`: Obtiene detalles de una bebida
- `createOrder(details)`: Crea una orden en la BD
- `getOrderDetail(id)`: Obtiene detalles de una orden creada
- `cancelOrder(id)`: Cancela una orden (solo CREATED/PREPARING)

## Estructura de Carpetas

```
app/
├── (public)/
│   └── order/
│       ├── page.tsx (seleccionar ubicación)
│       ├── actions.ts (server actions)
│       ├── products/
│       │   └── page.tsx (catálogo)
│       ├── product/[productId]/
│       │   └── page.tsx (detalle producto)
│       ├── drink/[drinkId]/
│       │   └── page.tsx (detalle bebida)
│       ├── checkout/
│       │   └── page.tsx (resumen pedido)
│       └── confirmation/[orderId]/
│           └── page.tsx (confirmación)
├── _hooks/
│   └── use-cart.ts
└── layout.tsx (con CartProvider)

lib/
├── cart-context.tsx (context global)
└── prisma.ts

utils/
├── cartStorage.ts (localStorage)
└── cartCalculations.ts

types/
└── Order.ts
```

## Características

### Mobile & Tablet First
- Diseño responsive con Tailwind CSS
- Grilla de 2 columnas en mobile, 3 en desktop
- Botones flotantes para carrito
- Modales para dirección y salsas

### Persistencia
- Carrito guardado en localStorage automáticamente
- Se recupera al recargar la página
- Se limpia después de crear una orden

### Cálculos Dinámicos
- Total recalculado al cambiar cantidades
- Suma de precios de ingredientes adicionales
- Sin impuestos configurados (añadir en futuro)

### Validaciones
- Ubicación obligatoria
- Dirección obligatoria para domicilio
- Método de pago obligatorio
- Carrito con al menos 1 item

### Estados de Orden
- 📝 **CREATED**: Orden recibida (cancelable)
- 👨‍🍳 **PREPARING**: Preparando (cancelable)
- 🚗 **DELIVERING**: En camino
- ✅ **COMPLETED**: Completada
- ❌ **CANCELLED**: Cancelada

## Data Model (Prisma)

La orden se almacena con:

```
Order
├── id (autoincrement)
├── items: OrderItem[]
│   ├── product o drink
│   ├── quantity
│   ├── unitPrice
│   ├── sauces: OrderItemSauce[]
│   └── extras: OrderItemIngredient[]
├── total (Decimal)
├── onSite (boolean)
├── address (string)
├── buyerName (string, opcional)
├── status (enum)
└── timestamps
```

## Próximas Mejoras

- [ ] Integración de mapa (Google Maps/Mapbox) para seleccionar ubicación
- [ ] Imágenes reales para productos
- [ ] Impuestos/descuentos
- [ ] Programa de lealtad
- [ ] Notificaciones en tiempo real
- [ ] Historial de pedidos
- [ ] Ofertas y combos
- [ ] Integración de pagos reales
- [ ] Admin panel para gestionar órdenes
- [ ] Tracking en tiempo real de entrega

## Instalación y Uso

1. El context se inicializa automáticamente en `app/layout.tsx`
2. Usar el hook `useCart()` en cualquier componente cliente
3. Las acciones de servidor están en `app/(public)/order/actions.ts`
4. Los tipos están en `types/Order.ts`

## Ejemplos de Uso

```tsx
// En un componente
import { useCart } from '@/app/_hooks/use-cart'

export default function MyComponent() {
  const { cart, addItem, getTotal } = useCart()
  
  const handleAdd = () => {
    addItem({
      id: '123',
      name: 'Papa Doble Queso',
      price: 28000,
      quantity: 1,
      ingredients: [],
      sauces: []
    })
  }
  
  return (
    <div>
      <button onClick={handleAdd}>Agregar</button>
      <p>Total: {getTotal()}</p>
    </div>
  )
}
```

---

**Creado para CheesePapas** 🧀
