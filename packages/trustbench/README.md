# TrustBench

The HomebuyingUK demo consists of 3 entities, 2 of which publish trust establishment docs, 
all of which need did configuration docs. 
These resources have to reference each others dids, and reference their own topic schemas.
When constructing the demo, I realised this was a rather annoying thing to manage.
Especially when you have multiple environments in which the references are different 
(e.g. different URLs and DIDs in dev vs prod).
And that's not even talking about actually creating the DIDs, and signing credentials. 

I created this tool to solve that problem for myself. But I think it would be useful for others too. 

It supports using veramo or web5.js under the hood. It will default to veramo. To publish to a DWN, the `publishWithWeb5` config must be used. 
In which case web.js  will be used.

Warning: its rather janky, especially the lockfile behaviour.
But it generally works and its pretty cool


## Hypothesis
We should be able to construct a model that describes a setup of entities and trust resources such as the one described above. 
The model will use relative references to link the things that need linking, 
and so the model will be internally consistent.

We should be able to build a model for different environments by passing in an absolute reference for each relative reference. 
When building, the relative references are replaced and standards compliant output resources are generated (e.g. did configurations and trust establishment docs). 


Additionally, we should not have to provide literal values for absolute references, but instead get the tool to generate them for us (e.g. dids, uuids etc) 
AND have the tools reuse the generated absolute values in subsequent builds where it *makes sense:tm*:. 
So that we get stable identifiers.

Perhaps stupidly, we can create our own structure for describing these trust resources that's optimised for authorship rather than publishing,
because at build time we can transform it into the publish friendly representation.

It should be possible to build and publish a model in a CI / automated pipeline.

The output should be publishable using a mixture of different strategies. We will target
* A webserver - by writing to a directory suitable to be hosted by a webserver (e.g. public directory) with no additional config required. Did configurations obviously need to be published in this way.
* DWN - writing directly to a DWN using `web5` as the final part of the build step.

## Result
Almost all of this is implemented for did configurations, trust establishment docs and topic schemas.

