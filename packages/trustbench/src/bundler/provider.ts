//this is going to be coupled to veramo/core types for now
//cus i cba to implement by own types for everything

// import { CredentialPayload } from "@veramo/core-types/src/types/vc-data-model";
import type {
  CredentialPayload as VeramoCredentialPayload,
  ProofFormat,
  VerifiableCredential as VeramoVerifiableCredential,
  // @ts-expect-error it's okay because we're only importing type
} from '@veramo/core';

export type VerifiableCredential = VeramoVerifiableCredential;
export type CredentialPayload = VeramoCredentialPayload;

//i dunno why i bother with this stuff really i guess it makes me feel smart
export type IssueOutput<T extends ProofFormat> = T extends 'jwt'
  ? string
  : VerifiableCredential;
export type Issue<T extends ProofFormat> = (
  did: string,
  credential: CredentialPayload,
) => Promise<IssueOutput<T>>;
type IssueFormats = {
  jwt: Issue<'jwt'> | undefined;
  jsonld: Issue<'lds'> | undefined;
};

export function issueAsFormat<T extends ProofFormat>(
  vcFormat: T,
  issueFormats: IssueFormats,
): Issue<T> | undefined {
  switch (vcFormat) {
    case 'jwt': {
      return issueFormats.jwt as Issue<typeof vcFormat>;
    }
    case 'lds': {
      return issueFormats.jsonld as Issue<typeof vcFormat>;
    }

    default:
      return undefined;
  }
}

export interface Provider {
  did(
    alias: string,
    linkedDomain: string | undefined,
    method?: string,
  ): Promise<string>;

  issueFormats: IssueFormats;

  //this creates a draft trust doc and returns the id
  //i'm not sure this should be there
  draftTrustDoc?: (did: string) => Promise<{ id: string; did: string }>;
}
