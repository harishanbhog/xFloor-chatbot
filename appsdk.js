function loadSdkModule() {
  try {
    return require('@xfloor/floor-memory-sdk-js');
  } catch (error) {
    throw new Error(
      `Missing dependency @xfloor/floor-memory-sdk-js. Run: npm install @xfloor/floor-memory-sdk-js. Original: ${error.message}`
    );
  }
}

function parseJson(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function buildSdkClients(loaded, apiKey) {
  const { EventApi, QueryApi, Configuration } = loaded;

  if (typeof EventApi !== 'function' || typeof QueryApi !== 'function') {
    throw new Error('Invalid @xfloor/floor-memory-sdk-js exports: EventApi/QueryApi not found.');
  }

  if (typeof Configuration === 'function') {
    const config = new Configuration({
      apiKey,
      accessToken: apiKey,
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    return {
      eventApi: new EventApi(config),
      queryApi: new QueryApi(config)
    };
  }

  return {
    eventApi: new EventApi(),
    queryApi: new QueryApi()
  };
}

class XFloorMemorySDK {
  constructor({ appId, apiKey }) {
    this.appId = appId;
    this.apiKey = apiKey;

    if (!this.apiKey) {
      throw new Error('Missing XFLOOR_API_KEY. Set it before starting the server.');
    }

    if (!this.appId) {
      throw new Error('Missing XFLOOR_APP_ID. Set it before starting the server.');
    }

    const loaded = loadSdkModule();
    const clients = buildSdkClients(loaded, this.apiKey);
    this.eventApi = clients.eventApi;
    this.queryApi = clients.queryApi;
  }

  event(inputInfo, metadata = {}) {
    const mergedMetadata = {
      app_id: this.appId,
      authorization: `Bearer ${this.apiKey}`,
      api_key: this.apiKey,
      ...metadata
    };

    return new Promise((resolve, reject) => {
      this.eventApi.event(inputInfo, mergedMetadata, (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(data);
      });
    });
  }

  query(request = {}) {
    const payload = {
      app_id: this.appId,
      authorization: `Bearer ${this.apiKey}`,
      api_key: this.apiKey,
      ...request
    };

    return new Promise((resolve, reject) => {
      this.queryApi.query(payload, (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(data);
      });
    });
  }
}

function buildEventInput({ floorId, blockId, blockType, userId, title, description, extraJson }) {
  return JSON.stringify({
    floor_id: floorId,
    block_id: blockId,
    block_type: blockType,
    user_id: userId,
    title,
    description,
    ...parseJson(extraJson)
  });
}

function buildQueryRequest({ userId, query, floorIds, k, includeMetadata, summaryNeeded, extraJson }) {
  return {
    user_id: userId,
    query,
    floor_ids: (floorIds || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
    ...(k ? { k: Number(k) } : {}),
    include_metadata: includeMetadata ? '1' : '0',
    summary_needed: summaryNeeded ? '1' : '0',
    ...parseJson(extraJson)
  };
}

module.exports = {
  XFloorMemorySDK,
  buildEventInput,
  buildQueryRequest
};
