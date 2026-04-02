import { useData } from '../hooks/useData'
import Card, { SentimentBadge, DataSourceTag, SourceBadge } from '../components/Card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function Themes() {
  const { data: themes } = useData('themes.json')

  if (!themes) return <div className="text-text-secondary">Loading...</div>

  const sorted = [...themes].sort((a, b) => b.mentionCount - a.mentionCount)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Theme Explorer</h1>
        <p className="text-text-secondary mt-1">AI-extracted topics from customer reviews, social media, and support data</p>
      </div>

      <div className="space-y-4">
        {sorted.map(theme => {
          const sentimentLabel = theme.sentiment.positive > 0.6 ? 'positive' : theme.sentiment.negative > 0.4 ? 'negative' : 'mixed'
          const TrendIcon = theme.trend === 'rising' ? TrendingUp : theme.trend === 'declining' ? TrendingDown : Minus
          const trendColor = theme.trend === 'rising' && theme.trendDelta > 0
            ? (sentimentLabel === 'negative' ? 'text-negative' : 'text-positive')
            : theme.trend === 'declining'
              ? 'text-negative'
              : 'text-text-secondary'

          return (
            <Card key={theme.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">{theme.name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-text-secondary rounded text-xs">{theme.category}</span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{theme.description}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-lg font-bold">{theme.mentionCount.toLocaleString()}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <p className="text-xs text-text-secondary">mentions</p>
                    <DataSourceTag type="ai" />
                  </div>
                  <div className={`flex items-center gap-1 mt-1 justify-end ${trendColor}`}>
                    <TrendIcon size={14} />
                    <span className="text-xs font-medium">
                      {theme.trendDelta > 0 ? '+' : ''}{theme.trendDelta}% {theme.trend}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sentiment bar */}
              <div className="mb-4">
                <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                  <div className="bg-positive" style={{ width: `${theme.sentiment.positive * 100}%` }} />
                  <div className="bg-gray-400" style={{ width: `${theme.sentiment.neutral * 100}%` }} />
                  <div className="bg-negative" style={{ width: `${theme.sentiment.negative * 100}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-xs text-text-secondary">
                  <span>Positive {Math.round(theme.sentiment.positive * 100)}%</span>
                  <span>Neutral {Math.round(theme.sentiment.neutral * 100)}%</span>
                  <span>Negative {Math.round(theme.sentiment.negative * 100)}%</span>
                </div>
              </div>

              {/* Verbatims */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Top Quotes</p>
                  <DataSourceTag type="real" source="Yotpo" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {theme.topVerbatims.map((v, i) => {
                    const isObj = typeof v === 'object'
                    const text = isObj ? v.text : v
                    return (
                      <div key={i} className="bg-surface rounded-lg p-2.5 border border-border">
                        <p className="text-xs italic leading-relaxed">"{text}"</p>
                        {isObj && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <SourceBadge source={v.source} />
                            {v.product && v.product !== 'nan' && <span className="text-[10px] text-text-secondary truncate">{v.product}</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Team implications */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Team Implications</p>
                  <DataSourceTag type="ai" />
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-blue-50 rounded-lg p-2.5">
                    <p className="font-semibold text-blue-700 mb-0.5">Paid Media</p>
                    <p className="text-blue-600">{theme.teamImplications.paidMedia}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2.5">
                    <p className="font-semibold text-purple-700 mb-0.5">CRM</p>
                    <p className="text-purple-600">{theme.teamImplications.crm}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2.5">
                    <p className="font-semibold text-green-700 mb-0.5">CRO</p>
                    <p className="text-green-600">{theme.teamImplications.cro}</p>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
