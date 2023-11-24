import {Publisher} from '../publisher/publisher'
import {createWeb5, getWeb5, Web5Agent} from './createWeb5'

import type {
  Web5
  // @ts-expect-error this will error because we shouldn't be importing an esm only package
  // but since we just want the types, this actually works.
} from '@web5/api';
import {TrustEstablishmentDoc} from '../bundler/trustEstablishmentDoc'
import * as console from 'console'

type Web5Connection =  {web5: Web5, did: string}
// async function publishTrustDoc(web5: Web5, did: string, trustDoc: TrustEstablishmentDoc) {
//   //should do updates too aka this should be a PUT
//   //which means we need do a get first and if we find a matching trust doc by id then do an update. otherwise create.
//   const { record: existingRecord } = await web5.dwn.records.read({
//     message: {
//       filter: {
//         recordId: trustDoc.id
//       }
//     }
//   });
//   if(existingRecord) {
//     console.log(`updating existing trust doc with id ${existingRecord.id} and did=${did}`)
//
//     await existingRecord.update({
//       data: trustDoc,
//     })
//
//
//     return trustDoc.id
//   }
//
//   console.log(`publishing fresh trust doc with id=${trustDoc.id} and did=${did}`)
//
//   //I find it weird having to get a specific reference to a record to do an update.
//   const { record, status } = await web5.dwn.records.create({
//     data: JSON.stringify(trustDoc),
//     message: {
//       recordId: trustDoc.id,
//       dataFormat: 'application/json',
//       //public is fine for our purposes
//       published: true
//     },
//   });
//   console.log(status)
//   if(!record) {
//     throw Error("oops couldn't create dwn record")
//   }
//
//   console.log(record.id)
//   await record.send(did);
//   return record.id
// }

async function publishDraftTrustDoc({web5, did}: Web5Connection, trustDoc: TrustEstablishmentDoc) {
  //should do updates too aka this should be a PUT
  //which means we need do a get first and if we find a matching trust doc by id then do an update. otherwise create.
  const { record: existingRecord } = await web5.dwn.records.read({
    message: {
      filter: {
        recordId: trustDoc.id
      }
    }
  });

  if(!existingRecord) {
    throw Error("oops tried to publish trust doc that doesn't have a draft")
  }

  console.log(`publishing draft trust doc with id ${existingRecord.id} and did=${did}`)

  const {status} = await existingRecord.update({
    data: JSON.stringify(trustDoc),
    published: true
  })

  console.log(status)
  await existingRecord.send(did)
  return trustDoc.id
}

export async function draftTrustDoc({web5, did}: Web5Connection) {
  const { record } = await web5.dwn.records.create({
    data: '',
    message: {
      dataFormat: 'application/json',
      //public is fine for our purposes
      published: false
    },
  });

  if(!record) {
    throw Error("oops couldn't create dwn record")
  }

  await record.send(did);
  return {
    id: record.id,
    did: did
  }
}
export const createWeb5Publisher = (web5Agent: Web5Agent): Publisher => {
  return {
    async publishBundle(bundle, environmentLock): Promise<void> {
      //web5 doesn't like us having multiple instances open at once
      for(const entity of bundle.entities) {
        await this.publishEntity(entity, environmentLock)
      }
      // await Promise.all(bundle.entities.map(entity => this.publishEntity(entity, environmentLock)))
      return
    },

    async publishEntity(entity): Promise<void> {
      //create connected web5 instance for this entity
      //should reuse did managed by veramo
      console.log("creating")
      console.log("created")

      //web5 doesn't like overlapping promises
      for(const outputSymbol of entity.outputSymbols) {
        switch (outputSymbol.type) {
          case 'TrustEstablishmentDoc': {
            const doc = outputSymbol.value as TrustEstablishmentDoc
            if(doc.publisherDid) {
              //want to publish this with dwn
              //need to get the web5 connection for this entity
              //ugly getting the publisher id from the doc itself, should the publisher have access to context?
              const web5Connection = await getWeb5(web5Agent, doc.publisherDid)
              //gross casting
              await publishDraftTrustDoc(web5Connection, outputSymbol.value as TrustEstablishmentDoc)
            }
          }
        }
      }
      //todo error handling and reporting
      // const publishPromises = entity.outputSymbols.flatMap(async (outputSymbol) => {
      //   switch (outputSymbol.type) {
      //     case 'TrustEstablishmentDoc': {
      //       //gross casting
      //       return [publishTrustDoc(web5, did, outputSymbol.value as TrustEstablishmentDoc)]
      //     }
      //   }
      //   return []
      // })
      // await Promise.all(publishPromises)
      return
    }
  }
}

