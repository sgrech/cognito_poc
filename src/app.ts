import { CognitoAdminModel } from "./helpers/CognitoAdminModel";
import { Menu } from "./helpers/Menu";
import { Jwt } from "./helpers/Jwt";
import { ReadlineFactory } from "./helpers/ReadlineFactory";
import {
  Actions,
  ChallengeTypes,
  ChallengeResponseTypes,
} from "./helpers/constants";

const {
  APP_CLIENT_ID: app_client_id = "",
  POOL_ID: pool_id = "",
  AWS_REGION: aws_region = "",
} = process.env;

let refresh_token: string;
let access_token: string;
let id_token: string;

const run = async function () {
  const read_line = ReadlineFactory.getInstance();
  const cognitoAdmin = new CognitoAdminModel(pool_id, app_client_id);
  const jwt = await Jwt.initialize(aws_region, pool_id);

  let action = -1;
  while (action !== Actions.EXIT) {
    const current_action = action;
    action = -1;
    try {
      if (current_action === Actions.CREATE_USER) {
        const name = await read_line.readQuestion("Full Name:");
        const preferred_username = await read_line.readQuestion("Username:");
        const email = await read_line.readQuestion("Email:");
        const result = await cognitoAdmin.adminCreateUser(
          email,
          ["name", name],
          ["preferred_username", preferred_username]
        );
        console.log(result);
      } else if (current_action === Actions.DELETE_USER) {
        const email = await read_line.readQuestion("Email:");
        const result = await cognitoAdmin.adminDeleteUser(email);
        console.log(result);
      } else if (current_action === Actions.AUTH_USER) {
        const email = await read_line.readQuestion("Email:");
        const password = await read_line.readQuestion("Password:");
        let result = await cognitoAdmin.initiateAuth(email, password);
        console.log(result);
        const { Session: session, ChallengeName: challenge_name } = result;
        if (challenge_name && session) {
          const required_challenge_responses = CognitoAdminModel.getChallengeResponses(
            challenge_name as ChallengeTypes
          );
          const required_responses: [ChallengeResponseTypes, string][] = [];
          for (const required_challenge of required_challenge_responses) {
            const challenge_response = await read_line.readQuestion(
              `${required_challenge}: `
            );
            required_responses.push([
              required_challenge as ChallengeResponseTypes,
              challenge_response,
            ]);
          }
          result = await cognitoAdmin.respondToAuthChallenge(
            challenge_name as ChallengeTypes,
            session,
            ...required_responses
          );
        }
        const { AuthenticationResult } = result;

        if (AuthenticationResult?.RefreshToken) {
          refresh_token = AuthenticationResult.RefreshToken;
        }
        if (AuthenticationResult?.IdToken) {
          id_token = AuthenticationResult.IdToken;
        }
        if (AuthenticationResult?.AccessToken) {
          access_token = AuthenticationResult.AccessToken;
        }
      } else if (current_action === Actions.DECODE_ACCESS_TOKEN) {
        const token = jwt.decodeAccessToken(access_token);
        const is_valid = await jwt.verifyToken(access_token, token);
        console.log(is_valid);
        console.log(token);
      } else if (current_action === Actions.DECODE_ID_TOKEN) {
        const token = jwt.decodeIdToken(id_token);
        const is_valid = await jwt.verifyToken(id_token, token);
        console.log(is_valid);
        console.log(token);
      } else {
        const menu = Menu.init()
          .addMenuItem([Actions.CREATE_USER, "Create user"])
          .addMenuItem([Actions.DELETE_USER, "Delete user"])
          .addMenuItem([Actions.AUTH_USER, "Auth user"])
          .addMenuItem([Actions.DECODE_ACCESS_TOKEN, "Decode Access Token"])
          .addMenuItem([Actions.DECODE_ID_TOKEN, "Decode Id Token"])
          .addMenuItem([Actions.EXIT, "Exit"]).menu_list;
        const result = await read_line.readQuestion(menu);
        action = +result;
      }
    } catch (err) {
      console.log(err);
    }
  }
};

run();
