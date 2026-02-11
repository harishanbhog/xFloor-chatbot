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

class XFloorMemorySDK {
  constructor({ appId }) {
    this.appId = appId;

    const { EventApi, QueryApi } = loadSdkModule();
    this.eventApi = new EventApi();
    this.queryApi = new QueryApi();
  }

  event(inputInfo, metadata = {}) {
    const mergedMetadata = {
      ...(this.appId ? { app_id: this.appId } : {}),
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
      ...(this.appId ? { app_id: this.appId } : {}),
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
