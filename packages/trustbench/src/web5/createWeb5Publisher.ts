import { Publisher } from '../publisher/publisher';
import { getWeb5, Web5Agent, Web5Connection } from './createWeb5';

import { TrustEstablishmentDoc } from '../trustlib';
import * as console from 'console';

async function publishDraftTrustDoc(
  { web5, did }: Web5Connection,
  trustDoc: TrustEstablishmentDoc,
) {
  //should do updates too aka this should be a PUT
  //which means we need do a get first and if we find a matching trust doc by id then do an update. otherwise create.
  const { record: existingRecord } = await web5.dwn.records.read({
    message: {
      filter: {
        recordId: trustDoc.id,
      },
    },
  });

  if (!existingRecord) {
    throw Error("oops tried to publish trust doc that doesn't have a draft");
  }

  const { status } = await existingRecord.update({
    data: JSON.stringify(trustDoc),
    published: true,
  });

  await existingRecord.send(did);

  console.log(`published trust doc with id ${existingRecord.id}`);
  return trustDoc.id;
}

export async function draftTrustDoc({ web5, did }: Web5Connection) {
  const { record } = await web5.dwn.records.create({
    data: '',
    message: {
      dataFormat: 'application/json',
      //technically the draft doesn't adhere to the schema... not sure what to do about that
      //also should use a bet location for the schema
      schema:
        'https://github.com/decentralized-identity/trust-establishment/blob/main/versions/v1/schemas/schema.json',
      //the draft isn't published
      published: false,
    },
  });

  if (!record) {
    throw Error("oops couldn't create dwn record");
  }

  await record.send(did);
  console.log(`created draft trust doc with id ${record.id}`);
  return {
    id: record.id,
    did: did,
  };
}
export const createWeb5Publisher = (web5Agent: Web5Agent): Publisher => {
  return {
    async publishBundle(bundle, environmentLock): Promise<void> {
      await Promise.all(
        bundle.entities.map((entity) =>
          this.publishEntity(entity, environmentLock),
        ),
      );
    },

    async publishEntity(entity): Promise<void> {
      //create connected web5 instance for this entity
      //should reuse did managed by veramo
      //todo error handling and reporting
      const publishPromises = entity.outputSymbols.flatMap(
        async (outputSymbol) => {
          switch (outputSymbol.type) {
            case 'TrustEstablishmentDoc': {
              const doc = outputSymbol.value as TrustEstablishmentDoc;
              const web5Connection = await getWeb5(web5Agent, doc.author);
              //gross casting
              return [
                await publishDraftTrustDoc(
                  web5Connection,
                  outputSymbol.value as TrustEstablishmentDoc,
                ),
              ];
            }
          }
          return [];
        },
      );
      await Promise.all(publishPromises);
    },
  };
};
