interface RowProps {
  message: string
  colspan: number
}

export function MessageRow({ message, colspan }: RowProps) {
  return (
    <tr>
      <td
        colSpan={colspan}
        className="text-truncate text-center smj-table-body"
      >
        {message}
      </td>
    </tr>
  )
}
