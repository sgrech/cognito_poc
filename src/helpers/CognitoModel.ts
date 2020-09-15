import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
  IAuthenticationDetailsData,
  ICognitoUserPoolData,
  /* ICognitoUserData, */
} from "amazon-cognito-identity-js";


import { UserCredentials } from "../helpers/types";
import { CognitoUserFactory } from "./CognitoUserFactory";

export class CognitoModel {
  private user_pool: CognitoUserPool;
  private cognito_user: CognitoUser;

  constructor(email: string, pool_id: string, app_client_id: string) {
    const pool_data: ICognitoUserPoolData = {
      UserPoolId: pool_id,
      ClientId: app_client_id,
    };
    this.user_pool = new CognitoUserPool(pool_data);
    this.cognito_user = CognitoUserFactory.getInstance(
      email,
      this.user_pool
    ).cognito_user_instance;
  }

  private static userAttributeFactory(
    key: string,
    value: string
  ): CognitoUserAttribute {
    return new CognitoUserAttribute({
      Name: key,
      Value: value,
    });
  }

  updateUser(...attributes: [string, string][]): Promise<any> {
    const attribute_list = attributes.map(([key, value]) =>
      CognitoModel.userAttributeFactory(key, value)
    );
    return new Promise((resolve, reject) => {
      this.cognito_user.updateAttributes(attribute_list, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  getUserAttributes(): Promise<CognitoUserAttribute[]> {
    return new Promise((resolve, reject) => {
      this.cognito_user.getUserAttributes((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  confirmRegistration(confirm_code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.cognito_user.confirmRegistration(
        confirm_code,
        true,
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  resendConfirmation(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.cognito_user.resendConfirmationCode((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  deleteUser(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.cognito_user.deleteUser((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  authenticateuser(email: string, password: string): Promise<UserCredentials> {
    const authentication_data: IAuthenticationDetailsData = {
      Username: email,
      Password: password,
    };
    const authentication_details = new AuthenticationDetails(
      authentication_data
    );

    return new Promise((resolve, reject) => {
      this.cognito_user.authenticateUser(authentication_details, {
        onSuccess: (result) => {
          const user_credentials: UserCredentials = {
            access_token: result.getAccessToken().getJwtToken(),
            id_token: result.getIdToken().getJwtToken(),
            refresh_token: result.getRefreshToken().getToken(),
          };
          resolve(user_credentials);
        },
        onFailure: (err) => reject(err),
      });
    });
  }

  signupUser(
    email: string,
    password: string,
    ...attributes: [string, string][]
  ): Promise<CognitoUser> {
    const attribute_list = attributes.map(([key, value]) =>
      CognitoModel.userAttributeFactory(key, value)
    );

    return new Promise((resolve, reject) => {
      this.user_pool.signUp(
        email,
        password,
        attribute_list,
        [],
        (err, result) => {
          if (err) reject(err);
          else resolve(result?.user);
        }
      );
    });
  }
}