Currently,  DWN publishing is only implemented for trust establishment docs and NOT their topic schemas. 
So if you added a new topic to your trust establishment doc and published to web5 without also publishing the topics to your website, the topic schemas would not be resolvable.
Should be possible using a [did relative url](https://identity.foundation/decentralized-web-node/spec/#did-relative-urls).

I felt like I almost cracked the CI thing but then got stuck. See [build-pipelines](#build-pipelines). 

The current lock behaviour does almost 0 detection of when something has changed that should cause a locked identifier to be regenerated.
So in practice you pretty often end up nuking the lock. 
Should be possible to do this properly just takes time and this was good enough for now. 

## How it works

You can see an example of its usage [here](../trust-backbone/README.md), used to generate the trust backbone for the TrustSight demo.

### The Model
A model is filesystem based.
- An **entity** means the same thing as in standard SSI parlance, generally its something that can be identified by a did.
- An entity is represented by a directory. The directory name defines the name of the entity.
- An entity can be referenced by a string like `"{entityName}"` e.g. entity is named "bob", reference is "bob". simple right! 
- A **symbol** is something that's used as an input to construct the output trust resources. There is not necessarily a one-to-one mapping between an input symbol and an output resource.
Sometimes there is, sometimes multiple symbols are used to construct a single output resource.
- A symbol is represented by a file. The filename is important, it looks like `"{symbolName}.{symbolType}.{extension}"`
- An entity controls the "symbols" placed inside of it (the directory). The directory structure *inside* an entity is not significant (you can organise symbols how you want).
- Currently, these symbols are supported (I need to create a JSON schema for each of these):
  - **topic** - JSON schema representing a topic, as used by a trust establishment document.
  - **subject** - The subject of trust assertions made by the controlling entity, as in a trust establishment document. Trust assertions are scoped to a topic. 
  A subject can reference an entity by using the same name (in fact a subject will implictly create an entity if one hasn't been explicitly defined).
  - **trustdoc** - A trust establishment document using a custom structure. The trust doc symbol only needs to name the topics it wants to publish. 
  At build time, the model will pull in all the trust assertions scoped to that topic, across subjects defined by the entity.
- A symbol can be referenced by a string resembling a file path, which looks like `"{entityName}/{symbolName}"`. 
The `"{entityName}/"` part can be omitted to reference a symbol inside the same controlling entity. 
(I should possibly commit to this idea and make it an actual file path).
- Some symbols can be referenced externally i.e. by other entities, and some can't. Subjects can't. Topics can. (I don't know how to make this explicit, but its generally intuitive I hope)
- Entities can be referenced within other entities (currently only as a subject)

### The Environment
An environment can be specified as a file of the form `{environmentName}.environment.json`. 
Mostly it lets you configure identifiers for entities, either as literal values or by controlling their generation.

It looks like this (currently the didType doesn't actually do anything, a did:key will be generated, or if using web5 a did:ion. todo yes I want to support the generation of did web documents):

```json
{
  "kmsSecretKey": "<SECRET>",
  "entities": {
    "dpdtf-admin": {
      "didType": "did:web",
      "origin": "http://localhost:3001",
      "didConfiguration": true
    },
    "estate-agent": {
      "didType": "did:key",
      "origin": "http://localhost:3002"
    },
    "property-pack-provider": {
      "didType": "did:key",
      "origin": "http://localhost:3003"
    },
    "ddsit": {
      "didType": "did:key",
      "origin": "http://localhost:3004",
      "didConfiguration": {
        "jwt": true,
        "json-ld": false
      }
    },
    "dif": {
      "did": "did:key:z6MkoTHsgNNrby8JzCNQ1iRLyW5QQ6R8Xuu6AA8igGrMVPUM"
    }
  }
}
```

Each key in the properties object is an entity name.
If it matches an entity found in the model it will be used replace its relative references.

You can provide literal dids, but there's currently no real mechanism to import keys (other than copy in a veramo sqlite db), 
so you couldn't have such an entity generate/sign a did configuration for example. 
So right now literal dids are only really usable to identify external identities you don't control (which is still useful)

The origin is used for URL IDs (e.g. topic schemas) and inside did configuration documents. 
ATM an entity can only have a single did and a single origin.

//TODO: it should be possible to not use a model. If you just want to generate a did configuration for an entity for example. 
you can do that purely with an environment file. Also i'm not sure i like the term environment much, 
I think it should be a different word. Maybe `identifiers` would be better? Probably too literal though.

### The Environment Lock
After a successful build TrustBench will write an environment-lock file that looks likes `{environmentName}.environment-lock.json`.
This is so that later it can reuse the identifiers (like dids and resource uuids etc) that it has generated previously.

Unfortunately this behavour is super janky right now, so if something isn't building probably its likely that deleting the environment-lock file will help. If you delete the environment-lock you MUST also delete the 
`{environmentName}.sqlite` file and the `web5data-{environmentName}` dir. Otherwise, the build will likely fail (I should probably fix this)

(yes i need to keep all this stuff more organised, todo: have a `.{environmentName}` dir and put all the lock and persistence stuff in there)

### Key Management

TrustBench will default to using Veramo for managing keys, creating dids, signing credentials etc. 
Veramo managed keys are stored in an sqlite database written to whatever directory you ran `build` from. 
The db file looks like `{environmentName}.sqlite`

if `publishWithWeb5` is set to true, web5 will be used instead of veramo. web5 will put its data in the `web5data-{environmentName}` directory (relative to where you ran `build`)

### Kms Secret Key
A kms secret key must be set to encrypt the keys (as above) with. This can be included in the environment file directly which is fine for things like dev.
Or it can set using the environment variable `TRUSTBENCH_KMS_SECRET_KEY`. The environment file value will take precedence over the environment variable if both are present.

### Usage
Currently, trust bench exports a single function:
```
build(environmentName: string, modelDir: string = './model')
```
It accepts an environment name, and an optional path to the model directory, which defaults to "./model".
This can be used in conjunction with environment files to build your trust setup for different environments.

You must write a js or ts file to call `build` yourself, yes this annoying, yes there should be a cli.  

//todo

I should add an option to specifiy the output directory. Currently, it uses dist/{environmentName}.

There should be a cli, and it would actually make sense for TrustBench to build to a native executable 
(aka rewrite it in rust)


### Build Pipelines
Ideally, one would run TrustBench `build` as part of a build pipeline. Both locally as part of your dev environment, and in CI for your preview / prod / etc environment.

An important thing to consider is whether you need stable identifiers, and if so, how are you going to manage the keys for them?
Let's have a look at what this means in practice.

**Local Environment**

In your local environment its easy. Stable identifiers aren't needed, they do not need to be shared. Just .gitignore all your local environment and database ("{environmentName}.sqlite") files, no one needs to see it.


**Ephemeral Environments (aka preview)** 

When you don't need stable identifiers (backed by keys) across deployments (i.e. preview), but you want to build remotely. You could commit an environment file but not its lock or database file, 
and have everything generated at build time and then throw away the identifiers and keys. 
This is the big benefit of TrustBench, its easy to regenerate everything. 
TrustBench should have a way to override environment values with system environment variables, so you could build with an origin based on your temporary preview url for example, but currently it does not. I'm not sure what this should look like yet.

**Persistent environments (aka prod)**

When you do care about stable identifiers you must commit your environment-lock and you can either:
1. commit your TrustBench managed key store (veramo: `{environmentName}.sqlite`, web5 - `web5data-{environmentName}` (this is ugly atm cus it uses leveldb)) file and provide your `KMS_SECRET` as a system environment variable at build time. 
This isn't quite as bad as it sounds, because the keys in the sqlite db are encrypted with the `KMS_SECRET`.
2. NOT YET SUPPORTED (but very doable): Host a standalone veramo instance, and have TrustBench connect to it as a client. 
Your veramo instance will then act as a remote key vault. This would be pretty dope.


#### Build Pipeline Further Work

Currently,
`build {env}` would have to be ran to construct the lockfile before pushing a change.
CI would then in theory run `build {env} --frozen-lockfile` (not implemented yet).
This doesn't feel great but I could probably live with that. There's still a couple problems

* TrustBench needs to clean up after the previous run before writing to the `additionalOutDir` (the webserver publish target). The current lockfile has enough information to do this. But to do this with a `--frozen-lockfile` (as would be run on ci) the lockfile would need to store publish history for the past 2 runs. This feels weird to me.
* How to ensure the resources that get published to the `additionalOutDir` do not get committed / pushed?. Intuitively these shouldn't get committed because they can be `built`. You can't `.gitignore` the whole  `additionalOutDir` like you would `node_modules`. 


Either, have TrustBench store past 2 publishes. And before pushing a change you don't run `build` instead you run something 
like `freeze` which cleans up the state of your local `additionalOutDir`, constructs the lockfile but doesn't write to `additionalOutDir`.

Or, i rethink this package manager style approach. Maybe there's an approach like db migrations. 
Maybe there's an approach like DB branching.

### SSI Provider
An SSI provider does stuff like generate dids, manage keys, create and sign credentials.

TrustBench currently supports two "ssi providers"

* `veramo` is the default
* `web5` is used when `publishWithWeb5` is true

There was a period where both were used at the same time, it was rather painful. I realised I could get web5 to do everything that was needed right now.
In the future there may still be a need to use more than one at once (will web5 support VC-JSON-LD?), which to do probably requires them all using a shared KMS.


### Publisher
TrustBench currently supports two publishing strategies. 
* filesystem (used to host on a webserver)
* DWN

To publish with DWN, the `web5` ssi provider must be used (this will happen automatically). 
This means that enabling DWN publishing with `publishWithWeb5` for a project already built without it will get TrustBench confused.
ATM you need to delete the lock, and have all new identifiers generated.