// client/src/hooks/useLists.js
import { useQuery } from '@tanstack/react-query'
import { listsApi } from '../services/modules'

export function useLists() {
  const { data } = useQuery({
    queryKey: ['lists'],
    queryFn: listsApi.getAll,
    staleTime: 5 * 60 * 1000,
  })
  return data?.data || {}
}

export function useListOptions(key) {
  const lists = useLists()
  return (lists[key] || []).map(v => ({ value: v, label: v }))
}
