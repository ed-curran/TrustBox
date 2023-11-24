import { VeramoAgent } from './createVeramoAgent';
import { Provider } from '../bundler/provider';
import {draftTrustDoc} from '../web5/createWeb5Publisher'
import {createWeb5, getWeb5, Web5Agent} from '../web5/createWeb5'

export function getProvider(agent: VeramoAgent, web5Agent: Web5Agent): Provider {
  return {
    async did(alias: string, method: string) {
      const identifier = await agent.didManagerCreate({
        alias: alias,
        provider: method,
      });
      return identifier.did;
    },
    async publisherDid(alias: string) {
      const web5Connection = await createWeb5(web5Agent, alias)
      return web5Connection.did;
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
    //i'm not sure this should be in here
    //this needs to be passed the publisherDid
    async draftTrustDoc(did) {
      const web5Connection = await getWeb5(web5Agent, did)
      // const stuff = await agent.didManagerGet({did})
      // console.log(stuff)
      // for(const key of stuff.keys) {
      //   const found = await agent.keyManagerGet()
      //   console.log(found)
      // }
      return draftTrustDoc(web5Connection)
    }
  };
}
