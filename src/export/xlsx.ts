export interface SheetTable {
  name: string;
  /** First row is the header. */
  rows: (string | number)[][];
}

/** Builds and downloads an .xlsx; the library is fetched only when someone exports. */
export async function downloadXlsx(fileName: string, tables: SheetTable[]): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  await writeXlsxFile(
    tables.map((tb) => ({
      sheet: tb.name.slice(0, 31), // Excel's sheet-name limit
      data: tb.rows.map((row, i) => row.map((value) => (i === 0 ? { value, fontWeight: 'bold' as const } : value))),
    })),
  ).toFile(fileName);
}

/** Hours with two decimals as a number, so Excel can sum it. */
export const hours = (ms: number) => Math.round((ms / 3_600_000) * 100) / 100;
