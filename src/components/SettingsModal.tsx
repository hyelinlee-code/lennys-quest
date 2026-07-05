import { useState } from 'react';
import { useGame } from '../game/GameProvider';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useGame();
  const [name, setName] = useState(state.save.playerName);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,4,10,0.78)] p-6 backdrop-blur-[7px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="vn-box flex w-full max-w-sm flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel m-0 text-base uppercase tracking-[2px] text-[#f0e2c2]">Settings</h2>
          <button className="cursor-pointer border-none bg-transparent text-lg text-[#9c8a6a]" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[13px] text-[#9c8a6a]">Name</span>
          <div className="flex gap-2">
            <input
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[rgba(220,200,150,0.35)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-[15px] text-[#f0e2c2] outline-none focus:border-[#caa24f]"
            />
            <button
              className="btn-ghost"
              onClick={() => {
                if (name.trim()) dispatch({ type: 'SET_NAME', name: name.trim() });
              }}
            >
              Save
            </button>
          </div>
        </label>

        <div className="flex flex-col gap-2 border-t border-[rgba(220,200,150,0.15)] pt-4">
          <span className="text-[13px] text-[#9c8a6a]">Demo · testing</span>
          <button
            className="btn-ghost"
            onClick={() => {
              dispatch({ type: 'NEXT_DAY' });
              dispatch({ type: 'TOAST', message: '🌙 A new day dawns' });
              onClose();
            }}
          >
            Next day → (demo the review loop)
          </button>
        </div>

        <div className="flex flex-col gap-2 border-t border-[rgba(220,200,150,0.15)] pt-4">
          {!confirmReset ? (
            <button className="btn-ghost text-[#c96a4a]" onClick={() => setConfirmReset(true)}>
              Reset all progress…
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-[#e6a15e]">
                All cards and progress will be lost. Really reset?
              </span>
              <div className="flex gap-2">
                <button className="btn-ghost flex-1 text-[#c96a4a]" onClick={() => dispatch({ type: 'RESET' })}>
                  Yes, reset
                </button>
                <button className="btn-ghost flex-1" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center font-cinzel text-[10px] tracking-[1px] text-[#6f6450]">
          save v{state.save.version} · lennys-quest MVP
        </div>
      </div>
    </div>
  );
}
