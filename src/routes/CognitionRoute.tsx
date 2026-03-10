// CognitionRoute - Game selection hub for cognition mini-games
// Story 6.3: Implement Pattern Match Mini-Game
// Story 6.4: Implement Spatial Flip Mini-Game
// Story 6.5: Implement Memory Grid Mini-Game

import { useState } from 'react';
import { Brain, Grid3X3, FlipHorizontal2, LayoutGrid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import PatternMatchGame from '@/features/cognition/games/PatternMatchGame';
import SpatialFlipGame from '@/features/cognition/games/SpatialFlipGame';
import MemoryGridGame from '@/features/cognition/games/MemoryGridGame';

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  onPlay: () => void;
}

function GameCard({ title, description, icon: Icon, available, onPlay }: GameCardProps) {
  return (
    <Card className={`${available ? '' : 'opacity-50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-6 h-6 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        {available ? (
          <Button
            onClick={onPlay}
            variant="default"
            className="w-full min-h-[44px]"
          >
            Play
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground italic text-center">Coming soon</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function CognitionRoute() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Game selection screen
  if (!selectedGame) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">Brain Games</h1>
          </div>
          <p className="text-base text-muted-foreground">
            Quick exercises to strengthen cognitive skills
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <GameCard
            title="Pattern Match"
            description="Find matching symbol pairs"
            icon={Grid3X3}
            available={true}
            onPlay={() => setSelectedGame('pattern-match')}
          />
          <GameCard
            title="Spatial Flip"
            description="Rotate and match shapes"
            icon={FlipHorizontal2}
            available={true}
            onPlay={() => setSelectedGame('spatial-flip')}
          />
          <GameCard
            title="Memory Grid"
            description="Remember and recall patterns"
            icon={LayoutGrid}
            available={true}
            onPlay={() => setSelectedGame('memory-grid')}
          />
        </div>
      </div>
    );
  }

  // Game view
  if (selectedGame === 'pattern-match') {
    return <PatternMatchGame onBack={() => setSelectedGame(null)} />;
  }

  if (selectedGame === 'spatial-flip') {
    return <SpatialFlipGame onBack={() => setSelectedGame(null)} />;
  }

  if (selectedGame === 'memory-grid') {
    return <MemoryGridGame onBack={() => setSelectedGame(null)} />;
  }

  return null;
}
