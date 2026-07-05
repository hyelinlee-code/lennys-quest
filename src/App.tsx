import { GameProvider, useGame } from './game/GameProvider';
import { Toast } from './components/Toast';
import { TitleScreen } from './screens/TitleScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MapScreen } from './screens/MapScreen';
import { AudienceScreen } from './screens/AudienceScreen';
import { StudyScreen } from './screens/StudyScreen';
import { QuizScreen } from './screens/QuizScreen';
import { RevealScreen } from './screens/RevealScreen';
import { DexScreen } from './screens/DexScreen';

function Router() {
  const { state } = useGame();
  const s = state.screen;
  switch (s.name) {
    case 'title':
      return <TitleScreen />;
    case 'home':
      return <HomeScreen />;
    case 'map':
      return <MapScreen />;
    case 'audience':
      return <AudienceScreen speakerId={s.speakerId} />;
    case 'study':
      return <StudyScreen cardId={s.cardId} from={s.from} />;
    case 'quiz':
      return <QuizScreen cardId={s.cardId} mode={s.mode} from={s.from} />;
    case 'reveal':
      return <RevealScreen cardId={s.cardId} result={s.result} from={s.from} />;
    case 'dex':
      return <DexScreen focusCardId={s.focusCardId} />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <Router />
      <Toast />
    </GameProvider>
  );
}
