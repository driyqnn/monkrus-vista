import { X, Star, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import type { Post } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Post[];
  recentlyViewed: Post[];
  onItemClick: (post: Post) => void;
}

export function Sidebar({ isOpen, onClose, favorites, recentlyViewed, onItemClick }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-2xl font-bold">Quick Access</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:rotate-90 transition-transform"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              {/* Favorites */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Favorites ({favorites.length})
                  </h3>
                </div>
                
                {favorites.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No favorites yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {favorites.map((post) => (
                      <SidebarItem key={post.link} post={post} onClick={() => {
                        onItemClick(post);
                        onClose();
                      }} />
                    ))}
                  </div>
                )}
              </section>

              {/* Recently Viewed */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Recently Viewed ({recentlyViewed.length})
                  </h3>
                </div>
                
                {recentlyViewed.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent items
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentlyViewed.map((post) => (
                      <SidebarItem key={post.link} post={post} onClick={() => {
                        onItemClick(post);
                        onClose();
                      }} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-accent hover:border-primary/20 transition-all group"
    >
      <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {post.title}
      </h4>
      <p className="text-xs text-muted-foreground mt-1">
        {post.links.length} mirror{post.links.length !== 1 ? 's' : ''}
      </p>
    </button>
  );
}
