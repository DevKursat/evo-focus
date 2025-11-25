'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Eye, EyeOff, Plus, Trash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

interface Category {
  id: string
  name_tr: string
  name_en: string | null
  visible: boolean | null
  display_order: number | null
}

interface Product {
  id: string
  category_id: string | null
  name_tr: string
  name_en: string | null
  description_tr: string | null
  description_en: string | null
  price: number
  image_url: string | null
  is_available: boolean | null
  stock_count: number | null
}

interface Props {
  categories: Category[]
  items: Product[]
}

export default function MenuCategoriesList({ categories, items }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'category' | 'item'; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { t, language } = useApp()
  const router = useRouter()
  const { toast } = useToast()

  const getItemsByCategory = (categoryId: string) => {
    return items.filter((item) => item.category_id === categoryId)
  }

  const getName = (item: Category | Product) => {
    return language === 'tr' ? item.name_tr : (item.name_en || item.name_tr)
  }

  const getDescription = (item: Product) => {
    return language === 'tr' ? item.description_tr : (item.description_en || item.description_tr)
  }

  const handleDeleteClick = (id: string, type: 'category' | 'item', name: string) => {
    setItemToDelete({ id, type, name })
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      const tableName = itemToDelete.type === 'category' ? 'categories' : 'products'
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', itemToDelete.id)

      if (error) throw error

      toast({
        title: 'Başarılı',
        description: `${itemToDelete.type === 'category' ? 'Kategori' : 'Ürün'} silindi`,
      })

      router.refresh()
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Silme işlemi başarısız',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500 mb-4 dark:text-slate-400">{t.menu.noCategory}</p>
            <Link href="/dashboard/menu/categories/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t.menu.firstCategory}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        categories.map((category) => {
          const categoryItems = getItemsByCategory(category.id)
          const isExpanded = expandedCategory === category.id

          return (
            <Card key={category.id} className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : category.id)
                    }
                    className="dark:text-slate-200"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </Button>
                  <CardTitle className="text-lg dark:text-white">{getName(category)}</CardTitle>
                  <Badge variant={category.visible ? 'default' : 'secondary'}>
                    {category.visible ? t.common.success : t.common.error}
                    {/* Using success/error purely for color, ideally should add proper translation for Visible/Hidden */}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    ({categoryItems.length} {t.menu.products.toLowerCase()})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/menu/categories/${category.id}/edit`}>
                    <Button variant="ghost" size="sm" className="dark:text-slate-200">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="dark:text-slate-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleDeleteClick(category.id, 'category', getName(category))}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  {categoryItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <p className="mb-3">{t.menu.noProduct}</p>
                      <Link href={`/dashboard/menu/items/new?category=${category.id}`}>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          {t.menu.newProduct}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-lg p-4 hover:border-blue-500 transition-colors dark:border-gray-600"
                        >
                          {item.image_url && (
                            <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                              <Image
                                src={item.image_url}
                                alt={getName(item)}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold dark:text-white">{getName(item)}</h4>
                            <Badge
                              variant={item.is_available ? 'default' : 'destructive'}
                            >
                              {item.is_available ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Badge>
                          </div>
                          {getDescription(item) && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                              {getDescription(item)}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              ₺{item.price.toFixed(2)}
                            </span>
                            <div className="flex gap-1">
                              <Link href={`/dashboard/menu/items/${item.id}/edit`}>
                                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-slate-200">
                                  <Edit className="h-3 w-3 mr-1" />
                                  {t.common.edit}
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                className="dark:border-gray-600 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleDeleteClick(item.id, 'item', getName(item))}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {item.stock_count !== null && (
                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                              {t.menu.stock}: {item.stock_count}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })
      )}

      {/* Uncategorized Items Section */}
      {items.filter(item => !item.category_id || !categories.find(c => c.id === item.category_id)).length > 0 && (
        <Card className="border-dashed border-slate-300 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-slate-600 dark:text-slate-400">Kategorisiz Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.filter(item => !item.category_id || !categories.find(c => c.id === item.category_id)).map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 bg-white dark:bg-slate-800 hover:border-blue-500 transition-colors dark:border-gray-600"
                >
                  {item.image_url && (
                    <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={item.image_url}
                        alt={getName(item)}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold dark:text-white">{getName(item)}</h4>
                    <Badge
                      variant={item.is_available ? 'default' : 'destructive'}
                    >
                      {item.is_available ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Badge>
                  </div>
                  {getDescription(item) && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                      {getDescription(item)}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₺{item.price.toFixed(2)}
                    </span>
                    <div className="flex gap-1">
                      <Link href={`/dashboard/menu/items/${item.id}/edit`}>
                        <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-slate-200">
                          <Edit className="h-3 w-3 mr-1" />
                          {t.common.edit}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="dark:border-gray-600 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDeleteClick(item.id, 'item', getName(item))}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )
      }

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emin misiniz?</DialogTitle>
            <DialogDescription>
              <strong>{itemToDelete?.name}</strong> {itemToDelete?.type === 'category' ? 'kategorisini' : 'ürününü'} silmek üzeresiniz. Bu işlem geri alınamaz.
              {itemToDelete?.type === 'category' && (
                <p className="mt-2 text-red-600">⚠️ Bu kategorideki tüm ürünler kategorisiz kalacak.</p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              İptal
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
