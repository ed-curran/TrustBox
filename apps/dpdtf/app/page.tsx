import Hero from "../components/hero";
import Layout from "../components/Layout/layout";
import SeoHead from "../components/seo-head";

export default function Page(): JSX.Element {
  return (
    <>
      <SeoHead title="HomebuyingUK" />
      <Layout>
        <Hero />
      </Layout>
    </>
  );
}
