type CsvColumn<T> = {
  header: string;
  value: (item: T) => string | number | null | undefined;
};

function escapeCsvValue(value: string | number | null | undefined) {
  const stringValue = value == null ? "" : String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function toCsv<T>(items: T[], columns: CsvColumn<T>[]) {
  const headerRow = columns.map((column) => escapeCsvValue(column.header));
  const bodyRows = items.map((item) =>
    columns.map((column) => escapeCsvValue(column.value(item))),
  );

  return [headerRow, ...bodyRows].map((row) => row.join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
