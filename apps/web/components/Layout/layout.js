import React from "react";
import Footer from "./footer";

function Layout({ children }) {
  return (
    <>
      {/*<Header />*/}
      {children}
      <Footer />
    </>
  );
}

export default Layout;
