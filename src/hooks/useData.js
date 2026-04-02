import { useState, useEffect } from 'react'

const BASE = import.meta.env.BASE_URL

const cache = {}

export function useData(filename) {
  const [data, setData] = useState(cache[filename] || null)
  const [loading, setLoading] = useState(!cache[filename])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cache[filename]) {
      setData(cache[filename])
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`${BASE}data/${filename}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${filename}`)
        return res.json()
      })
      .then(json => {
        cache[filename] = json
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [filename])

  return { data, loading, error }
}
