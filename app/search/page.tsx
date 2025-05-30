"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search, MapPin, Star, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthHeader } from "@/components/auth-header"
import { Footer } from "@/components/footer"
import { AdvancedSearchInput } from "@/components/search/advanced-search-input"
import { useAdvancedSearch } from "@/hooks/use-advanced-search"
import { SearchResult } from "@/lib/services/search-index-service"
import Link from "next/link"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialLocation = searchParams.get('location') || ''
  const initialCategory = searchParams.get('category') || ''
  const initialType = searchParams.get('type') as 'business' | 'event' | 'all' || 'all'

  const {
    results,
    suggestions,
    isLoading,
    error,
    total,
    hasSearched,
    recentSearches,
    popularSearches,
    search,
    loadMore
  } = useAdvancedSearch({
    enableSuggestions: true,
    enableCache: true,
    autoSearch: false
  })

  const [currentQuery, setCurrentQuery] = useState(initialQuery)
  const [currentFilters, setCurrentFilters] = useState({
    location: initialLocation,
    category: initialCategory,
    type: initialType,
    verified: undefined as boolean | undefined
  })

  // Perform initial search if query exists
  useEffect(() => {
    if (initialQuery) {
      search(initialQuery, {
        location: initialLocation || undefined,
        category: initialCategory || undefined,
        type: initialType,
        verified: undefined
      })
    }
  }, [initialQuery, initialLocation, initialCategory, initialType, search])

  // Handle new search
  const handleSearch = (query: string, filters?: { location?: string; category?: string; type?: 'business' | 'event' | 'all' }) => {
    setCurrentQuery(query)
    const searchFilters = {
      ...currentFilters,
      ...filters
    }
    setCurrentFilters(searchFilters)
    search(query, searchFilters)
  }

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | boolean | undefined) => {
    const newFilters = { ...currentFilters, [key]: value }
    setCurrentFilters(newFilters)
    if (currentQuery) {
      search(currentQuery, newFilters)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AuthHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6 text-[#0A558C]">
            {hasSearched ? `Search Results${currentQuery ? ` for "${currentQuery}"` : ''}` : 'Search'}
          </h1>

          {/* Advanced Search Input */}
          <AdvancedSearchInput
            placeholder="Search businesses, events, or services..."
            value={currentQuery}
            onSearch={handleSearch}
            showLocationInput={true}
            suggestions={suggestions.map((s, index) => ({
              id: `suggestion-${index}`,
              text: s.text,
              type: s.type,
              count: s.count,
              popularity: s.popularity,
              category: s.category,
              location: s.location
            }))}
            isLoading={isLoading}
            recentSearches={recentSearches}
            popularSearches={popularSearches.map(s => s.text)}
            className="w-full mb-6"
          />

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select
              value={currentFilters.type}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="business">Businesses</SelectItem>
                <SelectItem value="event">Events</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={currentFilters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="restaurant">Restaurants</SelectItem>
                <SelectItem value="hotel">Hotels</SelectItem>
                <SelectItem value="shop">Shopping</SelectItem>
                <SelectItem value="service">Services</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={currentFilters.verified?.toString() || ''}
              onValueChange={(value) => handleFilterChange('verified', value === 'true' ? true : value === 'false' ? false : undefined)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Businesses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Businesses</SelectItem>
                <SelectItem value="true">Verified Only</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Results */}
          <div className="lg:col-span-3">
            {isLoading && !results.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-lg">Searching...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <Search className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-lg font-semibold">Search Error</p>
                  <p className="text-sm">{error}</p>
                </div>
                <Button onClick={() => search(currentQuery, currentFilters)}>
                  Try Again
                </Button>
              </div>
            ) : results.length === 0 && hasSearched ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={() => setCurrentQuery('')}>
                  Clear Search
                </Button>
              </div>
            ) : (
              <>
                {/* Results Header */}
                {hasSearched && (
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                      Showing {results.length} of {total} results
                      {currentQuery && ` for "${currentQuery}"`}
                    </p>
                  </div>
                )}

                {/* Results Grid */}
                <div className="space-y-6">
                  {results.map((result) => (
                    <SearchResultCard key={result.id} result={result} />
                  ))}
                </div>

                {/* Load More */}
                {results.length < total && (
                  <div className="text-center mt-8">
                    <Button
                      onClick={loadMore}
                      disabled={isLoading}
                      variant="outline"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More Results'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Popular Searches */}
              {popularSearches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Popular Searches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {popularSearches.slice(0, 5).map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(search.text)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          {search.text}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Searches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentSearches.slice(0, 5).map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(search)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

// Search Result Card Component
function SearchResultCard({ result }: { result: SearchResult }) {
  const isEvent = result.type === 'event'

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Image placeholder */}
          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              {isEvent ? (
                <Clock className="h-8 w-8 text-blue-600" />
              ) : (
                <MapPin className="h-8 w-8 text-blue-600" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {result.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Badge variant="secondary">{result.category}</Badge>
                  {result.verified && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ Verified
                    </Badge>
                  )}
                  {result.type === 'business' && result.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{result.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              {result.distance && (
                <div className="text-sm text-gray-500">
                  {result.distance.toFixed(1)} km away
                </div>
              )}
            </div>

            <p className="text-gray-700 mb-3 line-clamp-2">
              {result.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{result.location.town}, {result.location.county}</span>
              </div>

              <Link href={`/${result.type}s/${result.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>

            {/* Matched terms */}
            {result.matchedTerms.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Matched:</div>
                <div className="flex flex-wrap gap-1">
                  {result.matchedTerms.slice(0, 3).map((term, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
