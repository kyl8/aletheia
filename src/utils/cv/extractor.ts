import mammoth from 'mammoth';

export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};


export const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  const pdfWorkerUrl = await import('pdfjs-dist/build/pdf.worker.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl.default;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
      hasEOL?: boolean;
    }>;

    if (items.length === 0) continue;

    interface LineGroup {
      y: number;
      items: typeof items;
    }

    const lineGroups: LineGroup[] = [];
    let currentGroup: LineGroup | null = null;

    const Y_TOLERANCE = 4;

    for (const item of items) {
      if (!item.str) continue;

      const y = item.transform[5];

      if (
        currentGroup === null ||
        Math.abs(y - currentGroup.y) > Y_TOLERANCE
      ) {
        currentGroup = { y, items: [item] };
        lineGroups.push(currentGroup);
      } else {
        currentGroup.items.push(item);
      }
    }
    lineGroups.sort((a, b) => b.y - a.y);
    const pageLines: string[] = [];

    for (const group of lineGroups) {
      group.items.sort((a, b) => a.transform[4] - b.transform[4]);
      let lineText = "";
      let prevEndX = -Infinity;

      for (const item of group.items) {
        const x = item.transform[4];
        const gap = x - prevEndX;

        if (prevEndX !== -Infinity && gap > 3) {
          lineText += " ";
        }

        lineText += item.str;
        prevEndX = x + item.width;
      }

      const trimmed = lineText.trim();
      if (trimmed.length > 0) {
        pageLines.push(trimmed);
      }
    }

    pageTexts.push(pageLines.join("\n"));
  }

  return pageTexts.join("\n\n");
};