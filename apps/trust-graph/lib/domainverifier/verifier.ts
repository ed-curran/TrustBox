//from https://github.com/Sphereon-Opensource/wellknown-did-client/blob/develop/test/resources/verifiers/VcJsVerifier.ts
import type {
  IVerifyCallbackArgs} from '@sphereon/wellknown-dids-client';
import {
  ProofFormatTypesEnum,
  WellKnownDidVerifier,
} from '@sphereon/wellknown-dids-client';
import type { VeramoAgent } from './veramo-agent';
import { veramoAgent } from './veramo-agent';

export function getVerifyCredentialCallback(agent: VeramoAgent) {
  return async (args: IVerifyCallbackArgs) => {
    //can't verify JSON-LD yet
    if (args.proofFormat === ProofFormatTypesEnum.JSON_LD) {
      return {
        verified: false,
      };
    }
    try {
      const result = await agent.verifyCredential({
        credential: args.credential,
      });
      return {
        verified: result.verified,
      };
    } catch (e) {
      return {
        verified: false,
      };
    }
  };
}

export const newVerifier = () => {
  const agent = veramoAgent();
  const verify = getVerifyCredentialCallback(agent);
  return new WellKnownDidVerifier({ verifySignatureCallback: verify });
};
