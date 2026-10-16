export function splitIntoSections(text, maximumLength = 4500) {
  if (typeof text !== 'string' || !Number.isInteger(maximumLength) || maximumLength < 1) {
    throw new TypeError('Text and a positive section limit are required.');
  }

  const sections = [];
  let start = 0;
  while (start < text.length) {
    const hardEnd = Math.min(start + maximumLength, text.length);
    let end = hardEnd;

    if (hardEnd < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', hardEnd - 2);
      if (paragraphBreak > start + maximumLength * 0.45) {
        end = paragraphBreak + 2;
      } else {
        const lineBreak = text.lastIndexOf('\n', hardEnd - 1);
        const wordBreak = text.lastIndexOf(' ', hardEnd - 1);
        const boundary = Math.max(lineBreak, wordBreak);
        if (boundary > start + maximumLength * 0.45) end = boundary + 1;
      }
    }

    sections.push(text.slice(start, end));
    start = end;
  }
  return sections;
}