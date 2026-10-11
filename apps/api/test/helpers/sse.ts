const FRAME_SEPARATOR = '\n\n';

const field = (lines: string[], name: string) =>
  lines.find((line) => line.startsWith(`${name}: `))?.slice(name.length + 2);

export async function openEventStream(url: string, cookie: string) {
  const abort = new AbortController();
  const res = await fetch(url, { headers: { Cookie: cookie }, signal: abort.signal });
  if (!res.body) throw new Error('Event stream has no body');
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  const next = async (): Promise<{ event: string; data: unknown }> => {
    for (;;) {
      const end = buffer.indexOf(FRAME_SEPARATOR);
      if (end >= 0) {
        const lines = buffer.slice(0, end).split('\n');
        buffer = buffer.slice(end + FRAME_SEPARATOR.length);
        const event = field(lines, 'event');
        const data = field(lines, 'data');
        if (event && data) return { event, data: JSON.parse(data) as unknown };
        continue;
      }
      const { value, done } = await reader.read();
      if (done) throw new Error('Event stream ended');
      buffer += value;
    }
  };

  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    next,
    close: () => abort.abort(),
  };
}
