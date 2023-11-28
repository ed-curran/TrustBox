import React from "react";
import Image from "next/image";

function Footer() {
  return (
    <div className="bg-white-300 pt-44 pb-24">
      <div className="max-w-screen-xl w-full mx-auto px-6 sm:px-8 lg:px-16 grid grid-rows-6 sm:grid-rows-1 grid-flow-row sm:grid-flow-col grid-cols-3 sm:grid-cols-12 gap-4">
        <div className="row-span-2 sm:col-span-4 col-start-1 col-end-4 sm:col-end-5 flex flex-col items-start ">
          <div className={"flex space-x-2 items-center mb-6 w-auto"}>
            <Image
              alt="map"
              className="h-8"
              height={32}
              width={32}
              src={"/assets/dpdtf-logo-128.png"}
            />
            <p className={"text-muted"}>HomebuyingUK</p>
          </div>
          <p className="mb-4">
            <strong className="font-medium">HomebuyingUK</strong> exists to
            demonstrate the implementation of a trust framework using open
            standards. Find out on the{" "}
            <a
              className={
                "underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
              }
              href={"https://github.com/ed-curran/trustsight-demo/tree/main"}
            >
              github repo
            </a>
          </p>
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
