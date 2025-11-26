import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { fetchMonkrus } from '../api/fetchMonkrus';
import { useFetchJSON } from '../hooks/useFetchJSON';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDebounce } from '../hooks/useDebounce';
import { SearchBar } from '../components/SearchBar';
import { ResultCounter } from '../components/ResultCounter';
import { EnhancedPostCard } from '../components/EnhancedPostCard';
import { SortAndFilter } from '../components/SortAndFilter';
import { Sidebar } from '../components/Sidebar';
import { KeyboardShortcuts } from '../components/KeyboardShortcuts';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import type { Post } from '../types';

const PAGE_SIZE = 50;
const MAX_RECENT_ITEMS = 10;

export default function EnhancedIndex() {
  // Data fetching
  const { data, loading, error, refetch } = useFetchJSON<Post[]>(fetchMonkrus, []);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useLocalStorage('monkrus_filter', 'all');
  const [sortBy, setSortBy] = useLocalStorage('monkrus_sort', 'name-asc');
  
  // Favorites and recent
  const [favorites, setFavorites] = useLocalStorage<string[]>('monkrus_favorites', []);
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<Post[]>('monkrus_recent', []);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(true);
  
  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    if (!data) return [];

    let filtered = data;

    // Apply category filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(activeFilter.toLowerCase())
      );
    }

    // Apply search
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.links.some(link => link.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'mirrors-desc':
        sorted.sort((a, b) => b.links.length - a.links.length);
        break;
    }

    return sorted;
  }, [data, activeFilter, debouncedSearch, sortBy]);

  // Paginated posts
  const displayedPosts = useMemo(() => {
    return filteredAndSortedPosts.slice(0, currentPage * PAGE_SIZE);
  }, [filteredAndSortedPosts, currentPage]);

  const hasMore = displayedPosts.length < filteredAndSortedPosts.length;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, debouncedSearch, sortBy]);

  // Favorites helpers
  const favoritePosts = useMemo(() => {
    if (!data) return [];
    return data.filter(post => favorites.includes(post.link));
  }, [data, favorites]);

  const toggleFavorite = useCallback((post: Post) => {
    setFavorites(prev =>
      prev.includes(post.link)
        ? prev.filter(link => link !== post.link)
        : [...prev, post.link]
    );
  }, [setFavorites]);

  const addToRecentlyViewed = useCallback((post: Post) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.link !== post.link);
      const updated = [post, ...filtered];
      return updated.slice(0, MAX_RECENT_ITEMS);
    });
  }, [setRecentlyViewed]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  // Scroll to post
  const scrollToPost = useCallback((post: Post) => {
    const element = document.querySelector(`[data-post-link="${post.link}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('animate-pulse');
      setTimeout(() => {
        element.classList.remove('animate-pulse');
      }, 1000);
    }
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!autoLoadEnabled || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = setTimeout(() => {
            loadMore();
          }, 200);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      clearTimeout(scrollTimeoutRef.current);
    };
  }, [autoLoadEnabled, hasMore, loading, loadMore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
      }
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
      if (e.key === '?' && !sidebarOpen) {
        // Keyboard shortcuts dialog is handled by KeyboardShortcuts component
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="container mx-auto px-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Monkrus Mirror Viewer</h1>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-accent"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="🔍 Search titles or mirrors... (Ctrl+K)"
              disabled={loading}
            />

            <SortAndFilter
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {!loading && data && (
              <ResultCounter
                count={displayedPosts.length}
                total={filteredAndSortedPosts.length}
              />
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <p className="text-destructive text-lg mb-4">Failed to load data: {error}</p>
              <Button onClick={refetch}>Retry</Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && displayedPosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No results found</p>
            </div>
          )}

          {/* Posts List */}
          {!loading && !error && displayedPosts.length > 0 && (
            <div className="space-y-4">
              {displayedPosts.map((post) => (
                <div key={post.link} data-post-link={post.link}>
                  <EnhancedPostCard
                    post={post}
                    isFavorite={favorites.includes(post.link)}
                    onToggleFavorite={() => toggleFavorite(post)}
                    onView={() => addToRecentlyViewed(post)}
                    searchQuery={debouncedSearch}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {!loading && !error && hasMore && (
            <div ref={loadMoreRef} className="text-center py-8">
              <Button
                onClick={loadMore}
                variant="outline"
                size="lg"
                className="hover:bg-accent"
              >
                Load More ({filteredAndSortedPosts.length - displayedPosts.length} remaining)
              </Button>
            </div>
          )}

          {/* End Message */}
          {!loading && !error && !hasMore && displayedPosts.length > 0 && (
            <p className="text-center text-muted-foreground py-8">
              All results loaded
            </p>
          )}
        </main>

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          favorites={favoritePosts}
          recentlyViewed={recentlyViewed}
          onItemClick={scrollToPost}
        />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts />
      </div>
    </Layout>
  );
}
