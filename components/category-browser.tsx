"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Utensils,
  Coffee,
  Dumbbell,
  ShoppingBag,
  Briefcase,
  Stethoscope,
  Music,
  Palette,
  Car,
  GraduationCap,
  Smartphone,
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar,
  PartyPopper,
  Trophy,
  Heart,
  Users,
  Building,
  Plane,
  BookOpen,
  Scissors,
  Hammer,
  Zap,
  Baby,
  PawPrint,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  count: string
  color: string
  gradient: string
  description: string
  type: 'business' | 'event'
  trending?: boolean
  popular?: boolean
  growth?: string
  subcategories?: string[]
  featured?: boolean
}

interface CategoryBrowserProps {
  onCategorySelect?: (category: Category) => void
  className?: string
}

export function CategoryBrowser({ onCategorySelect, className }: CategoryBrowserProps) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [selectedType, setSelectedType] = useState<'business' | 'event' | 'all'>('all')

  const allCategories: Category[] = [
    // BUSINESS CATEGORIES
    {
      id: "restaurants",
      name: "Restaurants",
      icon: Utensils,
      count: "240+",
      color: "bg-red-500",
      gradient: "from-red-500 to-orange-500",
      description: "Local dining experiences",
      type: "business",
      trending: true,
      growth: "+12%",
      subcategories: ["Fast Food", "Fine Dining", "Local Cuisine", "International"],
      featured: true
    },
    {
      id: "cafes",
      name: "Cafés & Coffee",
      icon: Coffee,
      count: "85+",
      color: "bg-amber-500",
      gradient: "from-amber-500 to-yellow-500",
      description: "Coffee shops & bakeries",
      type: "business",
      popular: true,
      subcategories: ["Coffee Shops", "Bakeries", "Tea Houses", "Juice Bars"]
    },
    {
      id: "fitness",
      name: "Fitness & Wellness",
      icon: Dumbbell,
      count: "45+",
      color: "bg-green-500",
      gradient: "from-green-500 to-emerald-500",
      description: "Gyms & wellness centers",
      type: "business",
      trending: true,
      growth: "+18%",
      subcategories: ["Gyms", "Yoga Studios", "Spas", "Personal Training"]
    },
    {
      id: "shopping",
      name: "Shopping",
      icon: ShoppingBag,
      count: "180+",
      color: "bg-purple-500",
      gradient: "from-purple-500 to-pink-500",
      description: "Retail & boutiques",
      type: "business",
      subcategories: ["Fashion", "Electronics", "Home & Garden", "Groceries"],
      featured: true
    },
    {
      id: "services",
      name: "Professional Services",
      icon: Briefcase,
      count: "320+",
      color: "bg-blue-500",
      gradient: "from-blue-500 to-cyan-500",
      description: "Professional services",
      type: "business",
      popular: true,
      subcategories: ["Legal", "Accounting", "Consulting", "Real Estate"]
    },
    {
      id: "healthcare",
      name: "Healthcare",
      icon: Stethoscope,
      count: "95+",
      color: "bg-teal-500",
      gradient: "from-teal-500 to-green-500",
      description: "Medical & wellness",
      type: "business",
      subcategories: ["Hospitals", "Clinics", "Pharmacies", "Dental"]
    },
    {
      id: "beauty",
      name: "Beauty & Salon",
      icon: Scissors,
      count: "120+",
      color: "bg-pink-400",
      gradient: "from-pink-400 to-rose-400",
      description: "Beauty & grooming services",
      type: "business",
      trending: true,
      growth: "+22%",
      subcategories: ["Hair Salons", "Nail Studios", "Barbershops", "Spas"]
    },
    {
      id: "automotive",
      name: "Automotive",
      icon: Car,
      count: "75+",
      color: "bg-gray-600",
      gradient: "from-gray-600 to-slate-600",
      description: "Car services & sales",
      type: "business",
      subcategories: ["Repair", "Sales", "Parts", "Car Wash"]
    },
    {
      id: "education",
      name: "Education",
      icon: GraduationCap,
      count: "55+",
      color: "bg-emerald-500",
      gradient: "from-emerald-500 to-teal-500",
      description: "Schools & training",
      type: "business",
      subcategories: ["Schools", "Universities", "Training", "Tutoring"]
    },
    {
      id: "technology",
      name: "Technology",
      icon: Smartphone,
      count: "90+",
      color: "bg-blue-600",
      gradient: "from-blue-600 to-indigo-600",
      description: "Tech services & repairs",
      type: "business",
      trending: true,
      growth: "+35%",
      subcategories: ["Phone Repair", "Computer Services", "Web Design", "IT Support"]
    },
    {
      id: "home-services",
      name: "Home Services",
      icon: Hammer,
      count: "150+",
      color: "bg-orange-500",
      gradient: "from-orange-500 to-red-500",
      description: "Home improvement & repair",
      type: "business",
      popular: true,
      subcategories: ["Plumbing", "Electrical", "Cleaning", "Gardening"]
    },
    {
      id: "real-estate",
      name: "Real Estate",
      icon: Building,
      count: "65+",
      color: "bg-slate-600",
      gradient: "from-slate-600 to-gray-600",
      description: "Property & housing",
      type: "business",
      subcategories: ["Sales", "Rentals", "Property Management", "Valuation"]
    },
    {
      id: "travel",
      name: "Travel & Tourism",
      icon: Plane,
      count: "40+",
      color: "bg-sky-500",
      gradient: "from-sky-500 to-blue-500",
      description: "Travel services & tours",
      type: "business",
      subcategories: ["Travel Agencies", "Hotels", "Tour Guides", "Car Rental"]
    },
    {
      id: "pets",
      name: "Pet Services",
      icon: PawPrint,
      count: "35+",
      color: "bg-amber-600",
      gradient: "from-amber-600 to-orange-600",
      description: "Pet care & supplies",
      type: "business",
      trending: true,
      growth: "+28%",
      subcategories: ["Veterinary", "Pet Grooming", "Pet Stores", "Pet Training"]
    },
    {
      id: "childcare",
      name: "Childcare",
      icon: Baby,
      count: "25+",
      color: "bg-pink-300",
      gradient: "from-pink-300 to-pink-400",
      description: "Child care services",
      type: "business",
      subcategories: ["Daycare", "Babysitting", "Tutoring", "Kids Activities"]
    },

    // EVENT CATEGORIES
    {
      id: "music-events",
      name: "Music & Concerts",
      icon: Music,
      count: "45+",
      color: "bg-purple-600",
      gradient: "from-purple-600 to-pink-600",
      description: "Live music & performances",
      type: "event",
      trending: true,
      growth: "+40%",
      subcategories: ["Concerts", "Live Bands", "DJ Sets", "Music Festivals"],
      featured: true
    },
    {
      id: "cultural-events",
      name: "Arts & Culture",
      icon: Palette,
      count: "30+",
      color: "bg-indigo-500",
      gradient: "from-indigo-500 to-purple-500",
      description: "Cultural & artistic events",
      type: "event",
      subcategories: ["Art Exhibitions", "Theater", "Dance", "Poetry"]
    },
    {
      id: "sports-events",
      name: "Sports & Fitness",
      icon: Trophy,
      count: "55+",
      color: "bg-green-600",
      gradient: "from-green-600 to-emerald-600",
      description: "Sports competitions & activities",
      type: "event",
      popular: true,
      subcategories: ["Football", "Basketball", "Running", "Fitness Classes"]
    },
    {
      id: "community-events",
      name: "Community Gatherings",
      icon: Users,
      count: "80+",
      color: "bg-blue-500",
      gradient: "from-blue-500 to-cyan-500",
      description: "Local community events",
      type: "event",
      trending: true,
      growth: "+25%",
      subcategories: ["Meetups", "Workshops", "Networking", "Social Events"],
      featured: true
    },
    {
      id: "business-events",
      name: "Business & Networking",
      icon: Briefcase,
      count: "35+",
      color: "bg-slate-700",
      gradient: "from-slate-700 to-gray-700",
      description: "Professional events",
      type: "event",
      subcategories: ["Conferences", "Seminars", "Workshops", "Trade Shows"]
    },
    {
      id: "entertainment-events",
      name: "Entertainment",
      icon: PartyPopper,
      count: "60+",
      color: "bg-pink-500",
      gradient: "from-pink-500 to-rose-500",
      description: "Fun & entertainment events",
      type: "event",
      popular: true,
      subcategories: ["Parties", "Comedy Shows", "Game Nights", "Festivals"]
    },
    {
      id: "educational-events",
      name: "Education & Learning",
      icon: BookOpen,
      count: "40+",
      color: "bg-emerald-600",
      gradient: "from-emerald-600 to-teal-600",
      description: "Learning & skill development",
      type: "event",
      subcategories: ["Workshops", "Training", "Lectures", "Study Groups"]
    },
    {
      id: "food-events",
      name: "Food & Dining",
      icon: Utensils,
      count: "25+",
      color: "bg-orange-600",
      gradient: "from-orange-600 to-red-600",
      description: "Food festivals & dining events",
      type: "event",
      trending: true,
      growth: "+30%",
      subcategories: ["Food Festivals", "Cooking Classes", "Wine Tasting", "Pop-ups"]
    },
    {
      id: "wellness-events",
      name: "Health & Wellness",
      icon: Heart,
      count: "20+",
      color: "bg-green-500",
      gradient: "from-green-500 to-emerald-500",
      description: "Health & wellness activities",
      type: "event",
      subcategories: ["Yoga Classes", "Meditation", "Health Talks", "Fitness Bootcamps"]
    },
    {
      id: "tech-events",
      name: "Technology",
      icon: Zap,
      count: "15+",
      color: "bg-blue-600",
      gradient: "from-blue-600 to-indigo-600",
      description: "Tech meetups & innovation",
      type: "event",
      trending: true,
      growth: "+50%",
      subcategories: ["Tech Talks", "Hackathons", "Startup Events", "Product Launches"]
    }
  ]

  // Filter categories based on selected type
  const categories = selectedType === 'all'
    ? allCategories
    : allCategories.filter(cat => cat.type === selectedType)

  const itemsPerSlide = 4
  const totalSlides = Math.ceil(categories.length / itemsPerSlide)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, totalSlides])

  const handleCategoryClick = (category: Category) => {
    setActiveCategory(category.id)

    if (onCategorySelect) {
      onCategorySelect(category)
    } else {
      // Navigate to search with category filter and correct type
      router.push(`/search?category=${category.id}&type=${category.type}`)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }



  return (
    <section className={cn("py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50", className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Explore Categories
          </div>
          <h3 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
            Browse by Category
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Discover local businesses, services, and events organized by category. Find exactly what you&apos;re looking for in your community.
          </p>

          {/* Type Filter Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-100">
              <button
                onClick={() => {
                  setSelectedType('all')
                  setCurrentSlide(0)
                }}
                className={cn(
                  "px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2",
                  selectedType === 'all'
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                )}
              >
                <Globe className="h-4 w-4" />
                All Categories
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 ml-1">
                  {allCategories.length}
                </Badge>
              </button>
              <button
                onClick={() => {
                  setSelectedType('business')
                  setCurrentSlide(0)
                }}
                className={cn(
                  "px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2",
                  selectedType === 'business'
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                )}
              >
                <Building className="h-4 w-4" />
                Businesses
                <Badge variant="secondary" className="bg-green-100 text-green-700 ml-1">
                  {allCategories.filter(cat => cat.type === 'business').length}
                </Badge>
              </button>
              <button
                onClick={() => {
                  setSelectedType('event')
                  setCurrentSlide(0)
                }}
                className={cn(
                  "px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2",
                  selectedType === 'event'
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                )}
              >
                <Calendar className="h-4 w-4" />
                Events
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 ml-1">
                  {allCategories.filter(cat => cat.type === 'event').length}
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Category Carousel */}
        <div className="relative max-w-7xl mx-auto">
          {/* Navigation Buttons - Desktop Only */}
          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Categories Grid */}
          <div className="overflow-hidden rounded-2xl">
            {/* Mobile: Show all categories in a scrollable grid */}
            <div className="block md:hidden">
              <div className="grid grid-cols-2 gap-4 p-4 max-h-96 overflow-y-auto">
                {categories.map((category) => {
                  const IconComponent = category.icon
                  const isActive = activeCategory === category.id

                  return (
                    <Card
                      key={category.id}
                      className={cn(
                        "group cursor-pointer transition-all duration-300 border-0 shadow-md hover:shadow-lg bg-white/90 backdrop-blur-sm relative overflow-hidden",
                        isActive && "ring-2 ring-blue-500 shadow-lg scale-105",
                        category.featured && "ring-1 ring-yellow-400/50"
                      )}
                      onClick={() => handleCategoryClick(category)}
                    >
                      <CardContent className="p-4 text-center relative z-10">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg transition-all duration-300 group-hover:scale-110",
                          `bg-gradient-to-br ${category.gradient}`
                        )}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h4>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs font-semibold">
                          {category.count}
                        </Badge>
                        {category.trending && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Desktop: Carousel */}
            <div className="hidden md:block">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                      {categories
                        .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                        .map((category) => {
                        const IconComponent = category.icon
                        const isActive = activeCategory === category.id

                        return (
                          <Card
                            key={category.id}
                            className={cn(
                              "group cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-2xl bg-white/80 backdrop-blur-sm relative overflow-hidden",
                              isActive && "ring-2 ring-blue-500 shadow-2xl scale-105",
                              category.featured && "ring-2 ring-yellow-400/50"
                            )}
                            onClick={() => handleCategoryClick(category)}
                          >
                            {/* Background Gradient */}
                            <div className={cn(
                              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                              category.gradient
                            )} />

                            {/* Featured Badge */}
                            {category.featured && (
                              <div className="absolute top-3 right-3 z-10">
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold shadow-lg border-0">
                                  ⭐ Featured
                                </Badge>
                              </div>
                            )}

                            {/* Trending Badge */}
                            {category.trending && (
                              <div className="absolute top-3 left-3 z-10">
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold shadow-lg border-0">
                                  📈 Trending
                                </Badge>
                              </div>
                            )}

                            <CardContent className="p-8 text-center relative z-10">
                              {/* Icon */}
                              <div className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                                `bg-gradient-to-br ${category.gradient}`
                              )}>
                                <IconComponent className="h-10 w-10 text-white" />
                              </div>

                              {/* Category Info */}
                              <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                                {category.name}
                              </h4>

                              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                {category.description}
                              </p>

                              {/* Stats */}
                              <div className="flex items-center justify-center gap-4 mb-4">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-semibold">
                                  {category.count}
                                </Badge>
                                {category.growth && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 font-semibold">
                                    {category.growth}
                                  </Badge>
                                )}
                                {category.popular && (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-semibold">
                                    🔥 Popular
                                  </Badge>
                                )}
                              </div>

                              {/* Subcategories Preview */}
                              {category.subcategories && (
                                <div className="text-xs text-gray-500 mb-4">
                                  {category.subcategories.slice(0, 2).join(" • ")}
                                  {category.subcategories.length > 2 && " • +more"}
                                </div>
                              )}

                              {/* Action Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 group-hover:shadow-md"
                              >
                                Explore
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                              </Button>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Slide Indicators - Desktop Only */}
          <div className="hidden md:flex justify-center mt-8 gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  index === currentSlide
                    ? "bg-blue-600 w-8"
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col md:flex-row items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-sm text-gray-600 mb-2 md:mb-0">
              Can&apos;t find what you&apos;re looking for?
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/search?type=business')}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Search All Businesses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/search?type=event')}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Browse All Events
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/businesses/suggest')}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                Suggest a Business
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/events/create')}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                Create an Event
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
