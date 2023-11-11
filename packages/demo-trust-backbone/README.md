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

