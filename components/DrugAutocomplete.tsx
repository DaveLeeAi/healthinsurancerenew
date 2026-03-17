'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface DrugAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  id?: string
}

export default function DrugAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = 'Enter your medication (e.g., Metformin, Ozempic, Adderall)',
  id = 'drug-search',
}: DrugAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setSuggestions([])
      setIsOpen(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/formulary/suggest?q=${encodeURIComponent(query.trim())}`)
        if (!res.ok) {
          setSuggestions([])
          return
        }
        const data: string[] = await res.json()
        setSuggestions(data)
        setIsOpen(data.length > 0)
        setActiveIndex(-1)
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 250)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function selectSuggestion(name: string) {
    onChange(name)
    setSuggestions([])
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onChange(val)
    fetchSuggestions(val)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSubmit()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          selectSuggestion(suggestions[activeIndex])
        } else {
          setIsOpen(false)
          onSubmit()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setActiveIndex(-1)
        break
      case 'Tab':
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // Close dropdown when clicking outside the wrapper
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /** Highlight the typed portion inline within the suggestion text. */
  function highlightMatch(name: string): React.ReactNode {
    const query = value.trim()
    if (query.length === 0) return name

    const idx = name.toLowerCase().indexOf(query.toLowerCase())
    if (idx < 0) return name

    return (
      <>
        {name.slice(0, idx)}
        <span className="font-semibold text-primary-700">
          {name.slice(idx, idx + query.length)}
        </span>
        {name.slice(idx + query.length)}
      </>
    )
  }

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true)
        }}
        placeholder={placeholder}
        className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={isOpen ? 'drug-suggestions' : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `drug-suggestion-${activeIndex}` : undefined
        }
        autoComplete="off"
      />

      {isLoading && value.trim().length >= 2 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-4 h-4 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id="drug-suggestions"
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-72 overflow-y-auto py-1"
        >
          {suggestions.map((name, i) => (
            <li
              key={name}
              id={`drug-suggestion-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`px-4 py-2.5 cursor-pointer transition-colors text-sm leading-snug ${
                i === activeIndex
                  ? 'bg-primary-50 text-primary-900'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                selectSuggestion(name)
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="inline">{highlightMatch(name)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
