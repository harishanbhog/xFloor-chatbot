function toJsonSafe(value, fallback = {}) {
  if (!value?.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Invalid JSON provided in optional JSON field.');
  }
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error || 'Request failed');
  }

  return result;
}

const eventForm = document.getElementById('event-form');
const queryForm = document.getElementById('query-form');
const eventResult = document.getElementById('event-result');
const queryResult = document.getElementById('query-result');
const answer = document.getElementById('answer');

eventForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = new FormData(eventForm);

  try {
    const payload = {
      floorId: String(data.get('floorId') || '').trim(),
      blockId: String(data.get('blockId') || '').trim(),
      blockType: String(data.get('blockType') || '').trim(),
      userId: String(data.get('userId') || '').trim(),
      title: String(data.get('title') || '').trim(),
      description: String(data.get('description') || '').trim(),
      extraJson: String(data.get('extraJson') || '').trim(),
      metadata: toJsonSafe(String(data.get('metadataJson') || ''), {})
    };

    const result = await postJson('/api/event', payload);
    eventResult.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    eventResult.textContent = `Error: ${error.message}`;
  }
});

queryForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = new FormData(queryForm);

  try {
    const payload = {
      userId: String(data.get('userId') || '').trim(),
      query: String(data.get('query') || '').trim(),
      floorIds: String(data.get('floorIds') || '').trim(),
      k: String(data.get('k') || '').trim(),
      includeMetadata: data.get('includeMetadata') === 'on',
      summaryNeeded: data.get('summaryNeeded') === 'on',
      extraJson: String(data.get('extraJson') || '').trim()
    };

    const result = await postJson('/api/query', payload);
    answer.textContent = result.answer ? `Answer: ${result.answer}` : 'No answer field returned.';
    queryResult.textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    answer.textContent = '';
    queryResult.textContent = `Error: ${error.message}`;
  }
});
