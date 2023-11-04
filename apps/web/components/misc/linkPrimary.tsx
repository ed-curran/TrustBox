import React from "react";

export const LinkPrimary = ({ children, addClass }) => {
  return (
    <a
      href={'dpdtfExample.json'}
      className={
        "py-3 lg:py-4 px-12 lg:px-16 text-white-500 font-semibold rounded-lg bg-orange-500 hover:shadow-orange-md transition-all outline-none " +
          addClass
      }
      >
      {children}
      </a>
  );
};
