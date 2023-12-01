# TrustBox
TrustBox is a suite of tools to build and utilise trust infrastructure for [application ecosystems](https://trustoverip.org/toip-model/). 
It targets open standards that bridge the web with digital identity. Currently, it consists of:

**TrustSight** - A trust overlay for your browser. It helps web users figure out if they can trust a website. Currently, this is a separate [repository](https://github.com/ed-curran/TrustSight).

[**TrustBench**](packages/trustbench/README.md) - A developer tool for building and publishing trust infrastructure such as trust frameworks, and the pieces need to participate in a trust framework.

**[TrustGraph](apps/docs/README.md)** - A visualizer for trust relationships. It can be used by both builders and users to understand trust within an ecosystem.

This repository also contains:

**[The HomebuyingUK Demo](#the-homebuyinguk-demo)** - A trust framework supported journey through the early steps of a property sale. Utilising TrustBench, TrustSight and TrustGraph



To learn more, watch the [HombuyingUK demo video](https://youtu.be/jRI1J16QFDQ), and try it out for [yourself](https://trust-sight-ddiatf.vercel.app/). Or stick around for the story. If you're only interested in the tech and standards, skip to [here](#the-technology).

## The Story

This project is inspired by an effort I'm involved in to build a trust framework for the home buying and selling industry. It requires some explanation and quite a few acronyms so here it goes.

The [Property Data Trust Framework](https://propdata.org.uk/) (PDTF)
created by the [Home Buying and Selling Group](https://homebuyingandsellinggroup.co.uk/), and now managed by the [Open Property Data Association](https://openpropdata.org.uk/), seeks to enable people and organisations within the UK to exchange trustworthy property data more easily.
Its significant contribution currently is the publication of [data schemas](https://github.com/Property-Data-Trust-Framework/schemas) describing standardised property data. 

I wanted to explore the implementation of a trust framework, and a bridge into the world of [verifiable credentials](https://www.w3.org/TR/vc-data-model/) (VCs) and [decentralized identifiers](https://www.w3.org/TR/did-core/) (DIDs).
Unfortunately, but also excitingly, the development of digital trust frameworks is still quite young.


Another important piece of this tale is the UKs 
[Digital Identity and Attributes Trust Framework](https://www.gov.uk/government/publications/uk-digital-identity-and-attributes-trust-framework-beta-version/uk-digital-identity-and-attributes-trust-framework-beta-version) (DIATF),
a beta policy paper in the UK.
The policy describes the concept of schemes, that allows industries to create domain specific trust frameworks that are certified by the [Department of Science Innovation and Technology](https://www.gov.uk/government/organisations/department-for-science-innovation-and-technology) (DSIT).

I wanted to find out, from the perspective of the average internet user:
- How could an organisation prove their participation, and role, in the PDTF?
- How could the PDTF prove its certification as a DIATF scheme?

Hence, TrustSight is born.

> TrustSight is a trust overlay for your browser, find out more [here](https://github.com/ed-curran/TrustSight).

To effectively demonstrate TrustSight for this purpose, I needed to build a trust framework. 
Actually, I needed to build two interlocking trust frameworks. This was the birth of TrustBench. 

A natural way to make sense of such a setup is a graph, so obviously I had to build TrustGraph.  

I realised I now had a suite of tools, so it needed a name. I am not very imaginative.


## The HomebuyingUK demo

The HomebuyingUK demo follows an average internet user through the early steps of selling their home - 
showing how TrustSight can give them confidence through this journey. Part 2 shows how a technical administrator for HomebuyingUK can easily
update the trust framework using TrustBench and visualise the published changes with TrustGraph.


Part 1 can be replicated yourself by starting at the [TrustUK](https://trust-uk.vercel.app/) demo site. 
Doing part 2 fully requires running this repository yourself. See [here](#develop). Or you can just look at the [trust graph](https://trust-graph.vercel.app/?filter=did%3Aion%3AEiBDZeCzE-9GLasp8I4Mwn3q_q62b6cpM0oc7M1L37Y_lg%3AeyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJkd24tc2lnIiwicHVibGljS2V5SndrIjp7ImNydiI6IkVkMjU1MTkiLCJrdHkiOiJPS1AiLCJ4Ijoiak5fa0VjTDlaaFZoQy1WVGtrUTlhQzA2N1UzNnMwcElHTFVkd3ZvT2pyUSJ9LCJwdXJwb3NlcyI6WyJhdXRoZW50aWNhdGlvbiJdLCJ0eXBlIjoiSnNvbldlYktleTIwMjAifSx7ImlkIjoiZHduLWVuYyIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsIngiOiJlcmpXWE9saDVobTBZaXNneVZXOHZEYUZTSWtOTFBjVDJHUU1oRDkxdFB3IiwieSI6IjE3aVpMbEYzRjhlbFU5N0VXOUpHNllxcW1hRjVWOFNOTTdINnJtRS0wQXMifSwicHVycG9zZXMiOlsia2V5QWdyZWVtZW50Il0sInR5cGUiOiJKc29uV2ViS2V5MjAyMCJ9XSwic2VydmljZXMiOlt7ImlkIjoiZHduIiwic2VydmljZUVuZHBvaW50Ijp7ImVuY3J5cHRpb25LZXlzIjpbIiNkd24tZW5jIl0sIm5vZGVzIjpbImh0dHBzOi8vZHduLnRiZGRldi5vcmcvZHduMyIsImh0dHBzOi8vZHduLnRiZGRldi5vcmcvZHduNiJdLCJzaWduaW5nS2V5cyI6WyIjZHduLXNpZyJdfSwidHlwZSI6IkRlY2VudHJhbGl6ZWRXZWJOb2RlIn0seyJpZCI6ImRvbWFpbiIsInNlcnZpY2VFbmRwb2ludCI6Imh0dHBzOi8vdHJ1c3QtdWsudmVyY2VsLmFwcCIsInR5cGUiOiJMaW5rZWREb21haW5zIn1dfX1dLCJ1cGRhdGVDb21taXRtZW50IjoiRWlEZjNRaGt2cHZhV2Z2YnB1LXlaR2NZb0NlSE8weFB6cng0cmVQYUtRTWpudyJ9LCJzdWZmaXhEYXRhIjp7ImRlbHRhSGFzaCI6IkVpQnVxcS1XYkdKR0dKWlFFbHB5aHNqZ1BHXzhrSW5hYkhTSlZ3T1VOUENHNHciLCJyZWNvdmVyeUNvbW1pdG1lbnQiOiJFaUNCTWRuNDliMnI2eHcwQVBBdU5Xb0hISHg5N1VWLTlrWExaSzRUd25XZlF3In19) used in the demo. 



### Implementation
The demo is implemented as a collection of projects in this repo.


Each organisation in the demo has a website. In these readmes you can find out more about the inspiration for each organisation. The sites themselves are created from templates and not very interesting.

**[TrustUK](apps/docs/README.md)** (fka. DDIATF)

**[HomebuyingUK](apps/web/README.md)** (fka. DPDTF)

**[PropertyPrepper](apps/property-prepper/README.md)**

More interesting is the trust infrastructure for the demo, i.e. how each website/organisation is identified and how they make assertions about each other. It
is implemented as a single `TrustBench` model, where each site is an *entity*.  I call it the

**[trust-backbone](packages/trust-backbone/README.md)**

It uses `TrustBench` to build the model into pieces that are published/hosted by the relevant website. 
It also uses the `pubishWithWeb5` config to additionally publish trust establishment documents to a DWN.


## The Technology
The core of the solution is the combination of trust establishment documents and wellknown did configurations. Together it provides an open and standards compliant way to make trust assertions about an entity and have that entity be provably associated with a domain. It means it is practical to publish and consume trust infrastructure (welknown did configs, topic schemas, trust docs) using a web server.

Additionally we use decentralised web nodes to offer enhanced publishing functionality, so that organizations do not have to rely solely on publishing to a website. (currently only trust establishment documents themselves can be published to a DWN. In the future, topic schemas would be too). This provides an easier way for applications to query for an entity's trust documents, which we take advantage of in TrustGraph. TrustSight also uses it to refresh trust docs (keep them up to date), or falls back to refreshing from the authors webserver/website.

We use various libraries: `veramo`, `@sphereon/wellknown-dids-client`, `web5.js` -  to implement the standards properly, and perform real did operations, credential signing, and verification (although we don't support verification of JSON-LD linked domain credentials yet, just VC-JWT). We have a burgeoning library called `trustlib` which may one day combine that stuff in a way that its easy to reuse, atm its all rather spread about the place.

* TrustSight wraps it into a chrome extension with a react UI (tailwind + shadcn <3).
* TrustBench wraps it into a node js library / proto cli.
* TrustGraph wraps it into a Next.js application. It uses Reagraph for graph visualisation.
* Each demo website is a simple Next.js application with tailwind
* `trust-backbone` is the TrustBench model that describes all the trust infrastructure for the demo websites.

## The Boring Stuff
This is turborepo repo (a turbo, repo?). Its mostly typescript.
Frontend is mostly React and Tailwind. Package manager is PNPM.  

Here is a full index for the repo:

### Apps

**[TrustGraph](apps/docs/README.md)**

**[TrustUK](apps/docs/README.md)** (fka. DDIATF)

**[HomebuyingUK](apps/web/README.md)** (fka. DPDTF)

**[PropertyPrepper](apps/property-prepper/README.md)**

### Packages

[**TrustBench**](packages/trustbench/README.md)

Tool for building and publishing trust infrastructure.

**[Demo Trust Backbone](packages/trust-backbone/README.md)**

Holds the model defining the trust backbone used by the demo, plus a script to build the model with `TrustBench`.

**[trust-lib](packages/trustlib/README.md)**

Burgeoning library thats currently almost empty but may one day organise 
the dependencies shared by TrustBox.


### Utilities

This Turborepo has some tools setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
pnpm build
```


### Running the demo

install pnpm

install dependencies

```bash
pnpm install
```

Set up a local environment with

```bash
pnpm run init
```

This will create a `local.environment.json` in `/packages/trust-backbone` for you - including a fresh `kmsSecretKey`.
 and build a local trust backbone for the demo apps (e.g. with localhost origins). See [here](#changing-the-backbone) for more info.


### Develop

To develop all apps and packages, run the following command:

```
pnpm dev
```

The services will be available at the following urls by default.

* TrustUK - [localhost:3002](localhost:3002)
* HomebuyingUK - [localhost:3001](localhost:3001)
* PropertyPrepper - [localhost:3003](localhost:3003)
* TrustGraph - [localhost:3004](localhost:3004)

Grab the did generated for your local TrustUK entity. Easiest way is probably one of:
* using TrustSight, hover over the avatar and copying it. (not very sophisticated i know)
* go to the built [trust establishment doc](apps/ddiatf/public/diaatf.json) and copy the author value.

You can then use that did in TrustGraph to get the visualisation.



#### Changing the backbone
To change the trust backbone, e.g. add new trust assertions, trust docs, entities. 
The trust-backbone model should be updated. See the [readme](./packages/trust-backbone/README.md) for it.


When you change the model and want to see the changes in dev. You need run this inside `/packages/trust-backbone`.

```bash
pnpm run build local
```

Before pushing any changes, you must rebuild the trust backbone properly for deployment. 
You need the right `kmsSecretKey` to do this, which only I have. 
So let me know if you ever get to this point.

```bash
pnpm build demo
```

This should all be nicer, with dev commands setup to auto rebuild and CI to build for prod on push. 
But i got a bit stuck, see [here](./packages/trustbench/README.md#result).

---
### Remote Caching

I haven't enabled any of the remote caching stuff.

Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)
