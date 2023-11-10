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
    async issue(did: string, credential, proofFormat) {
      //we need to set the kid in the jwt ourselves. so we first need to find a kid for this did
      //and also pass it as the keyref
      //we don't care about what key atm, so just grab the first we find for this did
      const identifier = await agent.didManagerGet({did})
      const key = identifier.keys[0]
      if(!key) {
        throw Error("ruh roh")
      }

      if(proofFormat === 'jwt') {
        const result = await agent.createVerifiableCredential({
          //we need removeOriginalFields to be true, because having any of the original fields in the json payload (outside the vc field) is not permitted
          //in a domain linked credential, and veramo requires us to provide at least the issuer in the credential field.
          //however its very annoying because by default this will remove the credentialSubject.id field and the issuanceDate and expirationDate
          //which we DO want, so below is a bunch of workarounds for htat
          removeOriginalFields: true,
          credential: {
            //by passing the credential explicitly as the vc field we can ensure everything gets included (required things like issuanceDate)
            //even when removeOriginalFields deletes some stuff
            vc: credential,
            //if sub is set, then credentialSubject.id won't be removed
            sub: did,
            //think we need to include only the issuer really, but just putting the whole credential here for good measure
            ...credential,
          },
          proofFormat: 'jwt',
          //we must include kid manually in the header,
          //we can trick veramo into not putting "typ" in the header by providing a value that evaluates truthy
          //but doesn't get serialised to anything
          header: {
            kid: key.kid, typ: () => {
            }
          },
          //need keyRef to match our explicitly set kid
          keyRef: key.kid
        });
        return result.proof.jwt
      }

      return await agent.createVerifiableCredential({
        credential: credential,
        proofFormat: proofFormat
      })
    },
  };
}
