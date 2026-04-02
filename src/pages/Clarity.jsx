import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useData } from '../hooks/useData'
import Card, { StatCard, DataSourceTag } from '../components/Card'
import { AlertTriangle, MousePointerClick, Smartphone, Monitor, Tablet } from 'lucide-react'

const CHANNEL_COLORS = ['#4c6ef5', '#748ffc', '#91a7ff', '#fab005', '#40c057', '#868e96']
const DEVICE_ICONS = { Mobile: Smartphone, PC: Monitor, Tablet: Tablet }

export default function Clarity() {
  const { data: clarity } = useData('clarity.json')

  if (!clarity) return <div className="text-text-secondary">Loading...</div>

  const totalSessions = clarity.traffic.totalSessions
  const channelData = clarity.traffic.byChannel.map(c => ({
    name: c.channel,
    sessions: c.sessions,
    pagesPerSession: c.pagesPerSession,
  }))

  const deviceData = clarity.traffic.byDevice.map(d => ({
    name: d.device,
    value: d.sessions,
  }))
  const deviceColors = ['#4c6ef5', '#40c057', '#fab005']

  // Sort friction points by total issues
  const frictionData = clarity.frictionPoints
    .map(f => ({
      ...f,
      totalIssues: f.deadClicks + f.rageClicks + f.quickbackClicks + f.clickErrors,
      page: f.url.replace('https://www.dermalogica.com', ''),
    }))
    .sort((a, b) => b.totalIssues - a.totalIssues)

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
            <MousePointerClick size={22} className="text-cyan-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Behavioral Analytics</h1>
              <DataSourceTag type="real" source="Microsoft Clarity" />
            </div>
            <p className="text-text-secondary">{clarity.dateRange} — Website behavioral data from {totalSessions.toLocaleString()} sessions</p>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Sessions" value={totalSessions.toLocaleString()} subtitle="Last 30 days" />
        <StatCard
          label="Mobile Traffic"
          value={`${Math.round((clarity.traffic.byDevice[0].sessions / totalSessions) * 100)}%`}
          subtitle={`${clarity.traffic.byDevice[0].sessions.toLocaleString()} sessions`}
        />
        <StatCard
          label="Avg Engagement (Desktop)"
          value={`${clarity.traffic.byDevice[1].avgEngagementSec}s`}
          subtitle={`vs ${clarity.traffic.byDevice[0].avgEngagementSec}s mobile`}
        />
        <StatCard
          label="Top Friction Page"
          value="/rewards/"
          subtitle="3,588 dead clicks + 49 rage clicks"
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Traffic by channel */}
        <Card>
          <h3 className="text-sm font-semibold mb-4">Traffic by Channel</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={channelData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="sessions" fill="#4c6ef5" radius={[0, 4, 4, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Device breakdown */}
        <Card>
          <h3 className="text-sm font-semibold mb-4">Device Breakdown</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {deviceData.map((_, i) => <Cell key={i} fill={deviceColors[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {clarity.traffic.byDevice.map((d, i) => {
                const Icon = DEVICE_ICONS[d.device] || Monitor
                return (
                  <div key={d.device} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${deviceColors[i]}15` }}>
                      <Icon size={16} style={{ color: deviceColors[i] }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.device}</p>
                      <p className="text-xs text-text-secondary">
                        {d.sessions.toLocaleString()} sessions · {d.avgEngagementSec}s avg · {d.avgScrollDepth}% scroll
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Pages per session by channel */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold mb-4">Engagement Depth by Channel</h3>
        <div className="grid grid-cols-6 gap-3">
          {clarity.traffic.byChannel.map((c, i) => (
            <div key={c.channel} className="text-center bg-surface rounded-lg p-3 border border-border">
              <p className="text-xs text-text-secondary mb-1">{c.channel}</p>
              <p className="text-xl font-bold" style={{ color: CHANNEL_COLORS[i] }}>{c.pagesPerSession}</p>
              <p className="text-xs text-text-secondary">pages/session</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top pages */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold mb-4">Top Pages by Traffic</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium text-text-secondary">Page</th>
              <th className="text-left py-2 font-medium text-text-secondary">Source</th>
              <th className="text-right py-2 font-medium text-text-secondary">Page Views</th>
              <th className="text-right py-2 font-medium text-text-secondary">Avg Engagement</th>
              <th className="text-right py-2 font-medium text-text-secondary">Scroll Depth</th>
            </tr>
          </thead>
          <tbody>
            {clarity.topPages.map((p, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="py-2.5 font-medium">{p.url}</td>
                <td className="py-2.5 text-text-secondary">{p.source}</td>
                <td className="py-2.5 text-right">{p.pageViews.toLocaleString()}</td>
                <td className="py-2.5 text-right">{p.avgEngagementSec}s</td>
                <td className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${p.avgScrollDepth}%` }} />
                    </div>
                    <span>{p.avgScrollDepth}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Friction points */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-500" />
          <h3 className="text-sm font-semibold">Friction Points (UX Issues)</h3>
        </div>
        <div className="space-y-3">
          {frictionData.slice(0, 8).map((f, i) => (
            <div key={i} className="bg-surface rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{f.page || '/'}</p>
                <span className="text-xs font-medium text-amber-600">{f.totalIssues.toLocaleString()} total issues</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-text-secondary">Dead Clicks</p>
                  <p className="font-medium text-red-600">{f.deadClicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Rage Clicks</p>
                  <p className="font-medium text-red-600">{f.rageClicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Quick-back Clicks</p>
                  <p className="font-medium text-amber-600">{f.quickbackClicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Click Errors</p>
                  <p className="font-medium text-amber-600">{f.clickErrors.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Insights */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Key Insights</h3>
          <DataSourceTag type="ai" />
        </div>
        <div className="space-y-2">
          {clarity.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-3 bg-cyan-50 rounded-lg p-3">
              <span className="text-cyan-600 font-bold text-sm mt-0.5">💡</span>
              <p className="text-sm text-cyan-800">{insight}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
