import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Target, Mail, MousePointerClick } from 'lucide-react'
import { useData } from '../hooks/useData'
import Card, { SentimentBadge } from '../components/Card'

export default function PersonaDetail() {
  const { id } = useParams()
  const { data: personas } = useData('personas.json')

  if (!personas) return <div className="text-text-secondary">Loading...</div>

  const persona = personas.find(p => p.id === id)
  if (!persona) return <div className="text-text-secondary">Persona not found.</div>

  const p = persona

  return (
    <div>
      <Link to="/personas" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6">
        <ArrowLeft size={16} /> Back to Personas
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="text-6xl">{p.avatar}</div>
        <div>
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <p className="text-text-secondary mt-1">{p.archetype}</p>
          <div className="flex items-center gap-3 mt-2">
            <SentimentBadge sentiment={p.sentimentProfile.overall} score={p.sentimentProfile.score} />
            <span className="text-sm text-text-secondary">{p.sampleSize.toLocaleString()} customers · {Math.round(p.confidence * 100)}% confidence</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Demographics */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Demographics</h3>
          <div className="space-y-2 text-sm">
            <Row label="Age Range" value={p.demographics.ageRange} />
            <Row label="Gender" value={p.demographics.gender} />
            <Row label="Location" value={p.demographics.location} />
            <Row label="Income" value={p.demographics.income} />
            <Row label="Education" value={p.demographics.education} />
          </div>
        </Card>

        {/* Purchase Behavior */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Purchase Behavior</h3>
          <div className="space-y-2 text-sm">
            <Row label="Avg Order Value" value={p.purchaseBehavior.aov} />
            <Row label="Purchase Frequency" value={p.purchaseBehavior.frequency} />
            <Row label="Preferred Products" value={p.purchaseBehavior.preferredProducts.join(', ')} />
            <Row label="Channel Mix" value={p.purchaseBehavior.channel} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Psychographics */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Psychographics</h3>
          <div className="mb-3">
            <p className="text-xs font-medium text-text-secondary mb-1.5">Values</p>
            <div className="flex flex-wrap gap-1.5">
              {p.psychographics.values.map(v => (
                <span key={v} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium">{v}</span>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <p className="text-xs font-medium text-text-secondary mb-1">Lifestyle</p>
            <p className="text-sm">{p.psychographics.lifestyle}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-1">Motivations</p>
            <ul className="text-sm space-y-1">
              {p.psychographics.motivations.map((m, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-brand-500 mt-0.5">•</span> {m}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Pain Points */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Pain Points</h3>
          <ul className="space-y-2">
            {p.painPoints.map((pain, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-negative mt-0.5 flex-shrink-0">⚠️</span>
                {pain}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <p className="text-xs font-medium text-text-secondary mb-1">Content Affinity</p>
            <div className="flex flex-wrap gap-1.5">
              {p.contentAffinity.map(c => (
                <span key={c} className="px-2 py-0.5 bg-gray-100 text-text-secondary rounded text-xs">{c}</span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Sentiment Drivers */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold mb-3">Sentiment Drivers</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-positive mb-2">Positive Drivers</p>
            <div className="space-y-1.5">
              {p.sentimentProfile.drivers.positive.map(d => (
                <div key={d} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-positive rounded-full" /> {d}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-negative mb-2">Negative Drivers</p>
            <div className="space-y-1.5">
              {p.sentimentProfile.drivers.negative.map(d => (
                <div key={d} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-negative rounded-full" /> {d}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Verbatims */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold mb-3">Top Customer Quotes</h3>
        <div className="space-y-3">
          {p.topVerbatims.map((v, i) => (
            <div key={i} className="bg-surface rounded-lg p-3 border border-border">
              <p className="text-sm italic">"{v}"</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Team Recommendations */}
      <h3 className="text-lg font-semibold mb-4">Team Recommendations</h3>
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-blue-500" />
            <h4 className="text-sm font-semibold">Paid Media</h4>
          </div>
          <p className="text-sm text-text-secondary">{p.recommendations.paidMedia}</p>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={16} className="text-purple-500" />
            <h4 className="text-sm font-semibold">CRM</h4>
          </div>
          <p className="text-sm text-text-secondary">{p.recommendations.crm}</p>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick size={16} className="text-green-500" />
            <h4 className="text-sm font-semibold">CRO</h4>
          </div>
          <p className="text-sm text-text-secondary">{p.recommendations.cro}</p>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
