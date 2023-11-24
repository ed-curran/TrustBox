import {Bundle, BundledEntity, EnvironmentLock} from '../bundler/bundler'


export interface Publisher {
   publishBundle(bundle: Bundle,
           environmentLock: EnvironmentLock | undefined): Promise<void>

   publishEntity(entity: BundledEntity,
           environmentLock: EnvironmentLock | undefined): Promise<void>
   // publishTrustDoc(trusDoc: TrustEstablishmentDoc): Promise<string>;
}