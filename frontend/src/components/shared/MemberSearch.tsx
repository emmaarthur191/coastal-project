import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import GlassCard from '../ui/modern/GlassCard';
import './MemberSearch.css';

interface MemberSearchProps {
  onSelect: (member: { id: string | number; full_name: string; email: string; account_number?: string }) => void;
  placeholder?: string;
  label?: string;
}

interface SearchResult {
  id: string | number;
  user: string | number;
  account_number: string;
  customer_name: string;
  account_type_display: string;
}

const MemberSearch: React.FC<MemberSearchProps> = ({ onSelect, placeholder = "Search by name, email or account...", label = "Select Member" }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SearchResult | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const response = await api.get<SearchResult[] | { results: SearchResult[] }>('banking/staff-accounts/', {
        params: { search: query }
      });
      
      const data = response.data;
      const finalResults = Array.isArray(data) ? data : (data as { results?: SearchResult[] }).results || [];
      setResults(finalResults);
      setShowResults(finalResults.length > 0);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 3) {
        performSearch();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    setSelectedMember(result);
    setQuery(result.customer_name);
    setShowResults(false);
    onSelect({
      id: result.user, // The backend needs the User ID
      full_name: result.customer_name,
      email: '', // Email not directly in AccountSerializer top level, but not strictly needed for selection
      account_number: result.account_number
    });
  };

  const handleClear = () => {
    setSelectedMember(null);
    setQuery('');
    setResults([]);
    onSelect({ id: '', full_name: '', email: '' });
  };

  return (
    <div className="member-search-container" ref={searchRef}>
      {label && <label className="member-search-label">{label}</label>}
      <div className="member-search-input-wrapper">
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedMember && e.target.value !== selectedMember.customer_name) {
              setSelectedMember(null);
            }
          }}
          placeholder={placeholder}
          className={`member-search-input ${selectedMember ? 'selected' : ''}`}
          disabled={!!selectedMember}
        />
        {!selectedMember && !isSearching && (
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        {selectedMember ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="member-search-clear"
          >
            <X className="w-4 h-4" />
          </Button>
        ) : isSearching ? (
          <div className="member-search-spinner" />
        ) : null}
      </div>

      {showResults && !selectedMember && (
        <GlassCard className="member-search-results-dropdown">
          <ul className="member-search-results-list">
            {results.map((res) => (
              <li 
                key={res.id} 
                onClick={() => handleSelect(res)}
                className="member-search-result-item"
              >
                <div className="result-info">
                  <span className="result-name">{res.customer_name}</span>
                  <span className="result-account">{res.account_number} ({res.account_type_display})</span>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
};

export default MemberSearch;
