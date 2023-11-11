## Demo Digital Identity and Attributes Trust Framework (DDIATF)

This is a simple demonstration site playing the role of a trust framework author. 
Specifically, this author is modelled after the department for science, innovation and technology (DSIT) in the UK.
That would administer the UKs [Digital Identity and Attributes Trust Framework](https://www.gov.uk/government/publications/uk-digital-identity-and-attributes-trust-framework-beta-version/uk-digital-identity-and-attributes-trust-framework-beta-version), a beta policy paper in the UK that would govern digital identity and trust. 
The policy describes the concept of schemes, that would allow industries to create domain specific trust frameworks that are certified by DSIT. 

To show how this might work, this demonstration site publishes a trust framework (as a [trust establishment document](https://identity.foundation/trust-establishment/)) 
that identifies scheme operators. 
One of the schemes is the [Demo Property Data Trust Framework](../web/README.md) (DPDTF).

The demonstration site is intended to be used with [TrustSight](https://chromewebstore.google.com/detail/trustsight/gkodecajacijdbagcleeadfpbbdloblc), a chrome extension that gives users visibility
of the trust information baked into the background of the site.

As usual, the trust backbone has been generated from a [trust model](../../packages/demo/README.md) using [TrustBench](../../packages/trustbench/README.md). 
The DDIATF site maps to the `ddsit` (Demo DSIT) entity in the model.



## The Site

The site is based on a free, MIT licensed template: https://github.com/web3templates/nextly-template
the original license is included in this repo at: [LICENCE](LICENSE). I modified it to use the app router, and made the site simpler.


This is a standard next-js app (with tailwind for styling):

### Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

To create [API routes](https://nextjs.org/docs/app/building-your-application/routing/router-handlers) add an `api/` directory to the `app/` directory with a `route.ts` file. For individual endpoints, create a subfolder in the `api` directory, like `api/hello/route.ts` would map to [http://localhost:3002/api/hello](http://localhost:3002/api/hello).

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn/foundations/about-nextjs) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_source=github.com&utm_medium=referral&utm_campaign=turborepo-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
