import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useData } from '../hooks/useData'
import Card, { StatCard, SentimentBadge } from '../components/Card'

const PIE_COLORS = ['#40c057', '#868e96', '#fa5252']

export default function Overview() {
  const { data: sentiment } = useData('sentiment.json')
  const { data: personas } = useData('personas.json')
  const { data: themes } = useData('themes.json')

  if (!sentiment || !personas || !themes) {
    return <div className="text-text-secondary">Loading...</div>
  }

  const pieData = [
    { name: 'Positive', value: sentiment.overall.breakdown.positive },
    { name: 'Neutral', value: sentiment.overall.breakdown.neutral },
    { name: 'Negative', value: sentiment.overall.breakdown.negative },
  ]

  const barData = sentiment.overTime.map(d => ({
    month: d.month.slice(5),
    Positive: d.positive,
    Neutral: d.neutral,
    Negative: d.negative,
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Customer Insights Overview</h1>
        <p className="text-text-secondary mt-1">AI-generated insights from {sentiment.overall.totalMentions.toLocaleString()} customer touchpoints across {sentiment.bySource.length} channels</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Overall Sentiment" value={`${Math.round(sentiment.overall.score * 100)}%`} subtitle="Positive" trend="+2% vs. last month" trendDirection="up" />
        <StatCard label="Personas Identified" value={personas.length} subtitle="AI-generated clusters" />
        <StatCard label="Active Themes" value={themes.length} subtitle="Across all sources" />
        <StatCard label="Total Mentions" value={sentiment.overall.totalMentions.toLocaleString()} subtitle="Last 9 months" />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Sentiment breakdown */}
        <Card>
          <h3 className="text-sm font-semibold mb-4">Sentiment Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${Math.round(v * 100)}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {d.name} ({Math.round(d.value * 100)}%)
              </div>
            ))}
          </div>
        </Card>

        {/* Sentiment over time */}
        <Card className="col-span-2">
          <h3 className="text-sm font-semibold mb-4">Sentiment Volume Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="Positive" fill="#40c057" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Neutral" fill="#868e96" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Negative" fill="#fa5252" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Personas preview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Customer Personas</h3>
          <Link to="/personas" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all →</Link>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {personas.map(p => (
            <Link key={p.id} to={`/personas/${p.id}`} className="block">
              <Card className="hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer text-center">
                <div className="text-3xl mb-2">{p.avatar}</div>
                <h4 className="text-sm font-semibold leading-tight">{p.name}</h4>
                <p className="text-xs text-text-secondary mt-1">{p.sampleSize.toLocaleString()} customers</p>
                <div className="mt-2">
                  <SentimentBadge sentiment={p.sentimentProfile.overall} score={p.sentimentProfile.score} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Top themes */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold mb-3">Top Positive Drivers</h3>
          <div className="space-y-3">
            {sentiment.topPositiveDrivers.map(d => (
              <div key={d.topic} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{d.topic}</p>
                  <p className="text-xs text-text-secondary">{d.mentions.toLocaleString()} mentions</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-positive rounded-full" style={{ width: `${d.score * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-positive">{Math.round(d.score * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold mb-3">Top Negative Drivers</h3>
          <div className="space-y-3">
            {sentiment.topNegativeDrivers.map(d => (
              <div key={d.topic} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{d.topic}</p>
                  <p className="text-xs text-text-secondary">{d.mentions.toLocaleString()} mentions</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-negative rounded-full" style={{ width: `${(1 - d.score) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-negative">{Math.round((1 - d.score) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
