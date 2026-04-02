import { Link } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { useData } from '../hooks/useData'
import Card, { SentimentBadge, DataSourceTag } from '../components/Card'

export default function Personas() {
  const { data: personas } = useData('personas.json')

  if (!personas) return <div className="text-text-secondary">Loading...</div>

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Customer Personas</h1>
          <DataSourceTag type="ai" />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-text-secondary">AI-identified customer archetypes from review, social, and support data. Connect Claude API to regenerate from 209K+ source records.</p>
          <button onClick={() => window.print()} className="print:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors flex-shrink-0 ml-4">
            <Printer size={16} /> Print All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {personas.map(p => (
          <Link key={p.id} to={`/personas/${p.id}`} className="block">
            <Card className="hover:border-brand-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex gap-6">
                {/* Avatar & basic info */}
                <div className="flex-shrink-0 text-center w-32">
                  <div className="text-5xl mb-2">{p.avatar}</div>
                  <SentimentBadge sentiment={p.sentimentProfile.overall} score={p.sentimentProfile.score} />
                  <p className="text-xs text-text-secondary mt-2">{p.sampleSize.toLocaleString()} customers</p>
                  <p className="text-xs text-text-secondary">Confidence: {Math.round(p.confidence * 100)}%</p>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">{p.archetype}</p>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Demographics</p>
                      <p className="text-sm">Age {p.demographics.ageRange} · {p.demographics.gender}</p>
                      <p className="text-sm text-text-secondary">{p.demographics.location}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Purchase Behavior</p>
                      <p className="text-sm">AOV: {p.purchaseBehavior.aov} · {p.purchaseBehavior.frequency}</p>
                      <p className="text-sm text-text-secondary">{p.purchaseBehavior.channel}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Top Pain Point</p>
                      <p className="text-sm">{p.painPoints[0]}</p>
                    </div>
                  </div>

                  {/* Top verbatim */}
                  <div className="mt-4 bg-surface rounded-lg p-3 border border-border">
                    <p className="text-xs font-medium text-text-secondary mb-1">Top Customer Quote</p>
                    <p className="text-sm italic">"{typeof p.topVerbatims[0] === 'object' ? p.topVerbatims[0].text : p.topVerbatims[0]}"</p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
