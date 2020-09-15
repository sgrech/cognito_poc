export interface UserCredentials {
  access_token: string;
  id_token: string;
  refresh_token: string;
}

export interface AwsJwtKey {
  alg: string;
  e: string;
  kid: string;
  kty: "RSA";
  n: string;
  use: string;
}

interface DecodedTokenPayload {
  sub: string;
  event_id: string;
  token_use: string;
  auth_time: number;
  iss: string;
  exp: number;
  iat: number;
}

interface DecodedIdTokenPayload extends DecodedTokenPayload {
  aud: string;
  name: string;
  preffered_username: string;
  email: string;
}

interface DecodedAccessTokenPayload extends DecodedTokenPayload {
  scope: string;
  jti: string;
  client_id: string;
  username: string;
}


export interface DecodedToken {
  header: {
    kid: string;
    alg: string;
  };
  signature: string;
}

export interface DecodedIdToken extends DecodedToken {
  payload: DecodedIdTokenPayload;
}

export interface DecodedAccessToken extends DecodedToken {
  payload: DecodedAccessTokenPayload;
}
