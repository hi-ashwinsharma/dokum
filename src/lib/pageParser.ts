export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  const parts = rangeStr.split(/,|;/);
  const result: number[] = [];
  
  for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
             const low = Math.min(start, end);
             const high = Math.max(start, end);
             // Clamp indices to boundaries
             const validLow = Math.max(1, low);
             const validHigh = Math.min(maxPages, high);
             
             for (let i = validLow; i <= validHigh; i++) {
                 result.push(i - 1); // 0-based
             }
          }
      } else {
          const page = Number(trimmed);
          if (!isNaN(page) && page >= 1 && page <= maxPages) {
              result.push(page - 1);
          }
      }
  }
  
  return result;
}

export function pagesToRangeString(indices: number[]): string {
    if (indices.length === 0) return "";
    
    const parts: string[] = [];
    let i = 0;
    while (i < indices.length) {
        const start = i;
        while (i + 1 < indices.length && indices[i + 1] === indices[i] + 1) {
            i++;
        }
        const end = i;
        
        if (end - start >= 2) {
            parts.push(`${indices[start] + 1}-${indices[end] + 1}`);
        } else {
            for (let j = start; j <= end; j++) {
                parts.push(`${indices[j] + 1}`);
            }
        }
        i++;
    }
    
    return parts.join(", ");
}
