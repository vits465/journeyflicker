export function parseCSV(text: string): Record<string, string>[] {
  const result: string[][] = [];
  let currentWord = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentWord += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentWord += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentWord.trim());
        currentWord = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        if (char === '\r') i++; // skip \n of \r\n
        row.push(currentWord.trim());
        currentWord = '';
        // Only push non-empty rows
        if (row.some(c => c !== '')) {
          result.push(row);
        }
        row = [];
      } else {
        currentWord += char;
      }
    }
  }
  
  row.push(currentWord.trim());
  if (row.some(c => c !== '')) result.push(row);

  if (result.length < 2) return []; // No data

  const headers = result[0].map(h => h.trim());
  return result.slice(1).map(r => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] !== undefined ? r[i] : '';
    });
    return obj;
  });
}
