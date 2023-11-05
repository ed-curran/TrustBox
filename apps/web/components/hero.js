"use client"

import React, { useMemo } from "react";
import Image from "next/image";
import {motion} from "framer-motion";
import getScrollAnimation from "../utils/getScrollAnimation";
import ScrollAnimationWrapper from "./Layout/scroll-animation-wrapper";
import LinkPrimary from "./misc/link-primary";

function Hero({
  listUser = [
    {
      name: "Data Providers",
      number: "10",
      icon: "/assets/Icon/heroicons_sm-user.svg",
    },
    {
      name: "Data Consumers",
      number: "10",
      icon: "/assets/Icon/gridicons_location.svg",
    },
    {
      name: "Credential Types",
      number: "5",
      icon: "/assets/Icon/bx_bxs-server.svg",
    },
  ],
}) {
  const scrollAnimation = useMemo(() => getScrollAnimation(), []);

  return (
    <div
      className="max-w-screen-xl mt-24 px-8 xl:px-16 mx-auto"
      id="about"
    >
      <ScrollAnimationWrapper>
          <motion.div
            className="grid grid-flow-row sm:grid-flow-col grid-rows-2 md:grid-rows-1 sm:grid-cols-2 gap-8 py-6 sm:py-16"
            variants={scrollAnimation}>
            <div className=" flex flex-col justify-center items-start row-start-2 sm:row-start-1">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-medium text-black-600 leading-normal">
                <strong>Demo Property Data Trust Framework</strong>.
              </h1>
              <p className="text-black-500 mt-4 mb-6">
                Streamlining the homebuying process with safe & trusted property data
              </p>
              <LinkPrimary>Trust Framework</LinkPrimary>
            </div>
            <div className="flex w-full">
              <motion.div className="h-full w-full" variants={scrollAnimation}>
                <Image
                  alt="VPN Illustrasi"
                  height={383}
                  quality={100}
                  src="/assets/Illustration1.png"
                  width={612}
                />
              </motion.div>
            </div>
          </motion.div>
      </ScrollAnimationWrapper>
      <div className="relative w-full flex">
        <ScrollAnimationWrapper
          className="rounded-lg w-full grid grid-flow-row sm:grid-flow-row grid-cols-1 sm:grid-cols-3 py-9 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-gray-100 bg-white-500 z-10">
          {listUser.map((listUsers, index) => (
            <motion.div
              className="flex items-center justify-start sm:justify-center py-4 sm:py-6 w-8/12 px-4 sm:w-auto mx-auto sm:mx-0"
              custom={{duration: 2 + index}}
              key={listUsers.name}
              variants={scrollAnimation}
            >
              <div className="flex mx-auto w-40 sm:w-auto">
                <div className="flex items-center justify-center bg-orange-100 w-12 h-12 mr-6 rounded-full">
                  <Image className="h-6 w-6" src={listUsers.icon} width={24} height={24}/>
                </div>
                <div className="flex flex-col">
                  <p className="text-xl text-black-600 font-bold">
                    {listUsers.number}+
                  </p>
                  <p className="text-lg text-black-500">{listUsers.name}</p>
                </div>
              </div>
            </motion.div>
          ))}
       </ScrollAnimationWrapper>
       <div
          className="absolute bg-black-600 opacity-5 w-11/12 roudned-lg h-64 sm:h-48 top-0 mt-8 mx-auto left-0 right-0"
          style={{ filter: "blur(114px)" }}
        />
      </div>
    </div>
  );
}

export default Hero;
