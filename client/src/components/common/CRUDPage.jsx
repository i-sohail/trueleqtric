// client/src/components/common/CRUDPage.jsx
// Reusable CRUD page component used by all modules
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useFormModal } from '../../hooks/useFormModal'
import { PageHeader, KPICard, ConfirmDialog, PageLoader } from './ui.jsx'
import DataTable from './DataTable'
import Modal from './Modal'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CRUDPage({
  title, icon, subtitle, queryKey, api, columns, filters = [],
  FormContent, defaults = {}, kpis = [], statsQueryKey, statsQueryFn,
  extraActions, modalSize, searchPlaceholder, modalTitle,
}) {
  const qc = useQueryClient()
  const modal = useFormModal(defaults)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => api.getAll({ limit: 500 }),
  })

  const { data: statsData } = useQuery({
    queryKey: [statsQueryKey || `${queryKey}-stats`],
    queryFn: statsQueryFn || (() => Promise.resolve(null)),
    enabled: !!statsQueryFn,
  })

  const save = useMutation({
    mutationFn: (d) => modal.isEditing ? api.update(modal.editId, d) : api.create(d),
    onSuccess: (res) => {
      qc.invalidateQueries([queryKey])
      if (statsQueryKey) qc.invalidateQueries([statsQueryKey])
      modal.close()
      toast.success(res.message || 'Saved successfully')
    },
  })

  const remove = useMutation({
    mutationFn: api.remove,
    onSuccess: () => { qc.invalidateQueries([queryKey]); toast.success('Moved to trash') },
  })

  const cols = [
    ...columns,
    {
      key: '_id', label: '', sortable: false,
      render: (v, r) => (
        <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }} onClick={e => e.stopPropagation()}>
          <button className="btn-row-action" onClick={() => modal.openEdit(r)}>✎</button>
          <button className="btn-row-action del" onClick={() => setDeleteId(r._id)}>🗑</button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div>
      <PageHeader title={title} icon={icon} subtitle={subtitle}
        actions={
          <div style={{ display:'flex', gap:8 }}>
            {extraActions}
            <button className="btn btn-primary btn-sm" onClick={() => modal.openNew()}>+ New {title.split(' ')[0]}</button>
          </div>
        }
      />

      {kpis.length > 0 && statsData && (
        <div className="kpi-grid" style={{ marginBottom:16 }}>
          {kpis.map((kpi, i) => (
            <KPICard key={i} label={kpi.label} value={kpi.getValue(statsData)} sub={kpi.sub} icon={kpi.icon} accent={kpi.accent} />
          ))}
        </div>
      )}

      <DataTable
        title={title} icon={icon} columns={cols} data={data?.data || []}
        loading={isLoading} filters={filters} onRowClick={modal.openEdit}
        searchPlaceholder={searchPlaceholder || `Search ${title.toLowerCase()}…`}
      />

      <Modal
        open={modal.open} onClose={modal.close} icon={icon} size={modalSize}
        title={modal.isEditing ? `Edit ${modalTitle || title}` : `New ${modalTitle || title}`}
        onSave={() => save.mutate(modal.form)}
        saveLabel={modal.isEditing ? 'Update Record' : 'Save Record'}
      >
        {FormContent && <FormContent form={modal.form} set={modal.set} setMany={modal.setMany} isEditing={modal.isEditing} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => remove.mutate(deleteId)}
        title="Delete Record" message="Move this record to trash? It can be restored later." danger
      />
    </div>
  )
}
