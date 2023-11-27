import { VeramoAgent } from './createVeramoAgent';
import {
  CredentialPayload,
  Issue,
  Provider,
  IssueOutput,
} from '../bundler/provider';

export function getVeramoProvider(agent: VeramoAgent): Provider {
  //is this weird? probably
  const issueJwt = async (
    did: string,
    credential: CredentialPayload,
  ): Promise<string> => {
    //we need to set the kid in the jwt ourselves. so we first need to find a kid for this did
    //and also pass it as the keyref
    //we don't care about what key atm, so just grab the first we find for this did
    const identifier = await agent.didManagerGet({ did });
    const key = identifier.keys[0];
    if (!key) {
      throw Error('ruh roh');
    }

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
        kid: key.kid,
        typ: () => {},
      },
      //need keyRef to match our explicitly set kid
      keyRef: key.kid,
    });
    return result.proof.jwt;
  };

  return {
    async did(alias: string, linkedDomain: string, method: string) {
      const identifier = await agent.didManagerCreate({
        alias: alias,
        provider: method,
      });
      return identifier.did;
    },
    issueFormats: {
      jwt: issueJwt,
      jsonld: (did, credential) =>
        agent.createVerifiableCredential({
          credential: credential,
          proofFormat: 'lds',
        }),
    },
  };
}
