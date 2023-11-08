import { VeramoAgent } from './veramoAgent';
import { Provider } from '../bundler/provider';

export function getProvider(agent: VeramoAgent): Provider {
  return {
    async did(alias: string, method: string) {
      const identifier = await agent.didManagerCreate({
        alias: alias,
        provider: method,
      });
      return identifier.did;
    },
    async issue(credential, proofFormat) {
      return agent.createVerifiableCredential({
        credential: credential,
        proofFormat,
      });
    },
  };
}
