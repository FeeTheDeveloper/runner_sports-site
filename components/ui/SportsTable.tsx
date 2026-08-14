export interface SportsTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
}

interface SportsTableProps<T> {
  columns: SportsTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

const alignClass: Record<NonNullable<SportsTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export default function SportsTable<T>({ columns, rows, rowKey }: SportsTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-surface-2 text-[11px] uppercase tracking-wide text-text-subtle">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-medium ${alignClass[col.align ?? "left"]}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-border bg-surface hover:bg-surface-2 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 align-middle ${alignClass[col.align ?? "left"]}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
