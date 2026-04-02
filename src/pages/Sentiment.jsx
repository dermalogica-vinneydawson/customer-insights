import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { useData } from '../hooks/useData'
import Card, { StatCard } from '../components/Card'

export default function Sentiment() {
  const { data: sentiment } = useData('sentiment.json')

  if (!sentiment) return <div className="text-text-secondary">Loading...</div>

  const areaData = sentiment.overTime.map(d => ({
    month: d.month.slice(5),
    Score: Math.round(d.score * 100),
  }))

  const sourceData = sentiment.bySource.map(s => ({
    name: s.source,
    score: Math.round(s.score * 100),
    mentions: s.mentions,
  }))

  const radarData = sentiment.bySource.map(s => ({
    source: s.source.replace(' ', '\n'),
    Positive: Math.round(s.positive * 100),
    Negative: Math.round(s.negative * 100),
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Sentiment Analysis</h1>
        <p className="text-text-secondary mt-1">Customer sentiment tracked across all channels over time</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Overall Score" value={`${Math.round(sentiment.overall.score * 100)}%`} subtitle="Positive" />
        {sentiment.bySource.map(s => (
          <StatCard key={s.source} label={s.source} value={`${Math.round(s.score * 100)}%`} subtitle={`${s.mentions.toLocaleString()} mentions`} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Score over time */}
        <Card>
          <h3 className="text-sm font-semibold mb-4">Sentiment Score Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4c6ef5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[60, 85]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Area type="monotone" dataKey="Score" stroke="#4c6ef5" fill="url(#scoreGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* By source */}
        <Card>
          <h3 className="text-sm font-semibold mb-4">Sentiment by Source</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sourceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="score" fill="#4c6ef5" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Source breakdown table */}
      <Card>
        <h3 className="text-sm font-semibold mb-4">Detailed Source Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium text-text-secondary">Source</th>
              <th className="text-right py-2 font-medium text-text-secondary">Mentions</th>
              <th className="text-right py-2 font-medium text-text-secondary">Score</th>
              <th className="text-right py-2 font-medium text-positive">Positive</th>
              <th className="text-right py-2 font-medium text-text-secondary">Neutral</th>
              <th className="text-right py-2 font-medium text-negative">Negative</th>
              <th className="py-2 pl-4 font-medium text-text-secondary">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {sentiment.bySource.map(s => (
              <tr key={s.source} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{s.source}</td>
                <td className="py-3 text-right">{s.mentions.toLocaleString()}</td>
                <td className="py-3 text-right font-medium">{Math.round(s.score * 100)}%</td>
                <td className="py-3 text-right text-positive">{Math.round(s.positive * 100)}%</td>
                <td className="py-3 text-right text-text-secondary">{Math.round(s.neutral * 100)}%</td>
                <td className="py-3 text-right text-negative">{Math.round(s.negative * 100)}%</td>
                <td className="py-3 pl-4">
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 w-40">
                    <div className="bg-positive" style={{ width: `${s.positive * 100}%` }} />
                    <div className="bg-gray-400" style={{ width: `${s.neutral * 100}%` }} />
                    <div className="bg-negative" style={{ width: `${s.negative * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
