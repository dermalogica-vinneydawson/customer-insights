import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Personas from './pages/Personas'
import PersonaDetail from './pages/PersonaDetail'
import Themes from './pages/Themes'
import Sentiment from './pages/Sentiment'
import Verbatims from './pages/Verbatims'
import Fairing from './pages/Fairing'
import TeamView from './pages/TeamView'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="personas" element={<Personas />} />
        <Route path="personas/:id" element={<PersonaDetail />} />
        <Route path="themes" element={<Themes />} />
        <Route path="sentiment" element={<Sentiment />} />
        <Route path="verbatims" element={<Verbatims />} />
        <Route path="fairing" element={<Fairing />} />
        <Route path="team/:teamId" element={<TeamView />} />
      </Route>
    </Routes>
  )
}
