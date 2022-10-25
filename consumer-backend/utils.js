const { ClientCredentials } = require('simple-oauth2');

module.exports.oauthBearerProvider = (options) => {
  const client = new ClientCredentials({
    client: {
      id: options.clientId,
      secret: options.clientSecret
    },
    auth: {
      tokenHost: options.host,
      tokenPath: options.path
    }
  });

  let tokenPromise;
  let accessToken;

  async function refreshToken() {
    accessToken = await client.getToken({});

    try {
      if (accessToken == null) {
        accessToken = await client.getToken({});
      }

      if (accessToken.expired(options.refreshThresholdMs / 1000)) {
        accessToken = await accessToken.refresh();
      }

      const nextRefresh =
        accessToken.token.expires_in * 1000 - options.refreshThresholdMs;
      setTimeout(() => {
        tokenPromise = refreshToken();
      }, nextRefresh);

      return accessToken.token.access_token;
    } catch (error) {
      accessToken = null;
      throw error;
    }
  }

  tokenPromise = refreshToken();

  return async function () {
    return {
      value: await tokenPromise
    };
  };
};
