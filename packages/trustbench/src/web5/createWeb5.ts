//Node 18 users: the following 3 lines are needed
import { webcrypto } from 'node:crypto';
// @ts-expect-error hacky esm type import stuff
import type { Web5ManagedAgent } from '@web5/agent';
// @ts-expect-error hacky esm type import stuff
import type { IdentityAgent } from '@web5/identity-agent';
import type {
  Web5,
  // @ts-expect-error this will error because we shouldn't be importing an esm only package
  // but since we just want the types, this actually works.
} from '@web5/api';

// @ts-expect-error web5.js need this when running in node
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const DEFAULT_STORE_DIR_NAME = 'web5data';
function storeDirName(environmentName?: string) {
  if (!environmentName) return DEFAULT_STORE_DIR_NAME;
  return `${DEFAULT_STORE_DIR_NAME}-${environmentName}`;
}
//this returns a multitenant thing
export async function createWeb5Agent(
  kmsSecretKey: string,
  environmentName?: string,
): Promise<IdentityAgent> {
  //im using the "IdentityAgent" here instead of "UserAgent", currently they seem to be identical anyway.
  //I guessed that they intend to diverge and that IdentityAgent might be more suitable for me
  //but no idea really
  const { IdentityAgent } = await import('@web5/identity-agent');
  const { AppDataVault, DwnManager, SyncManagerLevel } = await import(
    '@web5/agent'
  );
  const { LevelStore } = await import('@web5/common');
  const { DidResolver, DidIonMethod, DidKeyMethod } = await import(
    '@web5/dids'
  );
  const storeDir = storeDirName(environmentName);
  //need to initialise a bunch of the dependencies ourselves so we can control the storage dir
  const appData = new AppDataVault({
    store: new LevelStore(`${storeDir}/agent/vault`),
  });
  const didResolver = new DidResolver({
    didResolvers: [DidIonMethod, DidKeyMethod],
  });
  //in the vanilla IdentityAgent, DwnManager uses a different dir to the appData store
  //here i'm putting them in the same like the UserAgent does. I don't know if thats bad.
  const dwnManager = await DwnManager.create({
    didResolver,
    dataPath: `${storeDir}/agent`,
  });
  const syncManager = new SyncManagerLevel({ dataPath: `${storeDir}/agent` });

  //create or get existing agent
  const agent = await IdentityAgent.create({
    appData,
    dwnManager,
    syncManager,
  });
  //make sure we use our kmsSecretKey loaded from the environment as passphrase
  await agent.start({ passphrase: kmsSecretKey });
  return agent;
}

export type Web5Agent = Web5ManagedAgent;
export type Web5Connection = { web5: Web5; did: string };
//creates a new did/identity for the provided agent
//and returns a single tenant thing scoped to that did
export async function createWeb5(
  agent: Web5Agent,
  name: string = 'default',
  linkedDomain: string | undefined,
): Promise<Web5Connection> {
  const { Web5 } = await import('@web5/api');
  const { DidIonMethod } = await import('@web5/dids');

  //todo update this when dwn endpoints are done properly

  //using our own hosted dwn
  //this lets us freeze the version of the remote dwn to match our client
  //which is useful because there's lots of breaking changes rn during pre v1
  //really, this should be configurable by trustbench users
  const trustboxEndpointNodes = [
    'https://trustbox-dwn-production.up.railway.app',
  ];
  const serviceEndpointNodes = new Array<string>();
  for (const endpoint of trustboxEndpointNodes) {
    try {
      const healthCheck = await fetch(`${endpoint}/health`);
      if (healthCheck.ok) {
        serviceEndpointNodes.push(endpoint);
      }
    } catch (error: unknown) {
      // Ignore healthcheck failures and try the next node.
    }
  }

  // Generate ION DID service and key set.
  const didOptions = await DidIonMethod.generateDwnOptions({
    serviceEndpointNodes,
  });

  if (linkedDomain) {
    didOptions.services?.push({
      id: '#domain', //what should this be?
      type: 'LinkedDomains',
      serviceEndpoint: linkedDomain,
    });
  }
  const identity = await agent.identityManager.create({
    name: name,
    didMethod: 'ion',
    didOptions,
    kms: 'local',
  });

  /** Import the Identity metadata to the User Agent's tenant so that it can be restored
   * on subsequent launches or page reloads. */
  await agent.identityManager.import({ identity, context: agent.agentDid });

  //call connect with agent and did from above
  //todo should import existing did key managed by veramo
  return await Web5.connect({
    sync: 'off',
    agent,
    connectedDid: identity.did,
  });
}

export async function getWeb5(
  agent: Web5Agent,
  connectedDid: string,
): Promise<Web5Connection> {
  //this gets called somewhat frequently so its annoying we do an import here
  const { Web5 } = await import('@web5/api');
  return Web5.connect({ agent, connectedDid });
}
