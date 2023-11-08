//this is going to be coupled to veramo/core types for now
//cus i cba to implement by own types for everything

// import { CredentialPayload } from "@veramo/core-types/src/types/vc-data-model";
import type {
  CredentialPayload,
  ProofFormat,
  VerifiableCredential,
} from '@veramo/core';

export interface Provider {
  did(alias: string, method?: string): Promise<string>;
  //will select an issuer based on the issuer.id field in the credential payload
  //yes this is kinda awkward
  issue(
    credential: CredentialPayload,
    proofType: ProofFormat
  ): Promise<VerifiableCredential>;
}
