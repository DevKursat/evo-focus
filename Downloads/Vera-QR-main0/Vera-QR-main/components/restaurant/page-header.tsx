'use client'

import { useApp } from '@/lib/app-context'

interface Props {
  titleKey: string
  descriptionKey?: string
}

export default function PageHeader({ titleKey, descriptionKey }: Props) {
  const { t } = useApp()

  // Helper to get nested value from translation object
  const getValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
  }

  const title = getValue(t, titleKey) || titleKey
  const description = descriptionKey ? (getValue(t, descriptionKey) || descriptionKey) : null

  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      {description && (
        <p className="text-muted-foreground mt-2">
          {description}
        </p>
      )}
    </div>
  )
}
