import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Users, MessageSquareQuote, TrendingUp, Layers, Target, Mail, MousePointerClick, ClipboardList } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Overview', icon: BarChart3 },
  { to: '/personas', label: 'Personas', icon: Users },
  { to: '/themes', label: 'Themes', icon: Layers },
  { to: '/sentiment', label: 'Sentiment', icon: TrendingUp },
  { to: '/verbatims', label: 'Verbatims', icon: MessageSquareQuote },
  { to: '/fairing', label: 'Fairing Surveys', icon: ClipboardList },
  { to: '/team/paid-media', label: 'Paid Media', icon: Target },
  { to: '/team/crm', label: 'CRM', icon: Mail },
  { to: '/team/cro', label: 'CRO', icon: MousePointerClick },
]

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-100 text-brand-700'
            : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-alt border-r border-border flex flex-col fixed h-full">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary leading-tight">Customer Insights</h1>
              <p className="text-xs text-text-secondary">Persona Intelligence</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 pt-3 pb-2">Insights</p>
          {navItems.slice(0, 6).map(item => (
            <NavItem key={item.to} {...item} />
          ))}
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 pt-5 pb-2">Team Views</p>
          {navItems.slice(6).map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-brand-50 rounded-lg p-3">
            <p className="text-xs font-medium text-brand-700">Last data refresh</p>
            <p className="text-xs text-brand-600 mt-0.5">March 28, 2026</p>
            <p className="text-xs text-text-secondary mt-1">22,360 mentions analyzed</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 h-screen overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
