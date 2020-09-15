import get, { AxiosResponse } from "axios";
import {
  AwsJwtKey,
  DecodedIdToken,
  DecodedAccessToken,
  DecodedToken,
} from "../helpers/types";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

export class Jwt {
  private pems: { [key_id: string]: string };

  private constructor(aws_jwt_keys: Array<AwsJwtKey>) {
    this.pems = aws_jwt_keys.reduce((pems, aws_jwt_key) => {
      const key_id = aws_jwt_key.kid;
      const modulus = aws_jwt_key.n;
      const exponent = aws_jwt_key.e;
      const key_type = aws_jwt_key.kty;
      const pem: jwkToPem.RSA = {
        kty: key_type,
        n: modulus,
        e: exponent,
      };
      pems = { ...pems, [key_id]: jwkToPem(pem) };
      return pems;
    }, {});
  }

  decodeIdToken(token: string): DecodedIdToken {
    const decodedJwt = jwt.decode(token, { complete: true }) as DecodedIdToken;
    return decodedJwt;
  }

  decodeAccessToken(token: string): DecodedAccessToken {
    const decodedJwt = jwt.decode(token, {
      complete: true,
    }) as DecodedAccessToken;
    return decodedJwt;
  }

  verifyToken(token: string, decoded_jwt: DecodedToken): Promise<boolean> {
    const key_id = decoded_jwt.header.kid;
    const pem = this.pems[key_id];

    return new Promise((resolve) => {
      jwt.verify(token, pem, (err, _) => {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  static async initialize(pool_region: string, pool_id: string): Promise<Jwt> {
    const aws_jwks = await get(
      `https://cognito-idp.${pool_region}.amazonaws.com/${pool_id}/.well-known/jwks.json`
    );
    const aws_jwt_keys: Array<AwsJwtKey> = aws_jwks.data.keys;
    return new Jwt(aws_jwt_keys);
  }
}
