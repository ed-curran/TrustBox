# HomebuyingUk (FKA. DPDTF)

This is a simple demonstration site playing the role of a trust framework author, and a scheme within  [TrustUk](../docs/README.md). 
Specifically, this trust framework is modeled after the [Property Data Trust Framework](https://propdata.org.uk/) (PDTF)
created by the [Home Buying and Selling Group](https://homebuyingandsellinggroup.co.uk/), and now managed by the [Open Property Data Association ](https://openpropdata.org.uk/).
The PDTF seeks to enable people and organisation within the UK to exchange trustworthy property data more easily. 
Its significant contribution currently is the publication of [data schemas](https://github.com/Property-Data-Trust-Framework/schemas) describing standardised property data.

This demonstration aims to show how the PDTF might define which organisations
are participating in the trust framework, including what their roles are, using a [trust establishment document](https://identity.foundation/trust-establishment/). 
And crucially, how it can communicate that effectively to end users (generally buyers and sellers of properties).
Additionally, it integrates with [TrustUk](../docs/README.md) to demonstrate how the PDTF could be recognised as a scheme, 
therefore providing it a measure of trustworthiness in the eyes of users. 
This shows how trust can be "chained", or form a web of relationships.

The demonstration site is intended to be used with [TrustSight](https://chromewebstore.google.com/detail/trustsight/gkodecajacijdbagcleeadfpbbdloblc), a chrome extension that gives users visibility
of the trust information baked into the background of the site.

As usual, the trust backbone has been generated from a [trust model](../../packages/demo/README.md) using [TrustBench](../../packages/trustbench/README.md).
The DPDTF site maps to the `dpdtf` entity in the model.






## The Site

The site is based on a free, MIT licensed template: https://github.com/naufaldi/next-landing-vpn
the original license is included in this repo at: [LICENCE](LICENSE). I modified it to use the app router, and made the site simpler.




This is a standard next-js app:

### Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

To create [API routes](https://nextjs.org/docs/app/building-your-application/routing/router-handlers) add an `api/` directory to the `app/` directory with a `route.ts` file. For individual endpoints, create a subfolder in the `api` directory, like `api/hello/route.ts` would map to [http://localhost:3001/api/hello](http://localhost:3001/api/hello).

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn/foundations/about-nextjs) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_source=github.com&utm_medium=referral&utm_campaign=turborepo-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
