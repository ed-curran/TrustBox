import React from "react";

function LinkOutline({ children, addClass }): React.ReactNode {
  return (
    <a
      className={`font-medium tracking-wide py-2 px-5 sm:px-8 border border-orange-500 text-orange-500 bg-white-500 outline-none rounded-l-full rounded-r-full capitalize hover:bg-orange-500 hover:text-white transition-all hover:shadow-orange  ${addClass}`}
      href="https://chrome.google.com/webstore/detail/trustsight/gkodecajacijdbagcleeadfpbbdloblc"
      target={"_blank"}
      rel="noopener"
    >
      {children}
    </a>
  );
}

export default LinkOutline;
