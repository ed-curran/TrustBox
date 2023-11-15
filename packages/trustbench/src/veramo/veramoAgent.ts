// Core interfaces

// Core identity manager plugin

// Core key manager plugin

// Custom key management system for RN

// Storage plugin using TypeOrm

// TypeORM is installed with `@veramo/data-store`
import { DataSource, DataSourceOptions } from 'typeorm';

//we need these types to type the agent correctly, but can't import from esm
//however since we just want the types, this is fiiine
//https://github.com/microsoft/TypeScript/issues/52529

import type {
  IDIDManager,
  IDataStore,
  IDataStoreORM,
  IKeyManager,
  TAgent,
  ICredentialPlugin,
  // @ts-expect-error this will error because we shouldn't be importing an esm only package
  // but since we just want the types, this actually works.
} from '@veramo/core';

// This will be the name for the local sqlite database for demo purposes
const DATABASE_FILE = 'database.sqlite';

function databaseFileName(environmentName?: string) {
  if (!environmentName) return DATABASE_FILE;
  return `${environmentName}.sqlite`;
}

//veramo is esm only, which is actually probably a good idea
//but i don't want to commit to converting this whole codebase to esm yet
//and its fairly easy to isolate veramo and deal with the dynamic imports here
//so gunno do that for now

//nice
export type VeramoAgent = TAgent<
  IDIDManager & IKeyManager & IDataStore & IDataStoreORM & ICredentialPlugin
>;
export const veramoAgent = async (kmsSecretKey: string, environmentName?: string, ) => {
  const { createAgent } = await import('@veramo/core');

  const { DIDManager } = await import('@veramo/did-manager');
  const { KeyManager } = await import('@veramo/key-manager');
  const { KeyManagementSystem, SecretBox } = await import('@veramo/kms-local');

  const { KeyStore, DIDStore, PrivateKeyStore, migrations, Entities } =
    await import('@veramo/data-store');

  const { KeyDIDProvider } = await import('@veramo/did-provider-key');
  const { WebDIDProvider } = await import('@veramo/did-provider-web');

  const { DIDResolverPlugin } = await import('@veramo/did-resolver');
  const { getResolver: webDidResolver } = await import('web-did-resolver');
  const { getResolver: keyDidResolver } = await import('key-did-resolver');

  const { CredentialPlugin } = await import('@veramo/credential-w3c');
  const { CredentialIssuerLD, VeramoEd25519Signature2018, LdDefaultContexts } =
    await import('@veramo/credential-ld');

  const dbConnection = new DataSource({
    type: 'sqlite',
    database: databaseFileName(environmentName),
    synchronize: false,
    migrations: migrations,
    migrationsRun: true,
    logging: ['error', 'info', 'warn'],
    entities: Entities,
    options: {},
    //don't you just love it when libraries have broken types
    //veramos migrations aren't typed properly so have to do this
  } as DataSourceOptions).initialize();

  return createAgent<
    IDIDManager & IKeyManager & IDataStore & IDataStoreORM & ICredentialPlugin
  >({
    plugins: [
      new KeyManager({
        store: new KeyStore(dbConnection),
        kms: {
          local: new KeyManagementSystem(
            new PrivateKeyStore(dbConnection, new SecretBox(kmsSecretKey))
          ),
        },
      }),
      new DIDManager({
        store: new DIDStore(dbConnection),
        defaultProvider: 'did:key',
        providers: {
          'did:key': new KeyDIDProvider({ defaultKms: 'local' }),
          'did:web': new WebDIDProvider({ defaultKms: 'local' }),
        },
      }),
      new DIDResolverPlugin({ ...webDidResolver(), ...keyDidResolver() }),
      new CredentialPlugin(),
      new CredentialIssuerLD({
        contextMaps: [
          LdDefaultContexts,
          {
            'https://identity.foundation/.well-known/did-configuration/v1': {
              '@context': [
                {
                  '@version': 1.1,
                  '@protected': true,
                  LinkedDomains:
                    'https://identity.foundation/.well-known/resources/did-configuration/#LinkedDomains',
                  DomainLinkageCredential:
                    'https://identity.foundation/.well-known/resources/did-configuration/#DomainLinkageCredential',
                  origin:
                    'https://identity.foundation/.well-known/resources/did-configuration/#origin',
                  linked_dids:
                    'https://identity.foundation/.well-known/resources/did-configuration/#linked_dids',
                },
              ],
            },
          },
        ],
        suites: [new VeramoEd25519Signature2018()],
      }),
    ],
  });
};
