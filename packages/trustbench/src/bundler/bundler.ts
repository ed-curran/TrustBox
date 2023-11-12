import {Entries, TrustEstablishmentDoc} from './trustEstablishmentDoc';
import {LoadedEntity} from '../symbolLoader';
import {Subject, SymbolMetadata} from '../symbol';
import {DidConfigurationConfig, EntityConfig} from '../environment';
import {v4 as uuidv4} from 'uuid';
import {Provider} from './provider';
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
  didConfiguration: DidConfigurationConfig | boolean | undefined
  //this feels wrong tbh
  subjects: {
    id: string;
    entries: Subject;
  }[];
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
  trustDocs: Map<string, { id: string }>;
};

export type Environment = {
  name: string;
  entities: Map<string, EntityConfig>;
};

export type OutputSymbol = {
  type: string;
  metadata: SymbolMetadata;
  value: unknown;
};
export type BundledEntity = {
  name: string;
  seen: string[];
  outputSymbols: OutputSymbol[];
};

export type EnvironmentLock = {
  context: Context;
  bundle: Bundle;
};
export async function bundleEntity(
  entity: LoadedEntity,
  context: Context,
  lock: EnvironmentLock | undefined,
  provider: Provider
): Promise<BundledEntity> {
  const entityId = toEntityId(entity.entity);
  const entityContext = context.entities.get(entityId);
  //todo: make this unrepresentable
  if (!entityContext) throw Error('oops should have entity in context');
  const entityName = entity.entity.name;
  //const entityLock = lock?.context?.entities.get(entityId);

  const agg: BundledEntity = {
    name: entityName,
    seen: [],
    outputSymbols: [],
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
      provider
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
    console.log('pushed')
    console.log(didConfiguration)
  }

  for (const symbol of entity.symbols) {
    switch (symbol.type) {
      case 'TrustEstablishmentDoc': {
        const trustDocContext = context.trustDocs.get(
          toRelativeId(entityName, symbol.metadata)
        );
        //ew
        if (!trustDocContext)
          throw Error('oops should have trust doc in context');

        const resolvedTopics = symbol.value.topics.flatMap(
          (relativeTopicId) => {
            const topicContext =
              context.topics.get(relativeTopicId) ??
              context.topics.get(
                toRelativeIdFromName(entityName, relativeTopicId)
              );
            return topicContext
              ? ([[relativeTopicId, topicContext]] as const)
              : [];
          }
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
              }
            );
            return agg;
          },
          Object.fromEntries(
            resolvedTopics.map(
              ([, topicContext]) => [topicContext.id, {}] as const
            )
          )
        );
        const doc: TrustEstablishmentDoc = {
          id: trustDocContext.id,
          author: entityContext.did,
          version: '0.0.1',
          created: '',
          validFrom: '',
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
            toRelativeIdFromName(entityName, symbol.metadata.name)
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
  provider: Provider
): Promise<Bundle> {
  return {
    environmentName: context.environmentName,
    //i think these are independent so shouldn't have any race conditiony problems
    //...famous last words
    entities: await Promise.all(
      entities.map((entity) => bundleEntity(entity, context, lock, provider))
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
  provider: Provider
): Promise<Context> {
  //using loops cus reduce is awkward with async stuff
  const agg: Context = {
    environmentName: environment.name,
    entities: new Map(),
    topics: new Map(),
    trustDocs: new Map(),
  };

  for (const entity of entities) {
    //construct the entity in context first
    //cus we'll want it for symbols within this entity

    //grossss todo: clean up this mess wtf
    const entityId = toEntityId(entity.entity);
    const lockedEntity = lock?.context.entities.get(entityId);
    const existingEntity = agg.entities.get(entityId);
    const entityConfig = environment.entities.get(entityId)
    console.log(entityConfig)
    console.log(lockedEntity)
    //the lock behaviour is completely fucked and makes no sense
    //wipe the subjects, because there's nothing in there that we need to keep the same
    const entityContext =
      existingEntity ??
      (lockedEntity
        ? { ...lockedEntity, subjects: [], didConfiguration: entityConfig?.didConfiguration }
        : await generateEntity(
            entityId,
            entityConfig,
            provider.did
          ));
    console.log(entityContext)
    if (!existingEntity) agg.entities.set(entityId, entityContext);
    const entityName = entity.entity.name;

    for (const symbol of entity.symbols) {
      switch (symbol.type) {
        case 'TrustEstablishmentDoc': {
          //todo: use lock
          const relativeId = toRelativeId(entityName, symbol.metadata);
          console.log(relativeId);
          agg.trustDocs.set(relativeId, {
            id: uuidv4(),
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

          console.log(id);
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

          const subjectEntityConfig = environment.entities.get(subjectEntityId)
          //this subject doesn't have an entity created yet
          //eagerly create one, dunno if this is a good idea
          const lockedEntity = lock?.context.entities.get(subjectEntityId);
          const entity =
            existingEntity ??
            (lockedEntity
              ? { ...lockedEntity, subjects: [], didConfiguration: subjectEntityConfig?.didConfiguration }
              : await generateEntity(
                subjectEntityId,
                subjectEntityConfig,
                provider.did
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
  provideDid: Provider['did']
): Promise<EntityContext> {
  //if did is provided in environment then use that
  const did = config?.did ?? (await provideDid(entityId, config?.didMethod));

  return {
    name: entityId,
    did,
    origin: config?.origin,
    didConfiguration: config?.didConfiguration,
    subjects: [],
  };
}

function mapProofFormatType(proofFormat: ProofFormatTypesEnum) {
  switch (proofFormat) {
    case ProofFormatTypesEnum.JSON_LD: return 'lds'
    case ProofFormatTypesEnum.JSON_WEB_TOKEN: return 'jwt'
  }
}
async function generateDidConfiguration(
  did: string,
  origin: string,
  config: DidConfigurationConfig | true,
  provider: Provider
) {
  //todo don't recreate this everytime
  const issuer: WellKnownDidIssuer = new WellKnownDidIssuer({
    issueCallback: async (args: IIssueCallbackArgs) => {
      //yes i'm cheating
      const result = (await provider.issue(
        did,
        args.credential,
        args.proofFormat ? mapProofFormatType(args.proofFormat) : 'jwt'
      )) as ISignedDomainLinkageCredential;
      console.log(result);
      return result;
    },
  });
  const defaultedConfig: DidConfigurationConfig = config === true ? {
    jsonLd: true,
    jwt: true
  } : config

  const issuance = {
    did: did,
    origin: origin,
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(
      new Date().getFullYear() + 10,
      new Date().getMonth(),
      new Date().getDay()
    ).toISOString(),
  }
  const issuances: IIssueDomainLinkageCredentialArgs[] = []
  if(defaultedConfig.jsonLd) {
    issuances.push({
      ...issuance,
      options: { proofFormat: ProofFormatTypesEnum.JSON_LD },
    })
  }
  if(defaultedConfig.jwt) {
    issuances.push({
      ...issuance,
      options: { proofFormat: ProofFormatTypesEnum.JSON_WEB_TOKEN },
    })
  }

  return issuer.issueDidConfigurationResource({issuances}).catch((error) => {
    throw error
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
