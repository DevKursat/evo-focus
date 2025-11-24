'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (address: string, placeData?: any) => void
  placeholder?: string
  className?: string
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Adres ara...',
  className = '',
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !(window as any).google?.maps?.places) return

    const autocomplete = new (window as any).google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'tr' },
        fields: ['formatted_address', 'geometry', 'name', 'address_components'],
        types: ['establishment', 'geocode'],
      }
    )

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (!place.formatted_address) return

      const addressData = {
        formatted_address: place.formatted_address,
        name: place.name,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
        address_components: place.address_components,
      }

      onChange(place.formatted_address, addressData)
    })
  }, [onChange])

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      initAutocomplete()
      setIsLoaded(true)
      return
    }

    // Load Google Maps script
    const script = document.createElement('script')
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Using manual address input.')
      setIsLoaded(false)
      return
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=tr`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      initAutocomplete()
      setIsLoaded(true)
    }

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [initAutocomplete])

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`pl-9 ${className}`}
      />
      {!isLoaded && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-muted-foreground mt-1">
          Google Maps yükleniyor...
        </p>
      )}
    </div>
  )
}
