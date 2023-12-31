import { Entries, TrustEstablishmentDoc } from 'trustlib';
import { LoadedEntity } from '../symbolLoader';
import { Subject, SymbolMetadata } from '../symbol';
import { DidConfigurationConfig, EntityConfig } from '../environment';
import { v4 as uuidv4 } from 'uuid';
import { issueAsFormat, Provider } from './provider';
import {
  IIssueCallbackArgs,
  IIssueDomainLinkageCredentialArgs,
  ISignedDomainLinkageCredential,
  ProofFormatTypesEnum,
  WellKnownDidIssuer,
} from '@sphereon/wellknown-dids-client';

type EntityContext = {
  name: string;
  did: string;
  origin: string | undefined;
  //we're duplicating environment config into here and it seems dumb, why are we not just passing environment through
  didConfiguration: DidConfigurationConfig | boolean | undefined;
  additionalOutDir: string | undefined;
  //this feels wrong tbh
  subjects: {
    id: string;
    entries: Subject;
  }[];

  //hacky temporary field to handle web5 instance using a different did
  //todo: either get veramo and web5 to use the same did
  //or add proper multi did support
  publisherDid?: string;
};

export type TrustDocContext = {
  id: string;
  publisherDid: string | undefined;
  version: string;
};
export type Context = {
  environmentName: string;
  entities: Map<string, EntityContext>;
  topics: Map<
    string,
    {
      id: string;
    }
  >;
  trustDocs: Map<string, TrustDocContext>;
  publishWithWeb5: boolean;
};

export type Environment = {
  name: string;
  publishWithWeb5: boolean;
  kmsSecretKey: string;
  entities: Map<string, EntityConfig>;
};

//todo should probably make this a proper union
//but its okay for now cus value doesn't need to be typed
export type OutputSymbol = {
  type: 'WellknownDidConfiguration' | 'TrustEstablishmentDoc' | 'Topic';
  metadata: SymbolMetadata;
  value: unknown;
};

export type BundledEntity = {
  name: string;
  seen: string[];
  outputSymbols: OutputSymbol[];
  additionalOutDir: string | undefined;
};

export type EnvironmentLock = {
  context: Context;
  bundle: Bundle;
};
export async function bundleEntity(
  entity: LoadedEntity,
  context: Context,
  lock: EnvironmentLock | undefined,
  provider: Provider,
): Promise<BundledEntity> {
  const entityId = toEntityId(entity.entity);
  const entityContext = context.entities.get(entityId);
  //todo: make this unrepresentable
  if (!entityContext) throw Error('oops should have entity in context');
  const entityName = entity.entity.name;

  const agg: BundledEntity = {
    name: entityName,
    seen: [],
    outputSymbols: [],
    additionalOutDir: entityContext.additionalOutDir,
  };

  //create wellknown did configuration if did or origin has changed
  if (entityContext.origin && entityContext.didConfiguration) {
    //todo use lock and only regenerate when did or origin has changed
    // (!entityLock ||
    //   entityContext.origin !== entityLock.origin ||
    //   entityContext.did !== entityLock.did)
    const didConfiguration = await generateDidConfiguration(
      entityContext.did,
      entityContext.origin,
      entityContext.didConfiguration,
      provider,
    );
    agg.outputSymbols.push({
      type: 'WellknownDidConfiguration',
      value: didConfiguration,
      metadata: {
        name: 'did-configuration',
        namespace: ['.well-known'],
        path: '', //bleh this doesn't get used should remove it?
      },
    });
  }

  for (const symbol of entity.symbols) {
    switch (symbol.type) {
      case 'TrustEstablishmentDoc': {
        const trustDocContext = context.trustDocs.get(
          toRelativeId(entityName, symbol.metadata),
        );
        //ew
        if (!trustDocContext)
          throw Error('oops should have trust doc in context');

        const resolvedTopics = symbol.value.topics.flatMap(
          (relativeTopicId) => {
            const topicContext =
              context.topics.get(relativeTopicId) ??
              context.topics.get(
                toRelativeIdFromName(entityName, relativeTopicId),
              );
            return topicContext
              ? ([[relativeTopicId, topicContext]] as const)
              : [];
          },
        );
        const validTopicMap = new Map<string, { id: string }>(resolvedTopics);

        const entries: Entries = entityContext.subjects.reduce(
          (agg: Entries, subject) => {
            Object.entries(subject.entries).forEach(
              ([topicId, assertionSet]) => {
                const topicContext = validTopicMap.get(topicId);
                if (!topicContext) return;

                const topic = agg[topicContext.id];
                if (topic) {
                  topic[subject.id] = assertionSet;
                }
              },
            );
            return agg;
          },
          Object.fromEntries(
            resolvedTopics.map(
              ([, topicContext]) => [topicContext.id, {}] as const,
            ),
          ),
        );
        const now = new Date();
        const nowIso = now.toISOString();
        //this version has already been bumped
        const version = trustDocContext.version;
        const doc: TrustEstablishmentDoc = {
          id: trustDocContext.id,
          author: entityContext.did,
          version: version,
          created: nowIso,
          validFrom: nowIso,
          entries: entries,
        };

        agg.outputSymbols.push({
          type: symbol.type,
          value: doc,
          metadata: symbol.metadata,
        });
        //ignore
        break;
      }
      case 'Topic': {
        //stupid
        const topicContext =
          context.topics.get(symbol.metadata.name) ??
          context.topics.get(
            toRelativeIdFromName(entityName, symbol.metadata.name),
          );
        if (!topicContext) throw Error('oops should have topic in context');
        agg.outputSymbols.push({
          type: symbol.type,
          metadata: symbol.metadata,
          value: {
            ...symbol.value,
            $id: topicContext.id,
          },
        });
        break;
      }
      case 'Subject': {
        //ignore
        break;
      }
    }
  }
  return agg;
}

