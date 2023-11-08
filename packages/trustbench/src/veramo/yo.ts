// // Core interfaces
// import {
//   createAgent,
//   IDIDManager,
//   IResolver,
//   IDataStore,
//   IDataStoreORM,
//   IKeyManager,
//   ICredentialPlugin,
// } from '@veramo/core';
//
// // Core identity manager plugin
// import { DIDManager } from '@veramo/did-manager';
//
// // Ethr did identity provider
//
// // Core key manager plugin
// import { KeyManager } from '@veramo/key-manager';
//
// // Custom key management system for RN
// import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
//
// // W3C Verifiable Credential plugin
//
// // Custom resolvers
// import { KeyDIDProvider } from '@veramo/did-provider-key';
// import { WebDIDProvider } from '@veramo/did-provider-web';
//
// import { Resolver } from 'did-resolver';
//
// import { getResolver as webDidResolver } from 'web-did-resolver';
//
// // Storage plugin using TypeOrm
// import {
//   Entities,
//   KeyStore,
//   DIDStore,
//   PrivateKeyStore,
//   migrations,
// } from '@veramo/data-store';
//
// // TypeORM is installed with `@veramo/data-store`
// import { DataSource, DataSourceOptions } from 'typeorm';
//
// // This will be the name for the local sqlite database for demo purposes
// const DATABASE_FILE = 'database.sqlite';
//
// // This will be the secret key for the KMS
// const KMS_SECRET_KEY =
//   '8aae5757159d01c51c42e4db893b0d7c32862b8cdeb3dd045a60b68819313473';
//
// //veramo is esm only, which is actually probably a good idea
// //but i don't want to commit to converting this whole codebase to esm yet
// //and its fairly easy to isolate veramo and deal with the dynamic imports here
// //so gunno do that for now
//
// //nice
// export type Yo = Awaited<ReturnType<typeof veramoAgent>>;
// export const veramoAgent = async () => {
//   const { createAgent } = await import('@veramo/core');
//
//   const dbConnection = new DataSource({
//     type: 'sqlite',
//     database: DATABASE_FILE,
//     synchronize: false,
//     migrations: migrations,
//     // migrationsRun: true,
//     // logging: ['error', 'info', 'warn'],
//     // entities: Entities,
//     // options: {},
//     //don't you just love it when libraries have broken types
//     //veramos migrations aren't typed properly so have to do this
//   } as DataSourceOptions).initialize();
//
//   return createAgent<
//     IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver
//   >({
//     plugins: [
//       new KeyManager({
//         store: new KeyStore(dbConnection),
//         kms: {
//           local: new KeyManagementSystem(
//             new PrivateKeyStore(dbConnection, new SecretBox(KMS_SECRET_KEY))
//           ),
//         },
//       }),
//       new DIDManager({
//         store: new DIDStore(dbConnection),
//         defaultProvider: 'did:key',
//         providers: {
//           'did:key': new KeyDIDProvider({ defaultKms: 'local' }),
//           'did:web': new WebDIDProvider({ defaultKms: 'local' }),
//         },
//       }),
//     ] as const,
//   } as const);
// };
//
// function generateDid(didMethod: string) {}
