export interface DialogueLine {
  speaker: string;
  /** English text; {name} is replaced with the player name */
  text: string;
  portrait?: 'lenny' | 'none';
}

/** Intro sequence (first run only, skippable). The name-input beat is handled by TitleScreen itself. */
export const INTRO_LINES: DialogueLine[] = [
  {
    speaker: '???',
    text: 'Welcome, welcome! Long journey, I imagine. Come in, warm yourself by the lantern.',
    portrait: 'lenny',
  },
  {
    speaker: 'Lenny',
    text: "I'm Lenny — keeper of this inn, Lenny's Study. And this land? This is The Valley, where the greatest builders in the world live on as sages.",
    portrait: 'lenny',
  },
  {
    speaker: 'Lenny',
    text: "The Founders' Keep, the Verdant Exchange, the Artisans' Guild… each sage guards their hard-won wisdom. They don't share it with just anyone.",
    portrait: 'lenny',
  },
  {
    speaker: 'Lenny',
    text: 'See this old grimoire? Inscribe a teaching from a sage, and it becomes a card — filling one of these empty pages. Trust me, this is a good one.',
    portrait: 'lenny',
  },
];

export const INTRO_AFTER_NAME: DialogueLine[] = [
  {
    speaker: 'Lenny',
    text: '{name}… a fine name. Apprentice {name}, welcome to The Valley!',
    portrait: 'lenny',
  },
  {
    speaker: 'Lenny',
    text: 'As it happens, your first sage is waiting. He drew the maps, raised the castles, and set out again — the Architect Sage, Bret Taylor.',
    portrait: 'lenny',
  },
  {
    speaker: 'Lenny',
    text: 'Listen to the teaching, inscribe it in your mind, and turn it into a card. Your adventure starts now!',
    portrait: 'lenny',
  },
];

/** Home hub greetings, keyed by state. Chosen by HomeScreen. */
export const HOME_GREETINGS = {
  reviewsDue: [
    'Hold on — the ink is fading on {n} of the cards you inscribed. Shall we retrace them before any new teachings? A teaching inscribed twice never fades again.',
    'Welcome back! {n} cards in your grimoire have gone faint. Review first — then new adventures.',
  ],
  newAvailable: [
    'Welcome back, {name}! Which teaching shall we inscribe today? The sages are waiting.',
    "Good morning! I've heard a rumor — there's a sage you should meet today.",
  ],
  allClear: [
    "All done for today. Impressive! Browse your grimoire, or come back tomorrow — I'll keep the lantern lit.",
    "Perfect work. Is it just me, or does the lantern burn a little brighter tonight?",
  ],
} as const;

export const CARD_EARNED_LINES = [
  "Nice one! '{phrase}' — a teaching from {speaker}, now a card in your grimoire.",
  "'{phrase}' — your grimoire shines a little brighter. ✦",
];

export const CARD_MASTERED_LINES = [
  "'{phrase}' — inscribed twice, kept forever. ★★",
  'Mastered! The ink on this card will never fade again.',
];

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
