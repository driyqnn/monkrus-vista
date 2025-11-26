import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronRight, Download, Copy, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMirrorTest, type MirrorTestResult } from '../hooks/useMirrorTest';
import { FavoriteButton } from './FavoriteButton';
import type { Post } from '../types';
import { isRecommendedMirror, getDomainFromUrl } from '../utils/highlightRecommended';

interface EnhancedPostCardProps {
  post: Post;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onView: () => void;
  searchQuery?: string;
}

const PREFERRED_MIRRORS = ['pb.wtf', 'uztracker.net'];

export const EnhancedPostCard = React.memo(function EnhancedPostCard({
  post,
  isFavorite,
  onToggleFavorite,
  onView,
  searchQuery = '',
}: EnhancedPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const { testing, results, testMultipleMirrors, getResult } = useMirrorTest();

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded) {
      onView();
    }
  };

  const handleBestMirror = () => {
    const bestMirror = getBestMirror();
    if (bestMirror) {
      window.open(bestMirror, '_blank', 'noopener,noreferrer');
      toast({
        title: 'Opening best mirror',
        description: getDomainFromUrl(bestMirror),
        duration: 2000,
      });
    }
  };

  const getBestMirror = (): string | null => {
    if (post.links.length === 0) return null;

    // Check test results first
    const testedMirrors = post.links
      .map(link => ({ link, result: getResult(link) }))
      .filter((item): item is { link: string; result: MirrorTestResult } => 
        item.result !== undefined && item.result.online
      );

    if (testedMirrors.length > 0) {
      // Prefer recommended mirrors if they're online
      const recommendedTested = testedMirrors.filter(item =>
        PREFERRED_MIRRORS.some(pref => item.link.includes(pref))
      );

      if (recommendedTested.length > 0) {
        return recommendedTested.reduce((fastest, current) =>
          (current.result.time || 0) < (fastest.result.time || 0) ? current : fastest
        ).link;
      }

      // Return fastest among tested
      return testedMirrors.reduce((fastest, current) =>
        (current.result.time || 0) < (fastest.result.time || 0) ? current : fastest
      ).link;
    }

    // No test results, prefer recommended mirrors
    const recommended = post.links.filter(link =>
      PREFERRED_MIRRORS.some(pref => link.includes(pref))
    );

    return recommended.length > 0 ? recommended[0] : post.links[0];
  };

  const handleTestAll = async () => {
    await testMultipleMirrors(post.links);
    toast({
      title: 'Speed test complete',
      description: 'All mirrors have been tested',
      duration: 2000,
    });
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Copied to clipboard',
        description: getDomainFromUrl(url),
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-primary/30 text-primary-foreground rounded px-1">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const getCategory = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('adobe')) return 'Adobe';
    if (lower.includes('autodesk')) return 'Autodesk';
    if (lower.includes('microsoft')) return 'Microsoft';
    return 'Other';
  };

  return (
    <article className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex gap-4 items-start flex-1 min-w-0">
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
            className="mt-1 flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-card-foreground leading-snug mb-2 break-words">
              {highlightText(post.title)}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                {getCategory(post.title)}
              </span>
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Original Post
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {post.links.length > 0 && (
            <>
              <Button
                onClick={handleBestMirror}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4 mr-2" />
                Best Mirror
              </Button>
              
              <Button
                onClick={handleToggle}
                variant="secondary"
                className="hover:bg-accent"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                {post.links.length} {post.links.length === 1 ? 'mirror' : 'mirrors'}
              </Button>
            </>
          )}
        </div>
      </div>

      {isExpanded && post.links.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Download Mirrors ({post.links.length})
            </h4>
            <Button
              onClick={handleTestAll}
              disabled={testing}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Test All
                </>
              )}
            </Button>
          </div>

          <ul className="space-y-2">
            {post.links.map((mirror, index) => {
              const domain = getDomainFromUrl(mirror);
              const isRecommended = isRecommendedMirror(mirror);
              const testResult = getResult(mirror);

              return (
                <li
                  key={index}
                  className={`flex items-center justify-between gap-4 p-3 rounded-lg border transition-all hover:shadow-md ${
                    isRecommended
                      ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                      : 'bg-card border-border hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {testResult && (
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          testResult.status === 'fast'
                            ? 'bg-green-500'
                            : testResult.status === 'normal'
                            ? 'bg-yellow-500'
                            : testResult.status === 'slow'
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        }`}
                        title={testResult.status}
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block truncate">
                        {highlightText(domain)}
                      </span>
                      {testResult && testResult.time && (
                        <span className="text-xs text-muted-foreground">
                          {testResult.time}ms
                        </span>
                      )}
                    </div>

                    {isRecommended && (
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-md font-medium flex-shrink-0">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopy(mirror)}
                      className="hover:bg-accent"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      asChild
                      className="hover:bg-accent"
                    >
                      <a
                        href={mirror}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
});
