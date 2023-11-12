import Image from "next/image";
import Container from "./container";
import heroImg from "../public/img/hero.png";

const Hero = () => {
  return (
    <>
      <Container className="flex flex-wrap ">
        <div className="flex items-center w-full lg:w-1/2">
          <div className="max-w-2xl mb-8">
            <h1 className="text-4xl font-bold leading-snug tracking-tight text-gray-800 lg:text-4xl lg:leading-tight xl:text-6xl xl:leading-tight dark:text-white">
              Demo Digital Identity and Trust Attributes Framework
            </h1>
            <p className="py-5 text-xl leading-normal text-gray-500 lg:text-xl xl:text-2xl dark:text-gray-300">
              The Demo Digital Identity and Trust Attributes Framework (DDIATF) supports
              individuals to share their information safely and easily.
              It provides a set of rules for organisations to follow, and empowers people to make informed
              decisions about the services they engage with. Including the information they share.
            </p>

            <div className="flex flex-col items-start space-y-3 sm:space-x-4 sm:space-y-0 sm:items-center sm:flex-row">
              <a
                href="/diaatf.json"
                target="_blank"
                rel="noopener"
                className="px-8 py-4 text-lg font-medium text-center text-white bg-indigo-600 rounded-md mr-6">
                Trust Framework
              </a>
              <a
                href="https://chrome.google.com/webstore/detail/trustsight/gkodecajacijdbagcleeadfpbbdloblc"
                target="_blank"
                rel="noopener"
                className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Image  width="64"
                        height="64"
                        className="w-10 h-10"
                        src={'/img/trust-sight-128.png'}
                        alt={'TrustSight logo, a stylised lighthouse with a handshake below it'}/>
                <span className={'text-2xl'}> Get TrustSight</span>
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center w-full lg:w-1/2">
          <div className="">
            <Image
              src={heroImg}
              width="616"
              height="617"
              className={"object-cover"}
              alt="Hero Illustration"
              loading="eager"
              placeholder="blur"
            />
          </div>
        </div>
      </Container>
      <Container>
        <div className="flex flex-col justify-center">
          <div className="text-xl text-center text-gray-700 dark:text-white">
            Certifies <span className="text-indigo-600">1</span>{" "}
            trust schemes across the UK
          </div>


          <div className="flex flex-wrap justify-center gap-5 mt-6 md:justify-around">
            <a href={'https://trust-sight-dpdtf.vercel.app/'}>
              <div className="text-gray-400 dark:text-gray-400 ">
               <Image className='mx-auto' width={64} height={64} src={'/img/dpdtf-logo-128.png'} alt={'A logo of a house with a keyhole at the center'}/>
                <p className={'text-center'}>Demo Property Data <br/> Trust Framework</p>
              </div>
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}

export default Hero;