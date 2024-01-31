import { Entries, TrustEstablishmentDoc } from '../trustEstablishmentDoc';
import {
  tfParticipantSchema as tfMemberSchema,
  TrustFrameworkMember,
} from './generated/tfParticipant';
import {
  tfCredentialsSchema as tfCredentialsSchema,
  TrustFrameworkCredentials,
} from './generated/tfCredentials';
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { Result } from '../../symbolLoader';
import { tfIssuerSchema, TrustFrameworkIssuer } from './generated/tfIssuer';
import {
  tfVerifierSchema,
  TrustFrameworkVerifier,
} from './generated/tfVerifier';

const ajv = new Ajv();
addFormats(ajv);

export type TrustFrameworkDocEntries = {
  credentialsTopic: {
    owner: TrustFrameworkCredentials;
    [key: string]: TrustFrameworkCredentials;
  };
  memberTopic: Record<string, TrustFrameworkMember>;
  issuerTopic: Record<string, TrustFrameworkIssuer>;
  verifierTopic: Record<string, TrustFrameworkVerifier>;
};

//is this stupid?
export type TrustFrameworkDoc = TrustEstablishmentDoc<TrustFrameworkDocEntries>;

export type TrustFrameworkIndex = {
  self: string;
  entryPoint: string;
  credentialsTopic: string;
  memberTopic: string;
  issuerTopic: string;
  verifierTopic: string;
  api?: string;
};
export function parseTrustFrameworkDoc(
  trustEstablishmentDoc: TrustEstablishmentDoc,
  config: TrustFrameworkIndex,
): Result<TrustFrameworkDoc> {
  const author = trustEstablishmentDoc.author;
  //@ts-ignore
  const schema: JSONSchemaType<Entries> = {
    type: 'object',
    // patternProperties: {
    //   '\\w+:(/?/?)[^\\s]+': {
    //     type: 'object',
    //   },
    // },
    properties: {
      [config.credentialsTopic]: {
        type: 'object',
        // properties: {
        //   [author]: tfCredentialsSchema,
        // },
        required: [author],
        additionalProperties: tfCredentialsSchema,
      },
      [config.memberTopic]: {
        type: 'object',
        additionalProperties: tfMemberSchema,
      },
      [config.issuerTopic]: {
        type: 'object',
        additionalProperties: tfIssuerSchema,
      },
      [config.verifierTopic]: {
        type: 'object',
        additionalProperties: tfVerifierSchema,
      },
    },
    required: [config.credentialsTopic, config.memberTopic],
    additionalProperties: true,
  };
  const validate = ajv.compile(schema);
  const entries = trustEstablishmentDoc.entries;
  const transformedDoc = structuredClone(trustEstablishmentDoc);

  if (!validate(entries)) {
    return {
      status: 'failure',
      message: `failed to validate trust doc as trust framework: ${JSON.stringify(
        validate.errors,
      )}`,
    };
  }
  //gross but hopefully fast
  //rename credentials topic, also need to rename the trust assertion entry for the author inside of it
  const credentialsTopic = transformedDoc.entries[config.credentialsTopic]!;
  credentialsTopic['owner'] = credentialsTopic[trustEstablishmentDoc.author]!;
  delete credentialsTopic[trustEstablishmentDoc.author];

  transformedDoc.entries['credentialsTopic'] = credentialsTopic;
  delete transformedDoc.entries[config.credentialsTopic];

  //swap member topic
  transformedDoc.entries['memberTopic'] =
    transformedDoc.entries[config.memberTopic]!;
  delete transformedDoc.entries[config.memberTopic];

  //swap issuer topic
  transformedDoc.entries['issuerTopic'] =
    transformedDoc.entries[config.issuerTopic]!;
  delete transformedDoc.entries[config.issuerTopic];

  //swap verifier topic
  transformedDoc.entries['verifierTopic'] =
    transformedDoc.entries[config.verifierTopic]!;
  delete transformedDoc.entries[config.verifierTopic];

  return {
    status: 'success',
    value: transformedDoc as TrustFrameworkDoc,
  };
}
