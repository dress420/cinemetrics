import {
  House, Library, Bookmark, Clock, Sparkles,
  ThumbsUp, Gem, Tv, ChartColumn, LayoutGrid, Layers,
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
      { to: '/nl-search',       label: 'AI Search',       icon: Sparkles },
      { to: '/recommendations', label: 'For You',         icon: ThumbsUp },
      { to: '/gems',            label: 'Hidden Gems',     icon: Gem },
      { to: '/streaming',       label: 'Streaming',       icon: Tv },
    ],
  },
  {
    section: 'Analytics',
    items: [
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
