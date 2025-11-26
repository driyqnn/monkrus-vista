import { Star } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
}

export function FavoriteButton({ isFavorite, onToggle, className }: FavoriteButtonProps) {
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
    
    toast({
      title: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      duration: 2000,
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={className}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        className={`w-5 h-5 transition-all ${
          isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'
        }`}
      />
    </Button>
  );
}
