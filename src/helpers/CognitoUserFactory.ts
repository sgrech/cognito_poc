import {
  CognitoUserPool,
  CognitoUser,
  ICognitoUserData,
} from "amazon-cognito-identity-js";

export class CognitoUserFactory {
  private static instance: CognitoUserFactory;
  private cognito_user: CognitoUser;

  private constructor(user_data: ICognitoUserData) {
    this.cognito_user = new CognitoUser(user_data);
  }

  get cognito_user_instance() {
    return this.cognito_user;
  }

  static getInstance(email: string, user_pool: CognitoUserPool) {
    if (!CognitoUserFactory.instance) {
      const user_data = {
        Username: email,
        Pool: user_pool,
      };
      this.instance = new CognitoUserFactory(user_data);
    }
    return this.instance;
  }
}
