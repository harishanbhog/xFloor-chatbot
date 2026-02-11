class XFloorSDK {
  constructor({ baseUrl, apiKey, agentId }) {
    this.baseUrl = (baseUrl || 'https://api.xfloor.ai').replace(/\/$/, '');
    this.apiKey = apiKey || '';
    this.agentId = agentId || '';
  }

  async #post(pathname, payload) {
    const headers = { 'Content-Type': 'application/json' };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${pathname}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let parsed;

    try {
      parsed = responseText ? JSON.parse(responseText) : {};
    } catch {
      parsed = { raw: responseText };
    }

    if (!response.ok) {
      const error = new Error(`xFloor API ${pathname} failed with ${response.status}`);
      error.details = parsed;
      throw error;
    }

    return parsed;
  }

  async event({ sessionId, text, type = 'user_message', timestamp = new Date().toISOString() }) {
    return this.#post('/event', {
      agentId: this.agentId,
      sessionId,
      type,
      text,
      timestamp
    });
  }

  async query({ sessionId, query }) {
    return this.#post('/query', {
      agentId: this.agentId,
      sessionId,
      query
    });
  }
}

module.exports = { XFloorSDK };
