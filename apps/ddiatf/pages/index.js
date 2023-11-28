import Head from "next/head";
import Hero from "../components/hero";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const Home = () => {
  return (
    <>
      <Head>
        <title>TrustUK</title>
        <meta name="description" content="Trust UK" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <Hero />
      <Footer />
    </>
  );
};

export default Home;
