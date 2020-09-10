/* const AmazonCognitoIdentity = require("amazon-cognito-identity-js"); */
/* import { AmazonCognitoIdentity } from "amazon-cognito-identity-js"; */
import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
  IAuthenticationDetailsData,
  ICognitoUserPoolData,
} from "amazon-cognito-identity-js";

import * as AWS from "aws-sdk/global";

import readline from "readline";

const iReadline = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const {
  APP_CLIENT_ID,
  POOL_ID,
  POOL_REGION,
} = process.env;

const pool_data: ICognitoUserPoolData  = {
  UserPoolId: POOL_ID || "",
  ClientId: APP_CLIENT_ID || "",
};

const user_pool = new CognitoUserPool(pool_data);

type UserCredentials = {
  access_token: string;
  id_token: string;
  refresh_token: string;
};

const console_input = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    iReadline.question(`${question} `, (answer: string) =>
      resolve(answer.trim())
    );
  });
};

const userAttributeFactory = function (
  key: string,
  value: string
): CognitoUserAttribute {
  return new CognitoUserAttribute({
    Name: key,
    Value: value,
  });
};

const cognitoUserFactory = function (
  username: string,
  user_pool: CognitoUserPool
): CognitoUser {
  const user_data = {
    Username: username,
    Pool: user_pool,
  };
  const cognito_user = new CognitoUser(user_data);
  return cognito_user;
};

const registerUser = (
  username: string,
  password: string,
  ...attributes: [string, string][]
): Promise<CognitoUser> => {
  return new Promise((resolve, reject) => {
    const attribute_list = attributes.map(([key, value]) =>
      userAttributeFactory(key, value)
    );

    user_pool.signUp(username, password, attribute_list, [], (err, result) => {
      if (err) reject(err);
      else resolve(result?.user);
    });
  });
};

const confirmRegistration = (
  email: string,
  confirm_code: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognito_user = cognitoUserFactory(email, user_pool);
    cognito_user.confirmRegistration(confirm_code, true, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const resendConfirmation = (username: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const cognito_user = cognitoUserFactory(username, user_pool);
    cognito_user.resendConfirmationCode((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const deleteUser = (email: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognito_user = cognitoUserFactory(email, user_pool);
    cognito_user.deleteUser((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const authenticateuser = (
  email: string,
  password: string
): Promise<UserCredentials> => {
  return new Promise((resolve, reject) => {
    const authentication_data: IAuthenticationDetailsData = {
      Username: email,
      Password: password,
    };
    const authentication_details = new AuthenticationDetails(
      authentication_data
    );
    const cognito_user = cognitoUserFactory(email, user_pool);
    cognito_user.authenticateUser(authentication_details, {
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
};

const run = async function () {
  try {
    if (process.argv.includes("register")) {
      const name = await console_input("Full Name:");
      const preferred_username = await console_input("Username:");
      const email = await console_input("Email:");
      const password = await console_input("Password:");
      const result = await registerUser(
        email,
        password,
        ["name", name],
        ["preferred_username", preferred_username]
      );
      console.log("User created succesfull");
    } else if (process.argv.includes("confirm")) {
      const email = await console_input("Email:");
      const confirm_code = await console_input("Confirmation Code:");
      const result = await confirmRegistration(email, confirm_code);
      console.log(result);
    } else if (process.argv.includes("delete")) {
      const email = await console_input("Email:");
      const password = await console_input("Password:");

      const result = await authenticateuser(email, password);
      console.log(result);
    } else {
      const answer = await console_input("Who are you?");
      console.log("You are: ", answer);
    }
    /* const user = await registerUser(); */
    /* console.log("Registered Successfully: ", user.getUsername()); */
    /* const result = await confirmRegistratoin() */
    /* console.log(result) */
  } catch (err) {
    console.log(err);
  } finally {
    iReadline.close();
  }
};

run();
