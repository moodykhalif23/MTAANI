"use client"

import { useState } from "react"
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
  PawPrint
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  const [selectedType] = useState<'business' | 'event' | 'all'>('all')

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

  const categories = selectedType === 'all'
    ? allCategories
    : allCategories.filter(cat => cat.type === selectedType)

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category)
    } else {
      router.push(`/search?category=${category.id}&type=${category.type}`)
    }
  }

  return (
    <section className={cn("w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 md:py-16", className)}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-0">Browse by Category</h2>
            <p className="text-lg text-gray-600 max-w-2xl">Explore businesses and events by category. Find what matters most to you in your community.</p>
          </div>
          <div className="flex gap-3 mt-2 md:mt-0">
            <Button variant="outline" size="lg" className="border-blue-200 text-blue-700 hover:bg-blue-50">View all businesses</Button>
            <Button variant="outline" size="lg" className="border-purple-200 text-purple-700 hover:bg-purple-50">View events</Button>
          </div>
        </div>
        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.slice(0, 8).map((category) => {
            const IconComponent = category.icon
            return (
              <Card
                key={category.id}
                className={cn(
                  "group cursor-pointer border-0 shadow-md hover:shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden p-5 md:p-6 flex flex-col justify-between transition-all duration-300 h-full w-full"
                )}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110",
                    `bg-gradient-to-br ${category.gradient}`
                  )}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{category.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4 flex-1">{category.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-gray-500">{category.count} listed</span>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 px-2 py-1 h-8">Explore <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
