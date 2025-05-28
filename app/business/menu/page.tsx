"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Upload, Save, Search, Filter, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import AuthHeader from "@/components/AuthHeader" // Import AuthHeader component

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  available: boolean
  featured: boolean
  allergens?: string[]
  nutritionInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export default function DigitalMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: "1",
      name: "Signature Latte",
      description: "Our house blend with steamed milk and a hint of vanilla",
      price: 4.5,
      category: "Coffee",
      available: true,
      featured: true,
      allergens: ["Dairy"],
      nutritionInfo: { calories: 150, protein: 8, carbs: 12, fat: 6 },
    },
    {
      id: "2",
      name: "Avocado Toast",
      description: "Fresh avocado on artisan sourdough with cherry tomatoes",
      price: 8.99,
      category: "Food",
      available: true,
      featured: false,
      allergens: ["Gluten"],
      nutritionInfo: { calories: 320, protein: 12, carbs: 35, fat: 18 },
    },
    {
      id: "3",
      name: "Chocolate Croissant",
      description: "Buttery pastry filled with rich dark chocolate",
      price: 3.25,
      category: "Pastries",
      available: false,
      featured: false,
      allergens: ["Gluten", "Dairy", "Eggs"],
      nutritionInfo: { calories: 280, protein: 6, carbs: 32, fat: 16 },
    },
  ])

  const [categories, setCategories] = useState(["Coffee", "Food", "Pastries", "Beverages", "Desserts"])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    available: true,
    featured: false,
    allergens: [],
    nutritionInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  })

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddItem = () => {
    if (newItem.name && newItem.price && newItem.category) {
      const item: MenuItem = {
        id: Date.now().toString(),
        name: newItem.name,
        description: newItem.description || "",
        price: newItem.price,
        category: newItem.category,
        available: newItem.available ?? true,
        featured: newItem.featured ?? false,
        allergens: newItem.allergens || [],
        nutritionInfo: newItem.nutritionInfo || { calories: 0, protein: 0, carbs: 0, fat: 0 },
      }
      setMenuItems([...menuItems, item])
      setNewItem({
        name: "",
        description: "",
        price: 0,
        category: "",
        available: true,
        featured: false,
        allergens: [],
        nutritionInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      })
      setIsAddingItem(false)
    }
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item)
  }

  const handleUpdateItem = () => {
    if (editingItem) {
      setMenuItems(menuItems.map((item) => (item.id === editingItem.id ? editingItem : item)))
      setEditingItem(null)
    }
  }

  const handleDeleteItem = (id: string) => {
    setMenuItems(menuItems.filter((item) => item.id !== id))
  }

  const toggleAvailability = (id: string) => {
    setMenuItems(menuItems.map((item) => (item.id === id ? { ...item, available: !item.available } : item)))
  }

  const toggleFeatured = (id: string) => {
    setMenuItems(menuItems.map((item) => (item.id === id ? { ...item, featured: !item.featured } : item)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      {/* Auth Header */}
      <AuthHeader />

      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Digital Menu Manager</h1>
              <p className="text-gray-600">Manage your menu items and categories</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" aria-label="Preview Menu">
                <Eye className="h-4 w-4 mr-2" />
                Preview Menu
              </Button>
              <Button onClick={() => setIsAddingItem(true)} aria-label="Add Item">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Menu Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{menuItems.length}</div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {menuItems.filter((item) => item.available).length}
                    </div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Categories</Label>
                  <div className="mt-2 space-y-2">
                    <Button
                      variant={selectedCategory === "all" ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory("all")}
                      aria-label="All Items"
                    >
                      All Items ({menuItems.length})
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category)}
                        aria-label={category}
                      >
                        {category} ({menuItems.filter((item) => item.category === category).length})
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Search menu items"
                />
              </div>
              <Button variant="outline" aria-label="Filters">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="shadow-lg border-0 bg-white/80 backdrop-blur overflow-hidden">
                  <div className="aspect-video bg-gray-100 relative">
                    {item.image ? (
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {item.featured && <Badge className="bg-yellow-500">Featured</Badge>}
                      <Badge variant={item.available ? "default" : "secondary"}>
                        {item.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <span className="text-lg font-bold text-emerald-600">${item.price.toFixed(2)}</span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">{item.category}</Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => toggleAvailability(item.id)}
                          size="sm"
                          aria-label={`Toggle availability of ${item.name}`}
                        />
                        <span className="text-xs text-gray-500">Available</span>
                      </div>
                    </div>

                    {item.allergens && item.allergens.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Allergens:</div>
                        <div className="flex flex-wrap gap-1">
                          {item.allergens.map((allergen) => (
                            <Badge key={allergen} variant="outline" className="text-xs">
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditItem(item)}
                        className="flex-1"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleFeatured(item.id)}
                        className={item.featured ? "bg-yellow-50 border-yellow-200" : ""}
                        aria-label={item.featured ? `Hide ${item.name}` : `Show ${item.name}`}
                      >
                        {item.featured ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
            <DialogDescription>Create a new item for your digital menu</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Enter item name"
                    aria-label="Item Name"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number.parseFloat(e.target.value) })}
                    placeholder="0.00"
                    aria-label="Price"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" aria-label="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} aria-label={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe your menu item"
                  rows={3}
                  aria-label="Description"
                />
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Available</Label>
                  <p className="text-sm text-gray-500">Item is available for ordering</p>
                </div>
                <Switch
                  checked={newItem.available}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, available: checked })}
                  aria-label="Available"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured Item</Label>
                  <p className="text-sm text-gray-500">Highlight this item on your menu</p>
                </div>
                <Switch
                  checked={newItem.featured}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, featured: checked })}
                  aria-label="Featured Item"
                />
              </div>

              <div>
                <Label>Allergens</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["Dairy", "Gluten", "Nuts", "Eggs", "Soy", "Shellfish"].map((allergen) => (
                    <div key={allergen} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={allergen}
                        checked={newItem.allergens?.includes(allergen)}
                        onChange={(e) => {
                          const allergens = newItem.allergens || []
                          if (e.target.checked) {
                            setNewItem({ ...newItem, allergens: [...allergens, allergen] })
                          } else {
                            setNewItem({ ...newItem, allergens: allergens.filter((a) => a !== allergen) })
                          }
                        }}
                        aria-label={allergen}
                      />
                      <Label htmlFor={allergen} className="text-sm">
                        {allergen}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nutrition" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Calories</Label>
                  <Input
                    type="number"
                    value={newItem.nutritionInfo?.calories}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        nutritionInfo: {
                          ...newItem.nutritionInfo!,
                          calories: Number.parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    aria-label="Calories"
                  />
                </div>
                <div>
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    value={newItem.nutritionInfo?.protein}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        nutritionInfo: {
                          ...newItem.nutritionInfo!,
                          protein: Number.parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    aria-label="Protein"
                  />
                </div>
                <div>
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    value={newItem.nutritionInfo?.carbs}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        nutritionInfo: {
                          ...newItem.nutritionInfo!,
                          carbs: Number.parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    aria-label="Carbs"
                  />
                </div>
                <div>
                  <Label>Fat (g)</Label>
                  <Input
                    type="number"
                    value={newItem.nutritionInfo?.fat}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        nutritionInfo: {
                          ...newItem.nutritionInfo!,
                          fat: Number.parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    aria-label="Fat"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAddingItem(false)} aria-label="Cancel">
              Cancel
            </Button>
            <Button onClick={handleAddItem} aria-label="Add Item">
              <Save className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>Update your menu item details</DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Item Name</Label>
                  <Input
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    aria-label="Item Name"
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number.parseFloat(e.target.value) })}
                    aria-label="Price"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  aria-label="Description"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingItem(null)} aria-label="Cancel">
                  Cancel
                </Button>
                <Button onClick={handleUpdateItem} aria-label="Update Item">
                  <Save className="h-4 w-4 mr-2" />
                  Update Item
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
