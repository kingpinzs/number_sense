// CognitionRoute - Game selection hub for cognition mini-games
// Story 6.3-6.5: Pattern Match, Spatial Flip, Memory Grid
// Extended: Speed Math, Number Rush, Sequence Snap, Clock Challenge, Estimate It

import { useState } from 'react';
import { Brain, Grid3X3, FlipHorizontal2, LayoutGrid, Zap, ArrowUpDown, ListOrdered, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import PatternMatchGame from '@/features/cognition/games/PatternMatchGame';
import SpatialFlipGame from '@/features/cognition/games/SpatialFlipGame';
import MemoryGridGame from '@/features/cognition/games/MemoryGridGame';
import SpeedMathGame from '@/features/cognition/games/SpeedMathGame';
import NumberRushGame from '@/features/cognition/games/NumberRushGame';
import SequenceSnapGame from '@/features/cognition/games/SequenceSnapGame';
import ClockChallengeGame from '@/features/cognition/games/ClockChallengeGame';
import EstimateItGame from '@/features/cognition/games/EstimateItGame';

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

  const handleBack = () => setSelectedGame(null);

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
            title="Speed Math"
            description="Answer math facts in 60 seconds"
            icon={Zap}
            available={true}
            onPlay={() => setSelectedGame('speed-math')}
          />
          <GameCard
            title="Number Rush"
            description="Tap the bigger number fast"
            icon={ArrowUpDown}
            available={true}
            onPlay={() => setSelectedGame('number-rush')}
          />
          <GameCard
            title="Sequence Snap"
            description="Complete number patterns"
            icon={ListOrdered}
            available={true}
            onPlay={() => setSelectedGame('sequence-snap')}
          />
          <GameCard
            title="Estimate It"
            description="Estimate math results quickly"
            icon={Target}
            available={true}
            onPlay={() => setSelectedGame('estimate-it')}
          />
          <GameCard
            title="Clock Challenge"
            description="Read analog clock times"
            icon={Clock}
            available={true}
            onPlay={() => setSelectedGame('clock-challenge')}
          />
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

  // Game views
  switch (selectedGame) {
    case 'speed-math':
      return <SpeedMathGame onBack={handleBack} />;
    case 'number-rush':
      return <NumberRushGame onBack={handleBack} />;
    case 'sequence-snap':
      return <SequenceSnapGame onBack={handleBack} />;
    case 'estimate-it':
      return <EstimateItGame onBack={handleBack} />;
    case 'clock-challenge':
      return <ClockChallengeGame onBack={handleBack} />;
    case 'pattern-match':
      return <PatternMatchGame onBack={handleBack} />;
    case 'spatial-flip':
      return <SpatialFlipGame onBack={handleBack} />;
    case 'memory-grid':
      return <MemoryGridGame onBack={handleBack} />;
    default:
      return null;
  }
}
