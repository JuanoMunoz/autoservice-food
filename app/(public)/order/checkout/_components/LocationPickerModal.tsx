'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, X, Check, Loader2, Search } from 'lucide-react'

interface LocationPickerModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectLocation: (data: { street: string; reference: string; lat?: number; lng?: number }) => void
    initialAddress?: string
}

export default function LocationPickerModal({
    isOpen,
    onClose,
    onSelectLocation,
    initialAddress = '',
}: LocationPickerModalProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const leafletMap = useRef<any>(null)
    const markerRef = useRef<any>(null)

    const [isLoadingAddress, setIsLoadingAddress] = useState(false)
    const [isLocatingUser, setIsLocatingUser] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState(initialAddress)
    const [selectedReference, setSelectedReference] = useState('')
    const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 4.6097, lng: -74.0817 }) // Default: Bogotá
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    // Load Leaflet CSS
    useEffect(() => {
        if (!isOpen) return

        const cssId = 'leaflet-css'
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link')
            link.id = cssId
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }
    }, [isOpen])

    // Reverse geocoding via Nominatim
    const fetchAddressFromCoords = async (lat: number, lng: number) => {
        setIsLoadingAddress(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'es',
                    },
                }
            )
            const data = await response.json()

            if (data && data.address) {
                const addr = data.address
                const road = addr.road || addr.pedestrian || addr.street || addr.suburb || ''
                const houseNumber = addr.house_number ? `#${addr.house_number}` : ''
                const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || ''
                const city = addr.city || addr.town || addr.village || addr.municipality || ''

                let formattedStreet = ''
                if (road) {
                    formattedStreet = houseNumber ? `${road} ${houseNumber}` : road
                } else {
                    formattedStreet = data.display_name.split(',')[0] || 'Ubicación seleccionada'
                }

                let formattedRef = ''
                if (neighbourhood && city) {
                    formattedRef = `Barrio ${neighbourhood}, ${city}`
                } else if (neighbourhood) {
                    formattedRef = `Barrio ${neighbourhood}`
                } else if (city) {
                    formattedRef = city
                }

                setSelectedAddress(formattedStreet)
                setSelectedReference(formattedRef)
            } else {
                setSelectedAddress(`Ubicación (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
            }
        } catch (error) {
            console.error('Error in reverse geocoding:', error)
            setSelectedAddress(`Ubicación (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
        } finally {
            setIsLoadingAddress(false)
        }
    }

    // Initialize map
    useEffect(() => {
        if (!isOpen || !mapRef.current) return

        let isMounted = true

        const initMap = async () => {
            const L = (await import('leaflet')).default

            if (!isMounted || !mapRef.current) return

            // Clean previous map instance if exists
            if (leafletMap.current) {
                leafletMap.current.remove()
                leafletMap.current = null
            }

            const initialLat = coords.lat
            const initialLng = coords.lng

            const map = L.map(mapRef.current, {
                center: [initialLat, initialLng],
                zoom: 16,
                zoomControl: false,
            })

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map)

            // Custom pin icon using Lucide MapPin style
            const customIcon = L.divIcon({
                className: 'custom-leaflet-pin',
                html: `
                    <div style="
                        width: 38px;
                        height: 38px;
                        background-color: #d97706;
                        border: 3px solid #ffffff;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="
                            width: 14px;
                            height: 14px;
                            background-color: #ffffff;
                            border-radius: 50%;
                        "></div>
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 38],
            })

            const marker = L.marker([initialLat, initialLng], {
                draggable: true,
                icon: customIcon,
            }).addTo(map)

            markerRef.current = marker
            leafletMap.current = map

            // Reverse geocode initial position
            fetchAddressFromCoords(initialLat, initialLng)

            // On marker drag end
            marker.on('dragend', () => {
                const position = marker.getLatLng()
                setCoords({ lat: position.lat, lng: position.lng })
                fetchAddressFromCoords(position.lat, position.lng)
            })

            // On map click
            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng
                marker.setLatLng([lat, lng])
                setCoords({ lat, lng })
                fetchAddressFromCoords(lat, lng)
            })

            // Add zoom control to bottom right
            L.control.zoom({ position: 'bottomright' }).addTo(map)
        }

        initMap()

        return () => {
            isMounted = false
            if (leafletMap.current) {
                leafletMap.current.remove()
                leafletMap.current = null
            }
        }
    }, [isOpen])

    // Get GPS Location
    const handleGetUserLocation = () => {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización')
            return
        }

        setIsLocatingUser(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setCoords({ lat: latitude, lng: longitude })

                if (leafletMap.current && markerRef.current) {
                    leafletMap.current.setView([latitude, longitude], 17)
                    markerRef.current.setLatLng([latitude, longitude])
                }

                fetchAddressFromCoords(latitude, longitude)
                setIsLocatingUser(false)
            },
            (error) => {
                console.error('Error getting location:', error)
                setIsLocatingUser(false)
                alert('No se pudo obtener tu ubicación actual. Por favor verifica los permisos de GPS.')
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    // Search address via Nominatim
    const handleSearchAddress = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
                { headers: { 'Accept-Language': 'es' } }
            )
            const data = await response.json()

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat)
                const lng = parseFloat(data[0].lon)

                setCoords({ lat, lng })
                if (leafletMap.current && markerRef.current) {
                    leafletMap.current.setView([lat, lng], 17)
                    markerRef.current.setLatLng([lat, lng])
                }
                fetchAddressFromCoords(lat, lng)
            } else {
                alert('No se encontraron resultados para la búsqueda')
            }
        } catch (error) {
            console.error('Error searching address:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleConfirm = () => {
        onSelectLocation({
            street: selectedAddress,
            reference: selectedReference,
            lat: coords.lat,
            lng: coords.lng,
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white border border-slate-300 rounded-sm w-full max-w-2xl h-[90vh] max-h-[700px] shadow-2xl flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="bg-white border-b border-slate-200 p-3 sm:p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-amber-600" />
                        <h2 className="font-black text-slate-900 text-base sm:text-lg">
                            Selecciona tu Ubicación en el Mapa
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar & GPS Button */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-2 shrink-0">
                    <form onSubmit={handleSearchAddress} className="flex-1 flex items-center gap-2 w-full">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar calle, barrio o ciudad..."
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-sm text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-medium"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-sm transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={handleGetUserLocation}
                        disabled={isLocatingUser}
                        className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-3 py-2.5 rounded-sm transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                        {isLocatingUser ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Navigation className="w-4 h-4" />
                        )}
                        <span>Mi Ubicación (GPS)</span>
                    </button>
                </div>

                {/* Map Body */}
                <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
                    <div ref={mapRef} className="w-full h-full z-10" />

                    {/* Instruction overlay */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 text-white text-xs font-extrabold px-3 py-1.5 rounded-full backdrop-blur-md shadow-md pointer-events-none text-center max-w-[90%]">
                        Toca el mapa o arrastra el pin para mover tu ubicación
                    </div>
                </div>

                {/* Footer preview & Confirm button */}
                <div className="bg-white border-t border-slate-200 p-4 shrink-0 space-y-3">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-sm flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                Ubicación Detectada
                            </span>
                            {isLoadingAddress ? (
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-0.5">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                    <span>Obteniendo dirección exacta...</span>
                                </div>
                            ) : (
                                <>
                                    <p className="font-extrabold text-slate-900 text-sm truncate">
                                        {selectedAddress || 'Selecciona un punto en el mapa'}
                                    </p>
                                    {selectedReference && (
                                        <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                                            {selectedReference}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-3 px-4 rounded-sm text-sm border border-slate-300 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isLoadingAddress || !selectedAddress}
                            className="w-2/3 bg-amber-500 hover:bg-amber-600 text-white font-black py-3 px-4 rounded-sm text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Confirmar esta Ubicación</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
