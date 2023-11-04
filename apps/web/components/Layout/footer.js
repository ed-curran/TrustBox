import React from "react";
import Image from "next/image";
import LogoVPN from "../../public/assets/Logo.svg";
import Facebook from "../../public/assets/Icon/facebook.svg";
import Twitter from "../../public/assets/Icon/twitter.svg";
import Instagram from "../../public/assets/Icon/instagram.svg";

function Footer() {
  return (
    <div className="bg-white-300 pt-44 pb-24">
      <div className="max-w-screen-xl w-full mx-auto px-6 sm:px-8 lg:px-16 grid grid-rows-6 sm:grid-rows-1 grid-flow-row sm:grid-flow-col grid-cols-3 sm:grid-cols-12 gap-4">
        <div className="row-span-2 sm:col-span-4 col-start-1 col-end-4 sm:col-end-5 flex flex-col items-start ">
          <Image alt="map" className="h-8 w-auto mb-6" src={LogoVPN}/>
          <p className="mb-4">
            The <strong className="font-medium">Demo Property Data Trust Framework</strong> exists to connect consumers and members of the homebuying and selling industry together.
            So that
          </p>
          <div className="flex w-full mt-2 mb-8 -mx-2">
            <div className="mx-2 bg-white-500 rounded-full items-center justify-center flex p-2 shadow-md">
              <Image alt="map" className="h-6 w-6" src={Facebook}/>
            </div>
            <div className="mx-2 bg-white-500 rounded-full items-center justify-center flex p-2 shadow-md">
              <Image alt="map" className="h-6 w-6" src={Twitter}/>
            </div>
            <div className="mx-2 bg-white-500 rounded-full items-center justify-center flex p-2 shadow-md">
              <Image alt="map" className="h-6 w-6" src={Instagram}/>
            </div>
          </div>
          <p className="text-gray-400">©{new Date().getFullYear()} - LaslesVPN</p>
        </div>

        <div className="row-span-2 sm:col-span-2 sm:col-start-11 sm:col-end-13 flex flex-col">
          <p className="text-black-600 mb-4 font-medium text-lg">Engage</p>
          <ul className="text-black-500">
            <li className="my-2 hover:text-orange-500 cursor-pointer transition-all">
              FAQ{" "}
            </li>
            <li className="my-2 hover:text-orange-500 cursor-pointer transition-all">
              About Us{" "}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Footer;