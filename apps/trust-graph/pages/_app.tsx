import "../styles/globals.css";
import NextAdapterPages from "next-query-params/pages";
import {
  QueryParamAdapterComponent,
  QueryParamProvider,
} from "use-query-params";

export default function App({ Component, pageProps }) {
  return (
    <QueryParamProvider
      adapter={NextAdapterPages as QueryParamAdapterComponent}
    >
      <Component {...pageProps} />
    </QueryParamProvider>
  );
}
