"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { SearchResult, SearchSuggestion } from "@/lib/services/search-index-service"

interface SearchFilters {
  location?: string
  category?: string
  type?: 'business' | 'event' | 'all'
  verified?: boolean
  coordinates?: [number, number]
  radius?: number
}

interface UseAdvancedSearchOptions {
  debounceMs?: number
  enableSuggestions?: boolean
  enableCache?: boolean
  autoSearch?: boolean
}

interface SearchState {
  results: SearchResult[]
  suggestions: SearchSuggestion[]
  isLoading: boolean
  isLoadingSuggestions: boolean
  error: string | null
  total: number
  query: string
  filters: SearchFilters
  hasSearched: boolean
}

export function useAdvancedSearch(options: UseAdvancedSearchOptions = {}) {
  const {
    debounceMs = 300,
    enableSuggestions = true,
    enableCache = true,
    autoSearch = false
  } = options

  const [state, setState] = useState<SearchState>({
    results: [],
    suggestions: [],
    isLoading: false,
    isLoadingSuggestions: false,
    error: null,
    total: 0,
    query: '',
    filters: {},
    hasSearched: false
  })

  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<SearchSuggestion[]>([])
  
  const debounceRef = useRef<NodeJS.Timeout>()
  const cacheRef = useRef<Map<string, { results: SearchResult[]; timestamp: number }>>(new Map())
  const abortControllerRef = useRef<AbortController>()

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem('mtaani_recent_searches') || '[]')
      setRecentSearches(recent)
    } catch (error) {
      console.error('Error loading recent searches:', error)
    }
  }, [])

  // Load popular searches
  useEffect(() => {
    loadPopularSearches()
  }, [])

  // Auto-search when query changes (if enabled)
  useEffect(() => {
    if (autoSearch && state.query.trim() && state.query.length > 2) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      
      debounceRef.current = setTimeout(() => {
        performSearch(state.query, state.filters)
      }, debounceMs)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [state.query, state.filters, autoSearch, debounceMs])

  // Load popular searches
  const loadPopularSearches = async () => {
    try {
      const response = await fetch('/api/search/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '', limit: 8 })
      })
      
      if (response.ok) {
        const data = await response.json()
        setPopularSearches(data.data.suggestions || [])
      }
    } catch (error) {
      console.error('Error loading popular searches:', error)
    }
  }

  // Perform search
  const performSearch = useCallback(async (
    query: string,
    filters: SearchFilters = {},
    options: { skip?: number; limit?: number } = {}
  ) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], total: 0, hasSearched: false }))
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // Check cache first
    const cacheKey = `${query}-${JSON.stringify(filters)}-${options.skip || 0}`
    if (enableCache && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        setState(prev => ({
          ...prev,
          results: cached.results,
          isLoading: false,
          hasSearched: true
        }))
        return
      }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Build search URL
      const searchParams = new URLSearchParams({
        q: query,
        limit: (options.limit || 20).toString(),
        skip: (options.skip || 0).toString()
      })

      if (filters.type && filters.type !== 'all') {
        searchParams.append('type', filters.type)
      }
      if (filters.category) {
        searchParams.append('category', filters.category)
      }
      if (filters.location) {
        // Parse location if it's a string like "Nairobi County"
        const locationParts = filters.location.split(',').map(s => s.trim())
        if (locationParts.length > 0) {
          searchParams.append('county', locationParts[0])
        }
        if (locationParts.length > 1) {
          searchParams.append('town', locationParts[1])
        }
      }
      if (filters.coordinates) {
        searchParams.append('lat', filters.coordinates[0].toString())
        searchParams.append('lng', filters.coordinates[1].toString())
        if (filters.radius) {
          searchParams.append('radius', filters.radius.toString())
        }
      }
      if (filters.verified !== undefined) {
        searchParams.append('verified', filters.verified.toString())
      }

      const response = await fetch(`/api/search?${searchParams}`, {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        const results = data.data.results || []
        const suggestions = data.data.suggestions || []
        const total = data.data.meta?.total || 0

        // Cache results
        if (enableCache) {
          cacheRef.current.set(cacheKey, {
            results,
            timestamp: Date.now()
          })
        }

        // Save to recent searches
        saveRecentSearch(query)

        setState(prev => ({
          ...prev,
          results,
          suggestions,
          total,
          isLoading: false,
          hasSearched: true,
          query,
          filters
        }))
      } else {
        throw new Error(data.error?.message || 'Search failed')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled
      }
      
      console.error('Search error:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false,
        hasSearched: true
      }))
    }
  }, [enableCache])

  // Get search suggestions
  const getSuggestions = useCallback(async (
    query: string,
    filters: SearchFilters = {}
  ) => {
    if (!enableSuggestions || query.length < 1) {
      return []
    }

    setState(prev => ({ ...prev, isLoadingSuggestions: true }))

    try {
      const response = await fetch('/api/search/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          location: filters.location,
          category: filters.category,
          limit: 8
        })
      })

      if (response.ok) {
        const data = await response.json()
        const suggestions = data.data.suggestions || []
        
        setState(prev => ({
          ...prev,
          suggestions,
          isLoadingSuggestions: false
        }))
        
        return suggestions
      }
    } catch (error) {
      console.error('Error getting suggestions:', error)
    }

    setState(prev => ({ ...prev, isLoadingSuggestions: false }))
    return []
  }, [enableSuggestions])

  // Save recent search
  const saveRecentSearch = (query: string) => {
    try {
      const recent = [...recentSearches]
      const index = recent.indexOf(query)
      if (index > -1) {
        recent.splice(index, 1)
      }
      recent.unshift(query)
      const updated = recent.slice(0, 10) // Keep only 10 recent searches
      
      setRecentSearches(updated)
      localStorage.setItem('mtaani_recent_searches', JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving recent search:', error)
    }
  }

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('mtaani_recent_searches')
  }

  // Update query
  const setQuery = (query: string) => {
    setState(prev => ({ ...prev, query }))
  }

  // Update filters
  const setFilters = (filters: SearchFilters) => {
    setState(prev => ({ ...prev, filters }))
  }

  // Clear search
  const clearSearch = () => {
    setState(prev => ({
      ...prev,
      results: [],
      suggestions: [],
      total: 0,
      query: '',
      filters: {},
      hasSearched: false,
      error: null
    }))
  }

  // Load more results
  const loadMore = async () => {
    if (state.isLoading || state.results.length >= state.total) {
      return
    }

    await performSearch(state.query, state.filters, {
      skip: state.results.length,
      limit: 20
    })
  }

  return {
    // State
    results: state.results,
    suggestions: state.suggestions,
    isLoading: state.isLoading,
    isLoadingSuggestions: state.isLoadingSuggestions,
    error: state.error,
    total: state.total,
    query: state.query,
    filters: state.filters,
    hasSearched: state.hasSearched,
    recentSearches,
    popularSearches,

    // Actions
    search: performSearch,
    getSuggestions,
    setQuery,
    setFilters,
    clearSearch,
    clearRecentSearches,
    loadMore
  }
}
