import { Entries, TrustEstablishmentDoc } from '../trustlib';
import { LoadedEntity, symbolSerde } from '../symbolLoader';
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
import { resolveReferences } from './replacer';
import {
  normaliseRef,
  SymbolPool,
  toAbsoluteRef,
  toUntaggedSymbolRef,
} from './symbolPool';
import {
  Context,
  EntityContext,
  EntityWithContext,
  NamedSymbolWithContext,
  SymbolContextMetadata,
  withContext,
} from './context';

export type Environment = {
  name: string;
  publishWithWeb5: boolean;
  kmsSecretKey: string;
  entities: Map<string, EntityConfig>;
};

//todo should probably make this a proper union
//but its okay for now cus value doesn't need to be typed
export type OutputSymbol = {
  type:
    | 'WellknownDidConfiguration'
    | 'TrustEstablishmentDoc'
    | 'Topic'
    | 'CredentialSchema'
    | 'Template';
  metadata: SymbolContextMetadata;
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
  entity: EntityWithContext,
  context: Context,
  lock: EnvironmentLock | undefined,
  provider: Provider,
): Promise<BundledEntity> {
  const entityContext = entity.context;
  const entityName = entity.context.name;

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
        entityName: entityName,
        extension: 'json',
        raw: '',
      },
    });
  }

  for (const symbol of entity.symbols) {
    switch (symbol.type) {
      case 'TrustEstablishmentDoc': {
        const trustDocContext = symbol.context;

        const resolvedTopics = symbol.value.topics.flatMap(
          (relativeTopicId) => {
            const topicContext = context.pool.get(
              'Topic',
              normaliseRef(entityName, relativeTopicId),
            )?.context;

            return topicContext
              ? ([[relativeTopicId, topicContext]] as const)
              : [];
          },
        );
        const validTopicMap = new Map<string, { id: string }>(resolvedTopics);

        const entries: Entries = entityContext.subjects.reduce(
          (agg: Entries, entitySubjectContext) => {
            const subject = context.pool.get(
              'Subject',
              entitySubjectContext.ref,
            );
            if (!subject) {
              //shouldn't happen
              return agg;
            }

            const subjectDid = context.entities.get(subject.metadata.name)?.did;
            if (!subjectDid) {
              //shouldn't happen
              return agg;
            }

            Object.entries(subject.value).forEach(([topicId, assertionSet]) => {
              const topicContext = validTopicMap.get(topicId);
              if (!topicContext) return;

              const topic = agg[topicContext.id];
              if (topic) {
                topic[subjectDid] = assertionSet;
              }
            });

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
        const topicContext = symbol.context;
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
      case 'CredentialSchema': {
        //stupid
        const topicContext = symbol.context;

        if (!topicContext)
          throw Error('oops should have credential schema in context');

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
      case 'Template': {
        agg.outputSymbols.push({
          type: symbol.type,
          metadata: symbol.metadata,
          value: symbol.value,
        });
      }
    }
  }
  return agg;
}

export type Bundle = {
  environmentName: string;
  entities: BundledEntity[];
};

async function resolveSymbol(
  symbol: NamedSymbolWithContext,
  pool: SymbolPool,
): Promise<NamedSymbolWithContext> {
  let resolvedCount = 0;
  const resolvedRawValue = resolveReferences(
    symbol.metadata.raw,
    symbol.metadata.path,
    (key) => {
      resolvedCount++;
      const ref = normaliseRef(symbol.metadata.entityName, key);
      const resolved = pool.getAny(ref)?.id;

      if (resolved === undefined) {
        console.log(
          `missing ref ${key} (normalised: ${ref}) in symbol at ${symbol.metadata.path}`,
        );
        return '';
      }
      return resolved;
    },
  );

  if (resolvedCount < 1) {
    return symbol;
  }

  const result = await symbolSerde({
    type: symbol.type,
    value: undefined,
  }).deserialize(resolvedRawValue, symbol.metadata);
  if (result.status === 'failure') {
    console.log(`couldn't parse resolved symbol contents ${result.message}`);
    return symbol;
  }

  return {
    ...symbol,
    value: result.value.value,
  } as NamedSymbolWithContext;
}

async function resolveEntity(
  entity: EntityWithContext,
  context: Context,
): Promise<EntityWithContext> {
  return {
    context: entity.context,
    symbols: await Promise.all(
      entity.symbols.map((symbol) => resolveSymbol(symbol, context.pool)),
    ),
  };
}

export async function bundle(
  entities: EntityWithContext[],
  context: Context,
  lock: EnvironmentLock | undefined,
  provider: Provider,
): Promise<Bundle> {
  return {
    environmentName: context.environmentName,
    //i think these are independent so shouldn't have any race conditiony problems
    //...famous last words
    entities: await Promise.all(
      entities.map((entity) =>
        resolveEntity(entity, context).then((resolvedEntity) =>
          bundleEntity(resolvedEntity, context, lock, provider),
        ),
      ),
    ),
  };
}

//this resolves all the identifiers we need ahead of time
//we could, build up the context as we bundle
//but i'm gunno do it ahead of time because then the bundling part can remain pure hopefully
//and this can deal with the awkward stuff of generating identifiers
export async function createEntityContext(
  entity: LoadedEntity,
  environment: Environment,
  lock: EnvironmentLock | undefined,
  provider: Provider,
): Promise<EntityWithContext> {
  //construct the entity in context first
  //cus we'll want it for symbols within this entity
  const entityId = toEntityId(entity.entity);
  const lockedEntity = lock?.context.entities.get(entityId);
  const entityConfig = environment.entities.get(entityId);

  //the lock behaviour is completely fucked and makes no sense
  //wipe the subjects, because there's nothing in there that we need to keep the sam
  //should be split cleanly into things that will always be passed through directly from config
  //and things like identifiers that need merging behaviour
  const entityContext = await generateEntity(
    entityId,
    entityConfig,
    lockedEntity,
    provider.did,
    environment.publishWithWeb5,
  );

  const entityName = entity.entity.name;

  const symbolsWithContext = new Array<NamedSymbolWithContext>();
  for (const symbol of entity.symbols) {
    switch (symbol.type) {
      case 'TrustEstablishmentDoc': {
        //todo: use lock
        const lockedTrustDoc = lock?.context.pool.get(
          'TrustEstablishmentDoc',
          toAbsoluteRef(entityName, symbol.metadata.name),
        )?.context;
        //need to bump versions
        //ideally i'd do some sort of compatability check to figure out how or if to bump

        const docContext = lockedTrustDoc
          ? { id: lockedTrustDoc.id, did: lockedTrustDoc.publisherDid }
          : provider.draftTrustDoc
          ? await provider.draftTrustDoc(entityContext.did)
          : { id: uuidv4(), did: undefined };

        //todo: only bump version if the trust doc has actually changed
        symbolsWithContext.push(
          withContext(symbol, entityName, {
            id: docContext.id,
            publisherDid: docContext.did,
            version: lockedTrustDoc?.version
              ? bumpVersion(lockedTrustDoc.version)
              : '1',
          }),
        );

        break;
      }
      case 'Topic': {
        //todo: use lock
        const id = `${entityContext.origin ? `${entityContext.origin}/` : ''}${
          symbol.metadata.namespace.length > 0
            ? symbol.metadata.namespace.join('/') + '/'
            : ''
        }${symbol.metadata.name}.json`;

        symbolsWithContext.push(
          withContext(symbol, entityName, {
            id: id,
          }),
        );
        break;
      }
      case 'CredentialSchema': {
        //todo: use lock
        const id = `${entityContext.origin ? `${entityContext.origin}/` : ''}${
          symbol.metadata.namespace.length > 0
            ? symbol.metadata.namespace.join('/') + '/'
            : ''
        }${symbol.metadata.name}.json`;

        symbolsWithContext.push(
          withContext(symbol, entityName, {
            id: id,
          }),
        );
        break;
      }
      case 'Subject': {
        const subjectWithContext = withContext(symbol, entityName, {
          id: symbol.metadata.name, //this is actually a relative id to the entity
        });
        symbolsWithContext.push(subjectWithContext);
        entityContext.subjects.push({
          ref: toUntaggedSymbolRef(subjectWithContext.metadata),
        });
        break;
      }
      case 'Template': {
        //todo: should do this pass through automatically i think
        symbolsWithContext.push(
          withContext(symbol, entityName, {
            id: '',
          }),
        );
      }
    }
  }

  return {
    context: entityContext,
    symbols: symbolsWithContext,
  };
}

//merge the entity contexts together
//and resolve any references (references are the things that look like {{ example.schema }}
//return type of this is awkward
export async function createContext(
  entities: EntityWithContext[],
  environment: Environment,
): Promise<{
  context: Context;
  entities: EntityWithContext[];
}> {
  //this is weird,
  //we need to resolve the passed in entities to then construct the context we want
  //but to resolve them we need to construct an intermediate pool

  const tempPool = new SymbolPool(entities.flatMap((entity) => entity.symbols));

  //lots of iterations going on
  //should probably optimise it to a single procedural reduce loop
  const resolvedEntities = await Promise.all(
    entities.flatMap(async (entity) => ({
      context: entity.context,
      symbols: await Promise.all(
        entity.symbols.map((symbol) => resolveSymbol(symbol, tempPool)),
      ),
    })),
  );
  const resolvedPool = new SymbolPool(
    resolvedEntities.flatMap((entity) => entity.symbols),
  );

  const context: Context = {
    environmentName: environment.name,
    entities: new Map(
      resolvedEntities.map((entity) => [entity.context.name, entity.context]),
    ),
    pool: resolvedPool,
    publishWithWeb5: environment.publishWithWeb5,
  };

  return {
    context: context,
    entities: resolvedEntities,
  };
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

function toEntityId(entity: { name: string }): string {
  return `${entity.name}`;
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
