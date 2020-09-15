export type UserCredentials = {
  access_token: string;
  id_token: string;
  refresh_token: string;
};

export type AwsJwtKey = {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}

export type JwtPem = {
  key_id: string;
  modulus: string;
  exponent: string;
  key_type: string;
  jwk: {
    key_type: string;
    modulus: string;
    exponent: string;
  }
  pem: string;
}
