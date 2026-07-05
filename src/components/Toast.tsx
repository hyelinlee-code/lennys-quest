import { useEffect } from 'react';
import { useGame } from '../game/GameProvider';

export function Toast() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: 'TOAST', message: null }), 2200);
    return () => clearTimeout(t);
  }, [state.toast, dispatch]);

  return <div className={`toast${state.toast ? ' show' : ''}`}>{state.toast}</div>;
}
