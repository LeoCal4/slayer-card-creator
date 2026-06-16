import { useProjectStore } from '@/store/projectStore'

export function CardTypeColumnTable() {
  const project = useProjectStore((s) => s.project)
  const updateCsvColumnRequirements = useProjectStore((s) => s.updateCsvColumnRequirements)

  if (!project) return null

  const columns = project.csvColumns ?? []

  function handleCheckbox(type: string, colName: string, checked: boolean) {
    const current = project!.csvColumnRequirements?.[type] ?? []
    if (checked) {
      updateCsvColumnRequirements(type, [...current, colName])
    } else {
      updateCsvColumnRequirements(type, current.filter((c) => c !== colName))
    }
  }

  return (
    <div className="overflow-auto">
      <table className="text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-neutral-500 text-xs pr-4 pb-2 font-normal">
              Card Type
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className="text-neutral-400 text-xs font-medium pb-2 px-2 text-center"
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {project.cardTypes.map((type) => (
            <tr key={type}>
              <th
                scope="row"
                className="text-neutral-300 text-xs pr-4 py-1 whitespace-nowrap text-left font-normal"
              >
                {type}
              </th>
              {columns.map((col) => {
                const checked = project.csvColumnRequirements?.[type]?.includes(col.name) ?? false
                return (
                  <td key={col.id} className="text-center px-2 py-1">
                    <input
                      type="checkbox"
                      aria-label={`${type} ${col.name}`}
                      checked={checked}
                      onChange={(e) => handleCheckbox(type, col.name, e.target.checked)}
                      className="accent-indigo-500 w-4 h-4"
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
