import { useParams } from 'react-router-dom'
import { Target, Mail, MousePointerClick } from 'lucide-react'
import { useData } from '../hooks/useData'
import Card from '../components/Card'

const teamConfig = {
  'paid-media': {
    name: 'Paid Media',
    icon: Target,
    color: 'blue',
    description: 'Targeting recommendations, audience insights, and channel performance insights for the Paid Media team.',
    recKey: 'paidMedia',
    implKey: 'paidMedia',
  },
  crm: {
    name: 'CRM',
    icon: Mail,
    color: 'purple',
    description: 'Messaging, segmentation, and retention insights for the CRM team.',
    recKey: 'crm',
    implKey: 'crm',
  },
  cro: {
    name: 'CRO',
    icon: MousePointerClick,
    color: 'green',
    description: 'Friction points, conversion optimization, and UX insights for the Website/Conversion team.',
    recKey: 'cro',
    implKey: 'cro',
  },
}

export default function TeamView() {
  const { teamId } = useParams()
  const { data: personas } = useData('personas.json')
  const { data: themes } = useData('themes.json')

  const config = teamConfig[teamId]

  if (!config) return <div className="text-text-secondary">Unknown team view.</div>
  if (!personas || !themes) return <div className="text-text-secondary">Loading...</div>

  const Icon = config.icon
  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-blue-500', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-800' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-l-purple-500', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-800' },
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-l-green-500', icon: 'text-green-500', badge: 'bg-green-100 text-green-800' },
  }
  const c = colorClasses[config.color]

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon size={22} className={c.icon} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{config.name} Team View</h1>
            <p className="text-text-secondary">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Persona recommendations */}
      <h2 className="text-lg font-semibold mb-4">Recommendations by Persona</h2>
      <div className="space-y-4 mb-8">
        {personas.map(p => (
          <Card key={p.id} className={`border-l-4 ${c.border}`}>
            <div className="flex items-start gap-4">
              <div className="text-3xl">{p.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="text-xs text-text-secondary">({p.sampleSize.toLocaleString()} customers)</span>
                </div>
                <p className="text-sm">{p.recommendations[config.recKey]}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Theme implications */}
      <h2 className="text-lg font-semibold mb-4">Theme-Based Insights</h2>
      <div className="grid grid-cols-2 gap-4">
        {themes.map(theme => {
          const sentimentLabel = theme.sentiment.positive > 0.6 ? 'positive' : theme.sentiment.negative > 0.4 ? 'negative' : 'mixed'
          return (
            <Card key={theme.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{theme.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">{theme.mentionCount.toLocaleString()} mentions</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    sentimentLabel === 'positive' ? 'bg-green-50 text-green-700' :
                    sentimentLabel === 'negative' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {sentimentLabel}
                  </span>
                </div>
              </div>
              <div className={`${c.bg} rounded-lg p-3 mt-2`}>
                <p className={`text-sm ${c.text}`}>{theme.teamImplications[config.implKey]}</p>
              </div>
              {theme.topVerbatims[0] && (
                <p className="text-xs italic text-text-secondary mt-2">"{typeof theme.topVerbatims[0] === 'object' ? theme.topVerbatims[0].text : theme.topVerbatims[0]}"</p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
