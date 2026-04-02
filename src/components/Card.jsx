export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-surface-alt rounded-xl border border-border p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, subtitle, trend, trendDirection }) {
  return (
    <Card>
      <p className="text-sm text-text-secondary font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
      {trend && (
        <p className={`text-xs font-medium mt-2 ${trendDirection === 'up' ? 'text-positive' : trendDirection === 'down' ? 'text-negative' : 'text-text-secondary'}`}>
          {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'} {trend}
        </p>
      )}
    </Card>
  )
}

export function SentimentBadge({ sentiment, score }) {
  const colors = {
    positive: 'bg-green-50 text-green-700 border-green-200',
    negative: 'bg-red-50 text-red-700 border-red-200',
    mixed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    neutral: 'bg-gray-50 text-gray-600 border-gray-200',
    'very positive': 'bg-green-100 text-green-800 border-green-300',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[sentiment] || colors.neutral}`}>
      {sentiment === 'positive' || sentiment === 'very positive' ? '😊' : sentiment === 'negative' ? '😟' : '😐'}
      {score !== undefined ? ` ${Math.round(score * 100)}%` : ` ${sentiment}`}
    </span>
  )
}

export function SourceBadge({ source }) {
  const colors = {
    'Website Review': 'bg-blue-50 text-blue-700',
    'Google Review': 'bg-amber-50 text-amber-700',
    'Reddit': 'bg-orange-50 text-orange-700',
    'Social Media': 'bg-purple-50 text-purple-700',
    'Support Ticket': 'bg-red-50 text-red-700',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors[source] || 'bg-gray-50 text-gray-700'}`}>
      {source}
    </span>
  )
}
