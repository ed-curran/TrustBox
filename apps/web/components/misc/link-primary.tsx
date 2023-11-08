import React from "react";

function LinkPrimary({ children, addClass }): React.ReactNode {
  return (
    <a
      className={`py-3 lg:py-4 px-12 lg:px-16 text-white-500 font-semibold rounded-lg bg-orange-500 hover:shadow-orange-md transition-all outline-none ${addClass}`}
      href="dpdtf.json"
    >
      {children}
    </a>
  );
}

export default LinkPrimary;
