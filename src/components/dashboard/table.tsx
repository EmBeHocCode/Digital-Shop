import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

export function Table({
  headers,
  rows,
  className
}: {
  headers: string[];
  rows: ReactNode[][];
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-rose-50 text-muted">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-5 py-4 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-rose-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-4 text-ink">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
