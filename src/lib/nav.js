import {
  House, Library, Bookmark, Clock, Clapperboard, Sparkles, WandSparkles, Smile,
  ThumbsUp, Gem, Rabbit, Users, Timer, Tv, Dna, ChartColumn, LayoutGrid, Layers,
  ArrowLeftRight,
} from 'lucide-react'

// Eine Quelle für Sidebar (Desktop) und Bottom-Nav/Mehr-Menü (Mobile)
export const NAV_GROUPS = [
  {
    section: 'Core',
    items: [
      { to: '/',          label: 'Dashboard',  icon: House },
      { to: '/library',   label: 'My Library', icon: Library, badge: true },
      { to: '/watchlist', label: 'Watchlist',  icon: Bookmark },
      { to: '/watching',  label: 'Watching',   icon: Clock },
    ],
  },
  {
    section: 'Discover',
    items: [
      { to: '/tonights-pick',   label: "Tonight's Pick",  icon: Clapperboard },
      { to: '/nl-search',       label: 'AI Search',       icon: Sparkles },
      { to: '/vibes',           label: 'Vibes',           icon: WandSparkles },
      { to: '/mood',            label: 'Mood Engine',     icon: Smile },
      { to: '/recommendations', label: 'For You',         icon: ThumbsUp },
      { to: '/gems',            label: 'Hidden Gems',     icon: Gem },
      { to: '/rabbit-hole',     label: 'Rabbit Hole',     icon: Rabbit },
      { to: '/two-player',      label: 'Two-Player',      icon: Users },
      { to: '/time-budget',     label: 'Time Budget',     icon: Timer },
      { to: '/streaming',       label: 'Streaming',       icon: Tv },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { to: '/dna',     label: 'DNA Profile',     icon: Dna },
      { to: '/stats',   label: 'Stats & Wrapped', icon: ChartColumn },
      { to: '/heatmap', label: 'Actor Heatmap',   icon: LayoutGrid },
    ],
  },
  {
    section: 'Tools',
    items: [
      { to: '/franchise', label: 'Franchise Tracker', icon: Layers },
      { to: '/import',    label: 'Import / Export',   icon: ArrowLeftRight },
    ],
  },
]
