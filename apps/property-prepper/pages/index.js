import Head from "next/head";
import Header from "../components/Header";
import Main from "../components/Main";
import Footer from "../components/Footer";
import { NextSeo } from "next-seo";

export default function Home() {
  return (
    <div className="text-black bg-black">
      <NextSeo
        title="Property Prepper"
        description="Welcome to Property Prepper"
        canonical="https://trust-sight-property-prepper.vercel.app"
        openGraph={{
          url: "https://trust-sight-property-prepper.vercel.app",
        }}
      />
      <Head>
        <title>Property Prepper</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Main />
      <Footer />
    </div>
  );
}