export type Bundle = {
  environmentName: string;
  entities: BundledEntity[];
};

export async function bundle(
  entities: LoadedEntity[],
  context: Context,
  lock: EnvironmentLock | undefined,
  provider: Provider,
): Promise<Bundle> {
  return {
    environmentName: context.environmentName,
    //i think these are independent so shouldn't have any race conditiony problems
    //...famous last words
    entities: await Promise.all(
      entities.map((entity) => bundleEntity(entity, context, lock, provider)),
    ),
  };
}

//this resolves all the identifiers we need ahead of time
//we could, build up the context as we bundle
//but i'm gunno do it ahead of time because then the bundling part can remain pure hopefully
//and this can deal with the awkward stuff of generating identifiers
export async function createContext(
  entities: LoadedEntity[],
  environment: Environment,
  lock: EnvironmentLock | undefined,
  provider: Provider,
): Promise<Context> {
  //using loops cus reduce is awkward with async stuff
  const agg: Context = {
    environmentName: environment.name,
    entities: new Map(),
    topics: new Map(),
    trustDocs: new Map(),
    publishWithWeb5: environment.publishWithWeb5,
  };

  for (const entity of entities) {
    //construct the entity in context first
    //cus we'll want it for symbols within this entity

    //grossss todo: clean up this mess wtf
    const entityId = toEntityId(entity.entity);

    const lockedEntity = lock?.context.entities.get(entityId);
    const existingEntity = agg.entities.get(entityId);
    const entityConfig = environment.entities.get(entityId);
    //the lock behaviour is completely fucked and makes no sense
    //wipe the subjects, because there's nothing in there that we need to keep the sam
    //should be split cleanly into things that will always be passed through directly from config
    //and things like identifiers that need merging behaviour
    const entityContext =
      existingEntity ??
      (await generateEntity(
        entityId,
        entityConfig,
        lockedEntity,
        provider.did,
        environment.publishWithWeb5,
      ));

    if (!existingEntity) agg.entities.set(entityId, entityContext);
    const entityName = entity.entity.name;

    for (const symbol of entity.symbols) {
      switch (symbol.type) {
        case 'TrustEstablishmentDoc': {
          //todo: use lock
          const relativeId = toRelativeId(entityName, symbol.metadata);
          const lockedTrustDoc = lock?.context.trustDocs.get(relativeId);
          //need to bump versions
          //ideally i'd do some sort of compatability check to figure out how or if to bump

          const docContext = lockedTrustDoc
            ? { id: lockedTrustDoc.id, did: lockedTrustDoc.publisherDid }
            : provider.draftTrustDoc
            ? await provider.draftTrustDoc(entityContext.did)
            : { id: uuidv4(), did: undefined };
          //todo: only bump version if the trust doc has actually changed
          agg.trustDocs.set(relativeId, {
            id: docContext.id,
            publisherDid: docContext.did,
            version: lockedTrustDoc?.version
              ? bumpVersion(lockedTrustDoc.version)
              : '1',
          });
          break;
        }
        case 'Topic': {
          //todo: use lock
          const relativeId = toRelativeId(entityName, symbol.metadata);
          const id = `${
            entityContext.origin ? `${entityContext.origin}/` : ''
          }${
            symbol.metadata.namespace.length > 0
              ? symbol.metadata.namespace.join('/') + '/'
              : ''
          }${symbol.metadata.name}.json`;

          //bruh
          agg.topics.set(relativeId, {
            id: id,
          });
          break;
        }
        case 'Subject': {
          const subjectEntityId = subjectToEntityId(symbol.metadata);
          const existingEntity = agg.entities.get(subjectEntityId);
          if (existingEntity) {
            entityContext.subjects.push({
              id: existingEntity.did,
              entries: symbol.value,
            });
            break;
          }

          const subjectEntityConfig = environment.entities.get(subjectEntityId);
          //this subject doesn't have an entity created yet
          //eagerly create one, dunno if this is a good idea
          const lockedEntity = lock?.context.entities.get(subjectEntityId);
          const entity =
            existingEntity ??
            (await generateEntity(
              subjectEntityId,
              subjectEntityConfig,
              lockedEntity,
              provider.did,
              environment.publishWithWeb5,
            ));
          //eagerly load subjects, dunno if this is a good idea
          agg.entities.set(toEntityId(symbol.metadata), entity);

          //subjects are scoped to the entity
          entityContext.subjects.push({
            id: entity.did,
            entries: symbol.value,
          });
          break;
        }
      }
    }
  }
  return agg;
}

