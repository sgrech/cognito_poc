/* const AmazonCognitoIdentity = require("amazon-cognito-identity-js"); */
/* import { AmazonCognitoIdentity } from "amazon-cognito-identity-js"; */
import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
  IAuthenticationDetailsData,
  ICognitoUserPoolData,
  CognitoUserSession,
  ICognitoUserData,
} from "amazon-cognito-identity-js";

enum Action {
  REGISTER_USER = 1,
  CONFIRM_REGISTRATION,
  RESEND_CONFIRMATION,
  AUTHENTICATE,
  DELETE,
  EXIT,
}

import readline from "readline";

const iReadline = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class Menu {
  private menu: string = "";

  static init() {
    return new Menu();
  }

  addMenuItem(item: [number, string]): Menu {
    const [key, value] = item;
    this.menu = `${this.menu}${key}) ${value}\n`;
    return this;
  }

  get menu_list() {
    return `${this.menu}>`;
  }
}

const { APP_CLIENT_ID, POOL_ID } = process.env;

const pool_data: ICognitoUserPoolData = {
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

class CognitoUserFactory {
  private static instance: CognitoUserFactory;
  private cognito_user: CognitoUser;

  private constructor(user_data: ICognitoUserData) {
    this.cognito_user = new CognitoUser(user_data);
  }

  get cognito_user_instance() {
    return this.cognito_user;
  }

  static init(email: string, user_pool: CognitoUserPool) {
    if (!CognitoUserFactory.instance) {
      const user_data = {
        Username: email,
        Pool: user_pool,
      };
      this.instance = new CognitoUserFactory(user_data);
    }
  }

  static getInstance() {
    if (CognitoUserFactory.instance) {
      return this.instance;
    } else {
      throw { message: "Congnito User instance not found" };
    }
  }
}

const registerUser = (
  email: string,
  password: string,
  ...attributes: [string, string][]
): Promise<CognitoUser> => {
  return new Promise((resolve, reject) => {
    const attribute_list = attributes.map(([key, value]) =>
      userAttributeFactory(key, value)
    );

    user_pool.signUp(email, password, attribute_list, [], (err, result) => {
      if (err) reject(err);
      else resolve(result?.user);
    });
  });
};

const confirmRegistration = (
  confirm_code: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognito_user = CognitoUserFactory.getInstance().cognito_user_instance;
    cognito_user.confirmRegistration(confirm_code, true, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const resendConfirmation = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const cognito_user = CognitoUserFactory.getInstance().cognito_user_instance;
    cognito_user.resendConfirmationCode((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const deleteUser = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognito_user = CognitoUserFactory.getInstance().cognito_user_instance;
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
    const cognito_user = CognitoUserFactory.getInstance().cognito_user_instance;
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
  const email = await console_input("Email:");
  CognitoUserFactory.init(email, user_pool);

  let action = -1;
  while (action !== Action.EXIT) {
    const current_action = action
    action = -1;
    try {
      if (current_action === Action.REGISTER_USER) {
        const name = await console_input("Full Name:");
        const preferred_username = await console_input("Username:");
        const password = await console_input("Password:");
        const result = await registerUser(
          email,
          password,
          ["name", name],
          ["preferred_username", preferred_username]
        );
        console.log(result);
      } else if (current_action === Action.CONFIRM_REGISTRATION) {
        const confirm_code = await console_input("Confirmation Code:");
        const result = await confirmRegistration(confirm_code);
        console.log(result);
      } else if (current_action === Action.RESEND_CONFIRMATION) {
        const result = await resendConfirmation();
        console.log(result);
      } else if (current_action === Action.AUTHENTICATE) {
        const password = await console_input("Password:");
        const auth_result = await authenticateuser(email, password);
        console.log(auth_result);
      } else if (current_action === Action.DELETE) {
        const delete_result = await deleteUser();
        console.log(delete_result);
      } else {
        let menu = Menu.init()
          .addMenuItem([Action.REGISTER_USER, "Register"])
          .addMenuItem([Action.CONFIRM_REGISTRATION, "Confirm Registration"])
          .addMenuItem([Action.RESEND_CONFIRMATION, "Resend Confirmation"])
          .addMenuItem([Action.AUTHENTICATE, "Authenticate"])
          .addMenuItem([Action.DELETE, "Delete Account"])
          .addMenuItem([Action.EXIT, "Exit"]).menu_list;
        let result = await console_input(menu);
        action = +result;
      }
    } catch (err) {
      console.log(err);
    }
  }
  iReadline.close();
};

run();
