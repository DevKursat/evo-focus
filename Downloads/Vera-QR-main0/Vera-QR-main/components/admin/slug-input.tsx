'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X, Search } from 'lucide-react'
import { slugify } from '@/lib/utils'
import { checkRestaurantSlug } from '@/app/admin/restaurants/actions'

interface SlugInputProps {
  value: string
  onChange: (value: string, isValid: boolean) => void
  currentId?: string // To exclude current restaurant from check
  label?: string
  disabled?: boolean
}

export default function SlugInput({ value, onChange, currentId, label = "URL Slug", disabled = false }: SlugInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Sync internal state with prop value if it changes externally
  useEffect(() => {
    if (value !== inputValue) {
       setInputValue(value)
    }
  }, [value])

  const checkAvailability = async () => {
    if (!inputValue) {
      setIsValid(null)
      setErrorMessage('')
      return
    }

    setIsLoading(true)
    try {
      const result = await checkRestaurantSlug(inputValue, currentId)

      if (result.error) {
        console.error('Slug check error:', result.error)
        setIsValid(false)
        setErrorMessage('Kontrol edilirken hata oluştu')
        onChange(inputValue, false)
      } else if (!result.isAvailable) {
        setIsValid(false)
        setErrorMessage('Bu slug kullanımda')
        onChange(inputValue, false)
      } else {
        setIsValid(true)
        setErrorMessage('')
        onChange(inputValue, true)
      }
    } catch (err) {
      console.error(err)
      setIsValid(false)
      onChange(inputValue, false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = slugify(e.target.value)
    setInputValue(newValue)
    setIsValid(null) // Reset validation status on change
    setErrorMessage('')
    // Propagate change but mark as invalid/unchecked until button is clicked
    // OR we can pass true if we trust the user, but requirements say validation is needed.
    // Better to pass 'false' for isValid so the parent form can block submit if it wants strict validation.
    onChange(newValue, false)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="slug-input">{label} *</Label>
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 whitespace-nowrap">veraqr.com/</span>
                <Input
                    id="slug-input"
                    value={inputValue}
                    onChange={handleChange}
                    placeholder="ornek-restoran"
                    className={`pr-10 ${
                        isValid === true ? 'border-green-500 focus-visible:ring-green-500' :
                        isValid === false ? 'border-red-500 focus-visible:ring-red-500' : ''
                    }`}
                    disabled={disabled}
                />
            </div>
            <div className="absolute right-3 top-2.5">
                {isValid === true ? (
                    <Check className="h-5 w-5 text-green-500" />
                ) : isValid === false ? (
                    <X className="h-5 w-5 text-red-500" />
                ) : null}
            </div>
        </div>
        <Button
            type="button"
            variant="outline"
            onClick={checkAvailability}
            disabled={disabled || isLoading || !inputValue}
        >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Kontrol Et
        </Button>
      </div>
      {errorMessage && (
        <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  )
}
