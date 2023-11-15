# Demo Trust Backbone

This package contains 
 - A model defining the trust backbone for the TrustSight demo.
 - Environments to build that model with (probably gitignored though)
 - Build script to call TrustBench to build the model and place the outputs in the public directory 
of the appropriate demo site (in /apps)

The trust backbone consists of these entities:

`ddsit` (hosted at [Demo Digital Identity and Attributes Trust Framework](../../apps/docs/README.md))
- a did configuration
- a trust establishment doc with 
  - one topic ("scheme-operator")
  - assertions about DDIATF using this topic

`dpdtf` (hosted at [Demo Property Data Trust Framework](../../apps/web/README.md))

- a did configuration
- a trust establishment doc with 
  - two topics ("pdtf-participant" and "pdtf-issuer")
  - assertions referencing the DEA using these topics

`demo-property-pack-provider` (maps to Demo Estate Agent)
- a did configuration

## Setup

To set up a local environment run

```bash
pnpm run init
```

This will create a `local.environment.json` for you - including a fresh `kmsSecretKey`.

Then use 

```bash
pnpm build local
```

to build the apps with a local trust backbone (e.g. with localhost origins). 
You should rerun this whenever you change the model.

Before pushing any changes, you must run 

```bash
pnpm build demo
```

To rebuild the trust backbone properly for deployment. 

This should all be nicer, with dev commands setup to auto rebuild and CI to build for prod on push.
Even then though running `pnpm build demo` would still be required to construct the lockfile correctly. 
before CI. And CI run with frozen-lockfile or whaetver (which isn't a thing yet)
