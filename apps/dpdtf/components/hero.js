"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import getScrollAnimation from "../utils/getScrollAnimation";
import ScrollAnimationWrapper from "./Layout/scroll-animation-wrapper";
import LinkPrimary from "./misc/link-primary";
import LinkSecondary from "./misc/link-outline";

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
    <div className="max-w-screen-xl mt-24 px-8 xl:px-16 mx-auto" id="about">
      <ScrollAnimationWrapper>
        <motion.div
          className="grid grid-flow-row sm:grid-flow-col grid-rows-2 md:grid-rows-1 sm:grid-cols-2 gap-8 py-6 sm:py-16"
          variants={scrollAnimation}
        >
          <div className=" flex flex-col justify-center items-start row-start-2 sm:row-start-1">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-medium text-black-600 leading-normal">
              <strong>HomebuyingUK</strong>
            </h1>
            <p className="text-black-500 mt-4 mb-6">
              Streamlining the home buying and selling process with safe &
              trusted property data
            </p>
            <div className={"flex"}>
              <LinkPrimary addClass={"mb-8 mr-10"}>Trust Framework</LinkPrimary>
              <LinkSecondary
                addClass={
                  "h-14 py-3 lg:py-4 px-8 lg:px-12 flex-none text-justify-center"
                }
              >
                Get TrustSight
              </LinkSecondary>
            </div>
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
      <ScrollAnimationWrapper className="">
        <motion.div
          className="mt-10 relative w-full flex flex-col justify-center"
          custom={{ duration: 2 }}
          variants={scrollAnimation}
        >
          <div className="text-xl text-center text-gray-500">
            Certifies home buying and selling services across the UK
          </div>
          <div className="flex flex-wrap justify-center gap-5 mt-6 md:justify-around">
            <a
              className="z-50"
              href={"https://trust-sight-property-prepper.vercel.app"}
            >
              <div className="font-semibold">
                <Image
                  className="mx-auto"
                  width={64}
                  height={64}
                  src={"/assets/property-prepper-logo-256.png"}
                  alt={"A logo of a house with a keyhole at the center"}
                />
                <p className={"text-center"}>
                  PropertyPrepper <br />
                </p>
              </div>
            </a>
          </div>
        </motion.div>
      </ScrollAnimationWrapper>
      <div
        className="absolute bg-black-600 opacity-5 w-11/12 roudned-lg h-64 sm:h-48 top-0 mt-8 mx-auto left-0 right-0"
        style={{ filter: "blur(114px)" }}
      />
    </div>
  );
}

export default Hero;
