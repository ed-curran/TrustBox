import { CredentialPayload, Issue, Provider } from '../bundler/provider';
import { draftTrustDoc } from './createWeb5Publisher';
import { createWeb5, getWeb5, Web5Agent } from './createWeb5';
import { v4 as uuidv4 } from 'uuid';

// @ts-expect-error esm hacks
import type { ManagedKeyPair } from '@web5/agent';
// @ts-expect-error esm hacks
import { SignOptions } from '@web5/credentials';

export async function getWeb5Provider(web5Agent: Web5Agent): Promise<Provider> {
  // const { Ed25519, Jose } = await import('@web5/crypto');
  const { isManagedKeyPair } = await import('@web5/agent');
  const { Convert } = await import('@web5/common');
  const { VerifiableCredential, DEFAULT_CONTEXT, DEFAULT_VC_TYPE } =
    await import('@web5/credentials');

  const issueJwt = async (did: string, credential: CredentialPayload) => {
    //well this is a fucking mess
    //i think i should be getting the key from defaultSigningKey somehow
    const managedDid = await web5Agent.didManager.get({
      didRef: did,
      context: did,
    });

    const verificationMethodKey =
      managedDid?.keySet.verificationMethodKeys?.[0];
    const keyManagerId = verificationMethodKey?.keyManagerId;
    const kid = verificationMethodKey?.publicKeyJwk?.kid;
    const alg = verificationMethodKey?.publicKeyJwk?.alg;
    if (!keyManagerId || !kid || !alg) {
      throw Error('ruh roh');
    }

    const managedKey = await web5Agent.keyManager.getKey({
      keyRef: keyManagerId,
    });
    if (!managedKey || !isManagedKeyPair(managedKey)) {
      throw Error('ruh roh');
    }
    const managedKeyPair = managedKey as ManagedKeyPair;
    managedKeyPair.privateKey.algorithm;

    if (managedKeyPair.privateKey.algorithm.name !== 'EdDSA') {
      throw Error("can't sign jwt with key");
    }

    const sign = async (content: Uint8Array): Promise<Uint8Array> => {
      return await web5Agent.keyManager.sign({
        algorithm: managedKeyPair.privateKey.algorithm,
        data: content,
        keyRef: keyManagerId,
      });
    };

    const vc = new VerifiableCredential({
      '@context': credential['@context'] ?? [DEFAULT_CONTEXT],
      type: credential.type ?? [DEFAULT_VC_TYPE],
      id: credential.id ?? `urn:uuid:${uuidv4()}`,
      issuer: credential.issuer ?? did,
      issuanceDate: credential.issuanceDate
        ? dateTypeToString(credential.issuanceDate)
        : dateTypeToString(new Date()),
      credentialSubject: credential.credentialSubject ?? {},
      ...(credential.expirationDate && {
        expirationDate: dateTypeToString(credential.expirationDate),
      }), // optional property
    });

    const signOptions = {
      issuerDid: did,
      subjectDid: credential.credentialSubject?.id ?? '', //make subject credential subject id required? im not sure it is required tbh
      kid: `${did}#${verificationMethodKey.keyManagerId}`,
      signer: sign,
    };

    return createJwt({ vc: vc.vcDataModel }, signOptions);
  };
  //web5.js VerifiableCredential.sign() forces typ to be set in the header, which is forbidden in a linked domain credential
  //sooo thankfully its a small function and i just copied it here. wtf am i doing tbh.
  const createJwt = async (
    payload: Record<string, unknown>,
    signOptions: SignOptions,
  ) => {
    const { issuerDid, subjectDid, signer, kid } = signOptions;

    const header = { alg: 'EdDSA', kid: kid };

    const jwtPayload = {
      iss: issuerDid,
      sub: subjectDid,
      ...payload,
    };

    const encodedHeader = Convert.object(header).toBase64Url();
    const encodedPayload = Convert.object(jwtPayload).toBase64Url();
    const message = encodedHeader + '.' + encodedPayload;
    const messageBytes = Convert.string(message).toUint8Array();

    const signature = await signer(messageBytes);

    const encodedSignature = Convert.uint8Array(signature).toBase64Url();
    const jwt = message + '.' + encodedSignature;

    return jwt;
  };

  return {
    async did(alias: string, linkedDomain: string) {
      const web5Connection = await createWeb5(web5Agent, alias, linkedDomain);
      return web5Connection.did;
    },

    issueFormats: {
      jwt: issueJwt,
      jsonld: undefined,
    },

    //i'm not sure this should be in here
    //this needs to be passed the publisherDid
    async draftTrustDoc(did) {
      const web5Connection = await getWeb5(web5Agent, did);
      return draftTrustDoc(web5Connection);
    },
  };
}

function dateTypeToString(dateType: Date | string): string {
  if (typeof dateType === 'string') return dateType;
  // Omit the milliseconds part from toISOString() output
  return dateType.toISOString().replace(/\.\d+Z$/, 'Z');
}
