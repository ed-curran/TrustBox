# TrustBench

The demo for TrustSight consists of 3 entities, 2 of which publish trust establishment docs, 
all of which need did configuration docs. 
These resources have to reference each others dids, and reference their own topic schemas.
When constructing the demo, I realised this was a rather annoying thing to manage.
Especially when you have multiple environments in which the references are different 
(e.g. different URLs and DIDs in dev vs prod).
And that's not even talking about actually creating the DIDs, and signing credentials.

I created this tool to solve that problem for myself. But I think it would be useful for others too.

Warning: its rather janky, especially the lockfile behaviour.
But it generally works and its pretty cool


## Hypothesis
We should be able to construct a model that describes a setup of entities and trust resources such as the one described above. 
The model will use relative references to link the things that need linking, 
and so the model will be internally consistent.

We should be able to build a model for different environments by passing in an absolute reference for each relative reference. 
When building, the relative references are replaced and the generated output is placed somewhere as a directory, 
suitable to be hosted by (for now) a webserver (e.g. public directory) with no additional config required.

Additionally, we should not have to provide literal values for absolute references, but instead get the tool to generate them for us (e.g. dids, uuids etc) 
AND have the tools reuse the generated absolute values in subsequent builds where it *makes sense:tm*:. 
So that we get stable identifiers.

Perhaps stupidly, we can create our own structure for describing these trust resources that's optimised for authorship rather than publishing,
because at build time we can transform it into the publish friendly representation.


## How it works

You can see an example of its usage [here](../demo-trust-backbone/README.md), used to generate the trust backbone for the TrustSight demo.

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

It looks like this (currently the didType doesn't actually do anything lel, always a did:key will be generated - todo yes I want to support the generation of did web documents):

```json
{
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
After a successful build TrustBench will write an environment-lock file, that looks likes `{environmentName}.environment-lock.json`.
This is so that later, it can reuse the identifiers (like dids and resource uuids etc) that it has generated previously.

Unfortunately this behavour is super janky right now, so if something isn't building probably its likely that deleting the environment-lock file will help. If you delete the environment-lock you MUST also delete the 
`{environmentName}.sqlite` file. Otherwise, the build will likely fail (I should probably fix this)

### The Key Management Database

With the current veramo setup, keys for generated DIDs are stored in an sqlite database managed by veramo
and dumped in whatever directory you ran `build` from. The db file looks like `{environmentName}.sqlite`

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

Maybe TrustBench should just build all environments that it finds in the current directory.


### Build Pipelines
Ideally, one would run TrustBench `build` as part of a build pipeline. Both locally as part of your dev environment, and in CI for your preview / prod / etc environment.

An important thing to consider is whether you need stable identifiers, and if so how are you going to manage the keys for them?
Let's have a look does at what this means in practice.

**Local Environment**

In your local environment its easy, stable identifiers aren't needed, they do not need to be shared. Just .gitignore all your local environment and database ("{environmentName}.sqlite") files, no one needs to see it.


**Ephemeral Environments (aka preview)** 

When you don't need stable identifiers (backed by keys) across deployments (i.e. preview), but you want to build remotely. You could commit an environment file but not its lock or database file, 
and have everything generated at build time and then throw away the identifiers and keys. 
This is the big benefit of TrustBench, its easy to regenerate everything. 
TrustBench should have a way to override environment values with system environment variables, so you could build with an origin based on your temporary preview url for example, but currently it does not. I'm not sure what this should look like yet.

**Persistent environments (aka prod)**

When you do care about stable identifiers you must commit your environment-lock and you can either:
1. commit your `{environmentName}.sqlite` file and provide your `KMS_SECRET` as a system environment variable at build time. 
This isn't quite as bad as it sounds, because the keys in the sqlite db are encrypted with the `KMS_SECRET`, but its still not great.
2. NOT YET SUPPORTED (but very doable): Host a standalone veramo instance, and have TrustBench connect to it as a client. 
Your veramo instance will then act as a remote key vault. This would be pretty dope.





### SSI Provider
Veramo is included as an "SSI Provider" to generate dids and create credentials. 
In theory, it should be easy to plug in different providers for this. 
It's just an interface with a couple functions. 
All the functionality around replacing references and using stable identifiers is implemented outside the SSI provider, using the lockfile etc.