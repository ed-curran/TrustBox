import Head from "next/head";
import Hero from "../components/hero";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const Home = () => {
  return (
    <>
      <Head>
        <title>Demo Digital Identity Trust Framework</title>
        <meta
          name="description"
          content="Demo Digital Identity and Attributes Trust Framework"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <Hero />
      <Footer />
    </>
  );
}

export default Home;