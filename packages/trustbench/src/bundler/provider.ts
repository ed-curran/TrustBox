//this is going to be coupled to veramo/core types for now
//cus i cba to implement by own types for everything

// import { CredentialPayload } from "@veramo/core-types/src/types/vc-data-model";
import type {
  CredentialPayload,
  ProofFormat,
  VerifiableCredential,
  // @ts-expect-error
} from '@veramo/core';

export interface Provider {
  did(alias: string, method?: string): Promise<string>;

  //hacky todo remove this
  publisherDid(alias: string): Promise<string>;
  //will select an issuer based on the issuer.id field in the credential payload
  //yes this is kinda awkward
  issue(
    did: string,
    credential: CredentialPayload,
    proofType: ProofFormat
  ): Promise<VerifiableCredential>;

  //this creates a draft trust doc and returns the id
  //i'm not sure this should be there
  draftTrustDoc(did: string): Promise<{id: string, did: string}>

}
