import get, { AxiosResponse } from "axios";

export class Jwt {
  static async getJwks(
    pool_region: string,
    pool_id: string
  ): Promise<AxiosResponse> {
    const response = await get(
      `https://cognito-idp.${pool_region}.amazonaws.com/${pool_id}/.well-known/jwks.json`
    );
    return response;
  }
}
