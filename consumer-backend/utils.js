const { Issuer } = require("openid-client");

module.exports.oauthBearerProvider = (options) => {
  const issuer = new Issuer({
    token_endpoint: options.tokenEndpointURL
  });

  const client = new issuer.Client({
    client_id: options.clientId,
    client_secret: options.clientSecret,
  });

  let tokenPromise;
  let tokenSet;

  async function refreshToken() {
    let tokenExpiresAt;
    let tokenExpiresInMs;
    const nowDate = new Date();
    try {
      if (!isDefined(tokenSet)) {
        tokenSet = await client.grant({ grant_type: "client_credentials" });
      }

      tokenExpiresAt = new Date(tokenSet.expires_at * 1000);
      tokenExpiresInMs = tokenExpiresAt - nowDate;

      if (tokenExpiresInMs <= options.refreshThresholdMs) {
        tokenSet = await client.grant({ grant_type: "client_credentials" });
        tokenExpiresAt = new Date(tokenSet.expires_at * 1000);
        tokenExpiresInMs = tokenExpiresAt - nowDate;
      }

      const nextRefresh = tokenExpiresInMs - options.refreshThresholdMs;

      setTimeout(() => {
        tokenPromise = refreshToken();
      }, nextRefresh);

      return tokenSet.access_token;
    } catch (error) {
      tokenSet = null;
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

function isDefined(x) {
  return !(typeof x === "undefined" || x === null);
}
