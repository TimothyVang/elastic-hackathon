/**
 * Convert ES|QL columnar response to row objects.
 * ES|QL returns { columns: [{name}], values: [[...]] } — this maps each
 * value array into a keyed object using the column names.
 */
export function esqlToRows(
  columns: { name: string }[] | undefined,
  values: unknown[][] | undefined
): Record<string, unknown>[] {
  if (!columns || !values) return [];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col.name] = row[i];
    });
    return obj;
  });
}
