import {
  Author,
  Entity,
  EntitySymbol,
  Named,
  NamedSymbol,
  Subject,
  SubjectSymbol,
  Topic,
  TopicSymbol,
} from './symbol';
import { LoadedEntity } from './symbolLoader';

export type EntityModel = {
  entity: Named<EntitySymbol>;
  topics: Map<string, Named<TopicSymbol>>;
  subjects: Named<SubjectSymbol>[];
};
// export type Model = {
//   entities: Map<string, EntityModel>;
// };
//
// export function toModel(entityModels: EntityModel[]): Model {
//   return {
//     entities: new Map(
//       entityModels.map((entityModel) => [
//         entityModel.entity.metadata.name,
//         entityModel,
//       ])
//     ),
//   };
// }

// export function toEntityModel(loadedEntity: LoadedEntity): EntityModel {
//   return loadedEntity.symbols.reduce(
//     (previousValue: EntityModel, currentValue) => {
//       switch (currentValue.type) {
//         case 'TrustEstablishmentDoc': {
//           previousValue.entity = currentValue;
//           return previousValue;
//         }
//         case 'Topic': {
//           previousValue.topics.set(currentValue.metadata.name, currentValue);
//           return previousValue;
//         }
//         case 'Subject': {
//           previousValue.subjects.push(currentValue);
//           return previousValue;
//         }
//       }
//     },
//     {
//       entity: loadedEntity.entity,
//       topics: new Map(),
//       subjects: [],
//     }
//   );
// }

// export function toModelCombined(symbols: NamedSymbol[]): Model {
//   return symbols.reduce(
//     (previousValue: Model, currentValue) => {
//       //todo treat each entity seperately
//       const entityName = currentValue.metadata.namespace[0];
//       let entity = previousValue.entities.get(entityName);
//       if (!entity) {
//         entity = {
//           entity: {
//             type: 'Entity',
//             value: {},
//             metadata: {
//               name: entityName,
//               path: entityName,
//               namespace: [entityName],
//             },
//           },
//           topics: new Map(),
//           subjects: [],
//         };
//       }
//       switch (currentValue.type) {
//         case 'Entity': {
//           entity.entity = currentValue;
//           return previousValue;
//         }
//         case 'Topic': {
//           entity.topics.set(currentValue.metadata.name, currentValue);
//           return previousValue;
//         }
//         case 'Subject': {
//           entity.subjects.push(currentValue);
//           return previousValue;
//         }
//       }
//     },
//     {
//       entities: new Map<string, EntityModel>(),
//     }
//   );
// }