//todo: create context only from lockfile
// export async function createContextFrozen(
//   environment: Environment,
//   lock: Context | undefined
// ): Promise<Context> {
//   throw Error('not implemented');
// }

async function generateEntity(
  entityId: string,
  config: EntityConfig | undefined,
  lockedEntity: EntityContext | undefined,
  provideDid: Provider['did'],
  publishWithWeb5: boolean,
): Promise<EntityContext> {
  //if did is provided in environment config then use that, if did is in lock then use that, otherwise generate a new one
  const did =
    config?.did ??
    lockedEntity?.did ??
    (await provideDid(entityId, config?.origin, config?.didMethod));

  const context: EntityContext = {
    name: entityId,
    did,
    origin: config?.origin,
    didConfiguration: config?.didConfiguration,
    additionalOutDir: config?.additionalOutDir,
    subjects: [],
  };
  //ew mutation
  if (publishWithWeb5) {
    //if publisher did is in lock then use that otherwise generate a new one
    context.publisherDid = did;
  }

  return context;
}

function mapProofFormatType(proofFormat: ProofFormatTypesEnum) {
  switch (proofFormat) {
    case ProofFormatTypesEnum.JSON_LD:
      return 'lds';
    case ProofFormatTypesEnum.JSON_WEB_TOKEN:
      return 'jwt';
  }
}

async function generateDidConfiguration(
  did: string,
  origin: string,
  config: DidConfigurationConfig | true,
  provider: Provider,
) {
  //todo don't recreate this everytime
  const issuer: WellKnownDidIssuer = new WellKnownDidIssuer({
    issueCallback: async (args: IIssueCallbackArgs) => {
      const format = args.proofFormat
        ? mapProofFormatType(args.proofFormat)
        : 'jwt';
      const issue = issueAsFormat(format, provider.issueFormats);
      if (!issue) throw Error("couldn't issue as format: " + format);

      //yes i'm cheating
      const result = (await issue(
        did,
        args.credential,
      )) as ISignedDomainLinkageCredential;
      return result;
    },
  });
  const defaultedConfig: DidConfigurationConfig =
    config === true
      ? {
          jsonLd: true,
          jwt: true,
        }
      : config;

  const issuance = {
    did: did,
    origin: origin,
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(
      new Date().getFullYear() + 10,
      new Date().getMonth(),
      new Date().getDay(),
    ).toISOString(),
  };
  const issuances: IIssueDomainLinkageCredentialArgs[] = [];
  if (defaultedConfig.jsonLd && provider.issueFormats.jsonld) {
    issuances.push({
      ...issuance,
      options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
    });
  }
  if (defaultedConfig.jwt && provider.issueFormats.jwt) {
    issuances.push({
      ...issuance,
      options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
    });
  }

  return issuer.issueDidConfigurationResource({ issuances }).catch((error) => {
    throw error;
  });
}
function subjectToEntityId(metadata: SymbolMetadata): string {
  return `${metadata.name}`;
}

function toEntityId(entity: { name: string }): string {
  return `${entity.name}`;
}

function toRelativeId(entityName: string, metadata: SymbolMetadata): string {
  return `${entityName}/${metadata.name}`;
}

function toRelativeIdFromName(entityName: string, symbolName: string): string {
  return `${entityName}/${symbolName}`;
}

//if we can't figure out how to bump the input then just pass it through unchanged
function bumpVersion(version: string) {
  const intVersion = parseInt(version);
  if (!isNaN(intVersion)) {
    return (intVersion + 1).toString();
  }

  console.log(`warn: couldn't recognise version '${version}'`);
  return version;
}
