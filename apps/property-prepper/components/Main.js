export default function Main() {
  return (
    <section class="text-gray-600 body-font">
      <div class="max-w-5xl pt-52 pb-24 mx-auto">
        <h1 class="text-80 text-center font-4 lh-6 ld-04 font-bold text-white mb-6">
            Prepare your property for its new home
        </h1>
        <h2 class="text-2xl font-4 font-semibold lh-6 ld-04 pb-11 text-gray-700 text-center">
          Property prepper gives your home's digital twin a makeover.
          <br />
          So that it always looks its best for moving day
        </h2>
        <div className="ml-6 text-center">
          <a
            className="inline-flex items-center py-3 font-semibold text-black transition duration-500 ease-in-out transform bg-transparent bg-white px-7 text-md md:mt-0 hover:text-black hover:bg-white focus:shadow-outline"
            href="/"
          >
            <div className="flex text-lg">
              <span className="justify-center">Get Property Pack</span>
            </div>
          </a>
          <a
            className="inline-flex items-center py-3 font-semibold tracking-tighter text-white transition duration-500 ease-in-out transform bg-transparent ml-11 bg-gradient-to-r from-blue-500 to-blue-800 px-14 text-md md:mt-0 focus:shadow-outline"
            href="https://chromewebstore.google.com/detail/trustsight/gkodecajacijdbagcleeadfpbbdloblc"
            target={"_blank"}
            rel="noopener"
          >
            <div className="flex text-lg">
              <span className="justify-center">Get TrustSight</span>
            </div>
          </a>
        </div>
      </div>
      <div className="container flex flex-col items-center justify-center mx-auto">
        <img
          className="object-cover object-center w-3/4 mb-10 shadow-md g327"
          alt="Image of a home being prepared for moving on a flatbed truck"
          src="/images/property-prepper-landing-slim.png"
        ></img>
      </div>
    </section>
  );
}
