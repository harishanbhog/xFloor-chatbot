const SDK_PACKAGE_NAME = '@xfloor/floor-memory-sdk-js';

function resolveFactory(mod) {
  return (
    mod?.FloorMemoryClient ||
    mod?.XFloorClient ||
    mod?.Client ||
    mod?.MemoryClient ||
    mod?.default ||
    mod
  );
}

function getByPath(target, dottedPath) {
  return dottedPath.split('.').reduce((obj, segment) => obj?.[segment], target);
}

function parseOverride(envValue) {
  if (!envValue) {
    return [];
  }

  return envValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function callCandidates(client, candidateNames, payload, actionName) {
  for (const name of candidateNames) {
    const fn = getByPath(client, name);
    if (typeof fn !== 'function') {
      continue;
    }

    const fnOwnerPath = name.includes('.') ? name.split('.').slice(0, -1).join('.') : null;
    const fnOwner = fnOwnerPath ? getByPath(client, fnOwnerPath) : client;

    try {
      return fn.call(fnOwner, payload);
    } catch {
      try {
        return fn.call(fnOwner, {
          ...payload,
          action: actionName,
          event: payload,
          query: payload
        });
      } catch {
        // Try 2nd signature style: (actionName, payload)
      }

      try {
        return fn.call(fnOwner, actionName, payload);
      } catch {
        // Continue to next candidate.
      }
    }
  }

  throw new Error(
    `Installed ${SDK_PACKAGE_NAME}, but no compatible method found for ${actionName}. Tried: ${candidateNames.join(', ')}`
  );
}

class AppSDK {
  constructor({ baseUrl, apiKey, agentId }) {
    this.baseUrl = (baseUrl || 'https://api.xfloor.ai').replace(/\/$/, '');
    this.apiKey = apiKey || '';
    this.agentId = agentId || '';

    const eventOverride = parseOverride(process.env.XFLOOR_SDK_EVENT_METHODS);
    const queryOverride = parseOverride(process.env.XFLOOR_SDK_QUERY_METHODS);

    this.eventMethods = [
      ...eventOverride,
      'event',
      'sendEvent',
      'postEvent',
      'createEvent',
      'events.create',
      'events.send',
      'memory.event',
      'memory.events.create',
      'track',
      'trackEvent',
      'ingestEvent',
      'request'
    ];

    this.queryMethods = [
      ...queryOverride,
      'query',
      'sendQuery',
      'postQuery',
      'createQuery',
      'queries.create',
      'queries.send',
      'memory.query',
      'memory.queries.create',
      'ask',
      'askQuery',
      'request'
    ];

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

    return callCandidates(this.client, this.eventMethods, payload, 'event');
  }

  async query({ sessionId, query }) {
    const payload = {
      agentId: this.agentId,
      sessionId,
      query
    };

    return callCandidates(this.client, this.queryMethods, payload, 'query');
  }
}

module.exports = { AppSDK };
