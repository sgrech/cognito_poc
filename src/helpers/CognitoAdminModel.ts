import { CognitoIdentityServiceProvider } from "aws-sdk";
import {
  DeliveryMediumTypes,
  ChallengeTypes,
  AuthFlowTypes,
  ChallengeResponseTypes,
} from "../helpers/constants";

type AdminCreateUserResponse = CognitoIdentityServiceProvider.AdminCreateUserResponse;
type AdminCreateUserRequest = CognitoIdentityServiceProvider.AdminCreateUserRequest;
type AdminDeleteUserRequest = CognitoIdentityServiceProvider.AdminDeleteUserRequest;
type ChangePasswordResponse = CognitoIdentityServiceProvider.ChangePasswordResponse;
type ChangePasswordRequest = CognitoIdentityServiceProvider.ChangePasswordRequest;
type InitiateAuthResponse = CognitoIdentityServiceProvider.InitiateAuthResponse;
type InitiateAuthRequest = CognitoIdentityServiceProvider.InitiateAuthRequest;
type RespondToAuthChallengeResponse = CognitoIdentityServiceProvider.RespondToAuthChallengeResponse;
type RespondToAuthChallengeRequest = CognitoIdentityServiceProvider.RespondToAuthChallengeRequest;

export class CognitoAdminModel {
  private cognito_identity_service_provider: CognitoIdentityServiceProvider;

  constructor(private pool_id: string, private app_client_id: string) {
    this.cognito_identity_service_provider = new CognitoIdentityServiceProvider();
  }

  static getChallengeResponses(
    challenge_name: ChallengeTypes,
    has_client_secret = false
  ): Array<ChallengeResponseTypes> {
    const {
      SMS_MFA_CODE,
      USERNAME,
      SECRET_HASH,
      PASSWORD_CLAIM_SIGNATURE,
      PASSWORD_CLAIM_SECRET_BLOCK,
      PASSWORD,
      NEW_PASSWORD,
      TIMESTAMP,
    } = ChallengeResponseTypes;
    const challenge_responses: Array<ChallengeResponseTypes> = [];
    if (challenge_name === ChallengeTypes.SMS_MFA) {
      challenge_responses.push(SMS_MFA_CODE, USERNAME);
    } else if (challenge_name === ChallengeTypes.PASSWORD_VERIFIER) {
      challenge_responses.push(
        PASSWORD_CLAIM_SIGNATURE,
        PASSWORD_CLAIM_SECRET_BLOCK,
        TIMESTAMP,
        USERNAME
      );
    } else if (challenge_name === ChallengeTypes.ADMIN_NO_SRP_AUTH) {
      challenge_responses.push(PASSWORD, USERNAME);
    } else if (challenge_name === ChallengeTypes.NEW_PASSWORD_REQUIRED) {
      challenge_responses.push(NEW_PASSWORD, USERNAME);
    }
    if (has_client_secret) {
      challenge_responses.push(SECRET_HASH);
    }
    return challenge_responses;
  }

  adminCreateUser(
    email: string,
    ...attributes: [string, string][]
  ): Promise<AdminCreateUserResponse> {
    const attribute_list = attributes.map(([key, value]) => ({
      Name: key,
      Value: value,
    }));

    const params: AdminCreateUserRequest = {
      UserPoolId: this.pool_id,
      Username: email,
      UserAttributes: attribute_list,
      DesiredDeliveryMediums: [DeliveryMediumTypes.EMAIL],
    };

    return new Promise((resolve, reject) => {
      this.cognito_identity_service_provider.adminCreateUser(params, function (
        err,
        result
      ) {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  adminDeleteUser(email: string): Promise<void> {
    const params: AdminDeleteUserRequest = {
      UserPoolId: this.pool_id,
      Username: email,
    };

    return new Promise((resolve, reject) => {
      this.cognito_identity_service_provider.adminDeleteUser(params, function (
        err
      ) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  changePassword(
    access_token: string,
    previous_password: string,
    proposed_password: string
  ): Promise<ChangePasswordResponse> {
    const params: ChangePasswordRequest = {
      AccessToken: access_token,
      PreviousPassword: previous_password,
      ProposedPassword: proposed_password,
    };

    return new Promise((resolve, reject) => {
      this.cognito_identity_service_provider.changePassword(params, function (
        err,
        result
      ) {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  initiateAuth(email: string, password: string): Promise<InitiateAuthResponse> {
    const params: InitiateAuthRequest = {
      AuthFlow: AuthFlowTypes.USER_PASSWORD_AUTH,
      ClientId: this.app_client_id,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    return new Promise((resolve, reject) => {
      this.cognito_identity_service_provider.initiateAuth(params, function (
        err,
        result
      ) {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  respondToAuthChallenge(
    challenge_name: ChallengeTypes,
    session: string,
    ...required_responses: [ChallengeResponseTypes, string][]
  ): Promise<RespondToAuthChallengeResponse> {
    const challenge_responses = required_responses.reduce(
      (challenge_responses, [key, value]) => {
        challenge_responses = { ...challenge_responses, [key]: value };
        return challenge_responses;
      },
      {}
    );
    const params: RespondToAuthChallengeRequest = {
      ChallengeName: challenge_name,
      ClientId: this.app_client_id,
      Session: session,
      ChallengeResponses: challenge_responses,
    };

    return new Promise((resolve, reject) => {
      this.cognito_identity_service_provider.respondToAuthChallenge(
        params,
        function (err, result) {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }
}
