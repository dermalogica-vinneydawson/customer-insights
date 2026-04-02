import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useData } from '../hooks/useData'
import Card, { StatCard, DataSourceTag } from '../components/Card'

const COLORS = ['#4c6ef5', '#748ffc', '#91a7ff', '#bac8ff', '#40c057', '#fab005', '#fa5252', '#868e96']

export default function Fairing() {
  const { data: fairing } = useData('fairing.json')
  const { data: personas } = useData('personas.json')
  const [activeQuestion, setActiveQuestion] = useState(null)

  if (!fairing || !personas) return <div className="text-text-secondary">Loading...</div>

  const active = activeQuestion ? fairing.questions.find(q => q.id === activeQuestion) : fairing.questions[0]

  const getPersonaName = (id) => personas.find(p => p.id === id)?.name || id
  const getPersonaAvatar = (id) => personas.find(p => p.id === id)?.avatar || '?'

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Fairing Post-Purchase Surveys</h1>
              <DataSourceTag type="real" source="Fairing Export" />
            </div>
            <p className="text-text-secondary">Self-reported customer insights collected at the moment of purchase</p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Responses" value={fairing.summary.totalResponses.toLocaleString()} subtitle={fairing.summary.dateRange} />
        <StatCard label="Response Rate" value={`${Math.round(fairing.summary.responseRate * 100)}%`} subtitle="Of post-purchase customers" />
        <StatCard label="Questions Asked" value={fairing.summary.questionsAsked} subtitle="Via Question Stream" />
        <StatCard label="Data Quality" value="Verified Buyers" subtitle="Every response tied to an order" />
      </div>

      {/* Question selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {fairing.questions.map(q => (
          <button
            key={q.id}
            onClick={() => setActiveQuestion(q.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              active.id === q.id
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-surface-alt text-text-secondary border-border hover:border-brand-300 hover:text-text-primary'
            }`}
          >
            {q.question.length > 40 ? q.question.slice(0, 40) + '...' : q.question}
          </button>
        ))}
      </div>

      {/* Active question detail */}
      <Card className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">{active.question}</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {active.totalResponses.toLocaleString()} responses ·
              Type: <span className="capitalize">{active.type.replace('-', ' ')}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Response Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={active.responses} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis type="number" tickFormatter={v => `${Math.round(v * 100)}%`} domain={[0, 'auto']} tick={{ fontSize: 12 }} />
                <YAxis dataKey="answer" type="category" tick={{ fontSize: 11 }} width={180} />
                <Tooltip formatter={(v) => `${Math.round(v * 100)}%`} />
                <Bar dataKey="pct" fill="#4c6ef5" radius={[0, 4, 4, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Responses table */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Detailed Breakdown</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-text-secondary">Response</th>
                  <th className="text-right py-2 font-medium text-text-secondary">Count</th>
                  <th className="text-right py-2 font-medium text-text-secondary">%</th>
                  {active.responses[0]?.avgOrderValue && (
                    <th className="text-right py-2 font-medium text-text-secondary">AOV</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {active.responses.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="truncate">{r.answer}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-medium">{r.count.toLocaleString()}</td>
                    <td className="py-2.5 text-right">{Math.round(r.pct * 100)}%</td>
                    {r.avgOrderValue && (
                      <td className="py-2.5 text-right font-medium">{r.avgOrderValue}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Persona breakdown */}
      {active.personaBreakdown && (
        <Card className="mb-6">
          <h3 className="text-sm font-semibold mb-4">How Each Persona Answers This Question</h3>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(active.personaBreakdown).map(([personaId, topAnswers]) => (
              <div key={personaId} className="bg-surface rounded-lg p-3 border border-border">
                <div className="text-center mb-2">
                  <span className="text-2xl">{getPersonaAvatar(personaId)}</span>
                  <p className="text-xs font-semibold mt-1 leading-tight">{getPersonaName(personaId)}</p>
                </div>
                <div className="space-y-1.5">
                  {topAnswers.map((answer, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-xs text-brand-500 mt-0.5 flex-shrink-0">{i + 1}.</span>
                      <span className="text-xs text-text-secondary leading-tight">{answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <h3 className="text-sm font-semibold mb-3">AI-Generated Insights</h3>
        <div className="space-y-3">
          {active.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-3 bg-brand-50 rounded-lg p-3">
              <span className="text-brand-600 font-bold text-sm mt-0.5">💡</span>
              <p className="text-sm text-brand-800">{insight}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
