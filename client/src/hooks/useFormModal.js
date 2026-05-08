// client/src/hooks/useFormModal.js
import { useState, useCallback } from 'react'

export function useFormModal(defaults = {}) {
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(defaults)

  const openNew = useCallback((prefill = {}) => {
    setEditId(null)
    setForm({ ...defaults, ...prefill })
    setOpen(true)
  }, [defaults])

  const openEdit = useCallback((record) => {
    setEditId(record._id)
    setForm({ ...defaults, ...record })
    setOpen(true)
  }, [defaults])

  const close = useCallback(() => {
    setOpen(false)
    setEditId(null)
    setForm(defaults)
  }, [defaults])

  const set = useCallback((field, value) => {
    setForm(f => ({ ...f, [field]: value }))
  }, [])

  const setMany = useCallback((updates) => {
    setForm(f => ({ ...f, ...updates }))
  }, [])

  return { open, editId, form, openNew, openEdit, close, set, setMany, isEditing: !!editId }
}
