interface Props {
  message: string
  action?: React.ReactNode
}

export function EmptyState({ message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <p className="text-sm text-neutral-400">{message}</p>
      {action}
    </div>
  )
}
