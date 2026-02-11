const SDK_PACKAGE_NAME = '@xfloor/floor-memory-sdk-js';

function resolveFactory(mod) {
  return mod?.FloorMemoryClient || mod?.XFloorClient || mod?.Client || mod?.default || mod;
}

function callMethod(client, candidateNames, payload) {
  for (const name of candidateNames) {
    if (typeof client?.[name] === 'function') {
      return client[name](payload);
    }
  }

  throw new Error(
    `Installed ${SDK_PACKAGE_NAME}, but no compatible method found. Tried: ${candidateNames.join(', ')}`
  );
}

class AppSDK {
  constructor({ baseUrl, apiKey, agentId }) {
    this.baseUrl = (baseUrl || 'https://api.xfloor.ai').replace(/\/$/, '');
    this.apiKey = apiKey || '';
    this.agentId = agentId || '';

    let loaded;
    try {
      loaded = require(SDK_PACKAGE_NAME);
    } catch (error) {
      throw new Error(
        `Missing dependency ${SDK_PACKAGE_NAME}. Run: npm install ${SDK_PACKAGE_NAME}. Original: ${error.message}`
      );
    }

    const Factory = resolveFactory(loaded);

    if (typeof Factory === 'function') {
      try {
        this.client = new Factory({
          baseUrl: this.baseUrl,
          apiKey: this.apiKey,
          agentId: this.agentId
        });
      } catch {
        this.client = Factory({
          baseUrl: this.baseUrl,
          apiKey: this.apiKey,
          agentId: this.agentId
        });
      }
    } else {
      this.client = loaded;
    }
  }

  async event({ sessionId, text, type = 'user_message', timestamp = new Date().toISOString() }) {
    const payload = {
      agentId: this.agentId,
      sessionId,
      type,
      text,
      timestamp
    };

    return callMethod(this.client, ['event', 'sendEvent', 'postEvent', 'createEvent'], payload);
  }

  async query({ sessionId, query }) {
    const payload = {
      agentId: this.agentId,
      sessionId,
      query
    };

    return callMethod(this.client, ['query', 'sendQuery', 'postQuery', 'createQuery'], payload);
  }
}

module.exports = { AppSDK };
