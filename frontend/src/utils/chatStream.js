// Network reads can split JSON records and UTF-8 characters at any byte.
export async function readChatStream(response, onDelta) {
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Please sign in again.');
    throw new Error('The assistant is unavailable. Please try again.');
  }
  if (!response.body || !response.headers.get('content-type')?.includes('application/x-ndjson')) {
    throw new Error('Streaming is unavailable. Please restart the backend and try again.');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const processLine = line => {
    if (!line.trim()) return false;
    const event = JSON.parse(line);
    if (event.type === 'error') throw new Error(event.message || 'The reply was interrupted. Please try again.');
    if (event.type === 'done') return true;
    if (event.type !== 'delta' || typeof event.text !== 'string') throw new Error('Invalid assistant response. Please try again.');
    onDelta(event.text);
    return false;
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        if (processLine(line)) return;
      }
      if (done) {
        if (buffer && processLine(buffer)) return;
        throw new Error('The connection ended before the reply finished. Please try again.');
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
