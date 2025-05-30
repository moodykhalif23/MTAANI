"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, MapPin, X, Clock, TrendingUp, Hash, MapIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface SearchSuggestion {
  id: string
  text: string
  type: 'business' | 'event' | 'category' | 'location' | 'keyword' | 'recent'
  count?: number
  popularity?: number
  category?: string
  location?: string
  icon?: React.ReactNode
}

interface AdvancedSearchInputProps {
  placeholder?: string
  value?: string
  onSearch: (query: string, filters?: SearchFilters) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  className?: string
  showLocationInput?: boolean
  showFilters?: boolean
  suggestions?: SearchSuggestion[]
  isLoading?: boolean
  recentSearches?: string[]
  popularSearches?: string[]
}

interface SearchFilters {
  location?: string
  category?: string
  type?: 'business' | 'event' | 'all'
}

export function AdvancedSearchInput({
  placeholder = "Search businesses, events, or services...",
  value = "",
  onSearch,
  onSuggestionSelect,
  className,
  showLocationInput = true,
  suggestions = [],
  isLoading = false,
  recentSearches = [],
  popularSearches = []
}: AdvancedSearchInputProps) {
  const [query, setQuery] = useState(value)
  const [locationQuery, setLocationQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Generate combined suggestions
  const combinedSuggestions = useCallback(() => {
    const allSuggestions: SearchSuggestion[] = []

    // Add recent searches if query is empty or short
    if (query.length < 2 && recentSearches.length > 0) {
      allSuggestions.push(
        ...recentSearches.slice(0, 3).map((search, index) => ({
          id: `recent-${index}`,
          text: search,
          type: 'recent' as const,
          icon: <Clock className="h-4 w-4 text-gray-400" />
        }))
      )
    }

    // Add popular searches if query is empty
    if (query.length === 0 && popularSearches.length > 0) {
      allSuggestions.push(
        ...popularSearches.slice(0, 5).map((search, index) => ({
          id: `popular-${index}`,
          text: search,
          type: 'keyword' as const,
          icon: <TrendingUp className="h-4 w-4 text-blue-500" />
        }))
      )
    }

    // Add API suggestions
    if (suggestions.length > 0) {
      allSuggestions.push(...suggestions.map(s => ({
        ...s,
        icon: getSuggestionIcon(s.type)
      })))
    }

    // Add category suggestions based on query
    if (query.length > 1) {
      const categorySuggestions = getCategorySuggestions(query)
      allSuggestions.push(...categorySuggestions)
    }

    return allSuggestions.slice(0, 8) // Limit to 8 suggestions
  }, [query, suggestions, recentSearches, popularSearches])

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'business':
        return <Hash className="h-4 w-4 text-green-500" />
      case 'event':
        return <Hash className="h-4 w-4 text-purple-500" />
      case 'category':
        return <Hash className="h-4 w-4 text-orange-500" />
      case 'location':
        return <MapIcon className="h-4 w-4 text-blue-500" />
      case 'recent':
        return <Clock className="h-4 w-4 text-gray-400" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  // Get category suggestions based on query
  const getCategorySuggestions = (query: string): SearchSuggestion[] => {
    const categories = [
      { name: 'Restaurants', keywords: ['food', 'eat', 'restaurant', 'cafe', 'dining'] },
      { name: 'Hotels', keywords: ['hotel', 'lodge', 'accommodation', 'stay'] },
      { name: 'Shops', keywords: ['shop', 'store', 'buy', 'retail', 'market'] },
      { name: 'Services', keywords: ['service', 'repair', 'fix', 'professional'] },
      { name: 'Health', keywords: ['health', 'medical', 'doctor', 'clinic', 'pharmacy'] },
      { name: 'Beauty', keywords: ['beauty', 'salon', 'spa', 'barber', 'cosmetics'] },
      { name: 'Entertainment', keywords: ['entertainment', 'fun', 'leisure', 'activity'] },
      { name: 'Education', keywords: ['education', 'school', 'training', 'course'] }
    ]

    const queryLower = query.toLowerCase()
    return categories
      .filter(cat =>
        cat.name.toLowerCase().includes(queryLower) ||
        cat.keywords.some(keyword => keyword.includes(queryLower) || queryLower.includes(keyword))
      )
      .map(cat => ({
        id: `category-${cat.name}`,
        text: cat.name,
        type: 'category' as const,
        icon: <Hash className="h-4 w-4 text-orange-500" />
      }))
      .slice(0, 3)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setShowSuggestions(true)
    setActiveSuggestionIndex(-1)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)

    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion)
    }

    // Trigger search
    handleSearch(suggestion.text)
  }

  // Handle search execution
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (finalQuery.trim()) {
      const searchFilters: SearchFilters = {
        ...filters,
        location: locationQuery || undefined
      }
      onSearch(finalQuery.trim(), searchFilters)
      setShowSuggestions(false)

      // Save to recent searches (would be implemented with localStorage or API)
      saveRecentSearch(finalQuery.trim())
    }
  }

  // Save recent search
  const saveRecentSearch = (searchQuery: string) => {
    try {
      const recent = JSON.parse(localStorage.getItem('mtaani_recent_searches') || '[]')
      const updated = [searchQuery, ...recent.filter((s: string) => s !== searchQuery)].slice(0, 10)
      localStorage.setItem('mtaani_recent_searches', JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving recent search:', error)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentSuggestions = combinedSuggestions()

    if (!showSuggestions || currentSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestionIndex(prev =>
          prev < currentSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : currentSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (activeSuggestionIndex >= 0) {
          handleSuggestionSelect(currentSuggestions[activeSuggestionIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
        break
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentSuggestions = combinedSuggestions()

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex flex-col md:flex-row gap-3 p-3 bg-white rounded-2xl shadow-2xl border border-gray-100 backdrop-blur">
        {/* Main Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            ref={searchInputRef}
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className="pl-12 border-0 focus-visible:ring-0 text-lg h-14 bg-transparent"
            autoComplete="off"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => {
                setQuery("")
                setShowSuggestions(false)
                searchInputRef.current?.focus()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Location Input */}
        {showLocationInput && (
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              ref={locationInputRef}
              placeholder="Enter your location..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="pl-12 border-0 focus-visible:ring-0 text-lg h-14 bg-transparent"
            />
          </div>
        )}

        {/* Search Button */}
        <Button
          size="lg"
          onClick={() => handleSearch()}
          disabled={isLoading}
          className="h-14 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <Search className="h-5 w-5 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && currentSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto"
        >
          <div className="p-2">
            {currentSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors",
                  "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                  index === activeSuggestionIndex && "bg-blue-50 border border-blue-200"
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
              >
                {suggestion.icon}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.text}
                  </div>
                  {suggestion.type !== 'recent' && (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      {suggestion.count && (
                        <span>{suggestion.count} results</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
