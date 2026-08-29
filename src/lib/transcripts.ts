export type TranscriptTurn = {
  speaker: string;
  text: string;
};

function looksLikeSpeaker(name: string) {
  const value = name.trim();
  if (/^(Operator|Moderator|Analyst|Unidentified Analyst|Unidentified Company Representative)$/i.test(value)) {
    return true;
  }
  if (/form|report|note|including|without|additional|please|today|sec\b/i.test(value)) return false;
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 7) return false;
  return words.every((word) => /^[A-Z]/.test(word) || /^(of|the|and|Jr\.?|Sr\.?|III|II|IV)$/i.test(word));
}

function parseLineTurns(content: string): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^([A-Z][\w .,'&/-]{1,70}):\s*(.*)$/);
    if (match && looksLikeSpeaker(match[1])) {
      turns.push({ speaker: match[1].trim(), text: match[2] });
    } else if (turns.length) {
      turns[turns.length - 1].text += `\n${line}`;
    } else {
      turns.push({ speaker: "", text: line });
    }
  }
  return turns.filter((turn) => turn.text.trim());
}

function parseInlineTurns(content: string): TranscriptTurn[] {
  const pattern = /([A-Z][\w .,'&/-]{1,70}):\s+/g;
  const marks: { speaker: string; start: number; body: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content))) {
    if (!looksLikeSpeaker(match[1])) continue;
    marks.push({ speaker: match[1].trim(), start: match.index, body: match.index + match[0].length });
  }
  if (marks.length < 2) return [];
  const turns: TranscriptTurn[] = [];
  if (marks[0].start > 0) {
    const preamble = content.slice(0, marks[0].start).trim();
    if (preamble) turns.push({ speaker: "", text: preamble });
  }
  for (let i = 0; i < marks.length; i += 1) {
    const end = i + 1 < marks.length ? marks[i + 1].start : content.length;
    const text = content.slice(marks[i].body, end).trim();
    if (text) turns.push({ speaker: marks[i].speaker, text });
  }
  return turns;
}

/** Split an FMP earnings-call blob into speaker turns for Stock Analysis-style reading. */
export function parseTranscript(content: string): TranscriptTurn[] {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
  if (!normalized) return [];
  const lineTurns = parseLineTurns(normalized);
  const named = lineTurns.filter((turn) => turn.speaker).length;
  if (named >= 3) return lineTurns;
  const inline = parseInlineTurns(normalized);
  return inline.length >= 2 ? inline : lineTurns;
}
