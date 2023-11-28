import Link from "next/link";
import Image from "next/image";
import React from "react";
import Container from "./container";

export default function Footer() {
  return (
    <div className="relative">
      <Container>
        <div className="grid max-w-screen-xl grid-cols-1 gap-10 pt-10 mx-auto mt-5 border-t border-gray-100 dark:border-trueGray-700 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div>
              {" "}
              <Link
                href="/"
                className="flex items-center space-x-2 text-2xl font-medium text-indigo-500 dark:text-gray-100"
              >
                <Image
                  src="/img/logo.png"
                  alt="N"
                  width="32"
                  height="32"
                  className="w-8"
                />
                <span>TrustUK</span>
              </Link>
            </div>

            <div className="max-w-md mt-4 text-gray-500 dark:text-gray-400">
              <strong className="font-medium">TrustUK</strong> exists to
              demonstrate the implementation of a trust framework using open
              standards. Find out on the{" "}
              <a
                className={
                  "underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                }
                href={"https://github.com/ed-curran/trustsight-demo"}
              >
                github repo
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
