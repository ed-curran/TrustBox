import { Entries, TrustEstablishmentDoc } from '../trustEstablishmentDoc';
import {
  MemberOfPDTF,
  pdtfParticipantSchema as tfMemberSchema,
} from './generated/pdtfParticipant';
import {
  CredentialsOfThePDTF,
  pdtfCredentialsSchema as tfCredentialsSchema,
} from './generated/pdtfCredentials';
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { Result } from '../../symbolLoader';

const ajv = new Ajv();
addFormats(ajv);

export type TrustFrameworkDocEntries = {
  credentialsTopic: {
    owner: CredentialsOfThePDTF;
    [key: string]: CredentialsOfThePDTF;
  };
  memberTopic: Record<string, MemberOfPDTF>;
};

//is this stupid?
export type TrustFrameworkDoc = TrustEstablishmentDoc<TrustFrameworkDocEntries>;

export type TrustFrameworkIndex = {
  self: string;
  entryPoint: string;
  credentialsTopic: string;
  memberTopic: string;
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
  const memberTopic = transformedDoc.entries[config.memberTopic]!;
  transformedDoc.entries['memberTopic'] = memberTopic;
  delete transformedDoc.entries[config.memberTopic];

  const credentialsTopic = transformedDoc.entries[config.credentialsTopic]!;
  credentialsTopic['owner'] = credentialsTopic[trustEstablishmentDoc.author]!;
  delete credentialsTopic[trustEstablishmentDoc.author];

  transformedDoc.entries['credentialsTopic'] = credentialsTopic;
  delete transformedDoc.entries[config.credentialsTopic];

  return {
    status: 'success',
    value: transformedDoc as TrustFrameworkDoc,
  };
}
