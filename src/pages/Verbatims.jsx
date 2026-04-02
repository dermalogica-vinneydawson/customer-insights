import { useState } from 'react'
import { useData } from '../hooks/useData'
import Card, { SentimentBadge, SourceBadge } from '../components/Card'

export default function Verbatims() {
  const { data: verbatims } = useData('verbatims.json')
  const { data: personas } = useData('personas.json')
  const { data: themes } = useData('themes.json')

  const [sourceFilter, setSourceFilter] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [themeFilter, setThemeFilter] = useState('all')
  const [search, setSearch] = useState('')

  if (!verbatims || !personas || !themes) return <div className="text-text-secondary">Loading...</div>

  const sources = [...new Set(verbatims.map(v => v.source))]

  const filtered = verbatims.filter(v => {
    if (sourceFilter !== 'all' && v.source !== sourceFilter) return false
    if (sentimentFilter !== 'all' && v.sentiment !== sentimentFilter) return false
    if (themeFilter !== 'all' && v.theme !== themeFilter) return false
    if (search && !v.text.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getPersonaName = (id) => personas.find(p => p.id === id)?.name || id
  const getThemeName = (id) => themes.find(t => t.id === id)?.name || id

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Verbatim Browser</h1>
        <p className="text-text-secondary mt-1">Search and filter customer quotes from all sources</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-medium text-text-secondary block mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search quotes..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Source</label>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300">
              <option value="all">All Sources</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Sentiment</label>
            <select value={sentimentFilter} onChange={e => setSentimentFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300">
              <option value="all">All Sentiment</option>
              <option value="positive">Positive</option>
              <option value="mixed">Mixed</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Theme</label>
            <select value={themeFilter} onChange={e => setThemeFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300">
              <option value="all">All Themes</option>
              {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-text-secondary mt-3">{filtered.length} of {verbatims.length} quotes</p>
      </Card>

      {/* Results */}
      <div className="space-y-3">
        {filtered.map(v => (
          <Card key={v.id} className="hover:border-brand-200 transition-colors">
            <p className="text-sm leading-relaxed mb-3">"{v.text}"</p>
            <div className="flex items-center gap-3 flex-wrap">
              <SourceBadge source={v.source} />
              <SentimentBadge sentiment={v.sentiment} score={v.score} />
              <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium">{getThemeName(v.theme)}</span>
              <span className="px-2 py-0.5 bg-gray-100 text-text-secondary rounded text-xs">{getPersonaName(v.persona)}</span>
              <span className="text-xs text-text-secondary ml-auto">{v.date}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
