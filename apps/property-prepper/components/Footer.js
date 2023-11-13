import React from "react";

export default function Footer() {
  return (
    <footer className="pb-4 text-gray-200 pt-32">
      <div className="max-w-5xl xl:max-w-5xl mx-auto divide-y divide-gray-900 px-4 sm:px-6 md:px-8">
        <div className="text-sm font-medium">
            <h2 className="text-2xl tracking-wide text-white mb-1">About</h2>
            <p>
                <strong>Property Prepper</strong> is a fictional service create for the TrustSight demo. Find out  <a className={'underline text-blue-600 hover:text-blue-800 visited:text-purple-600'} href={'https://github.com/ed-curran/trustsight-demo'}>more.</a>
            </p>
        </div>
      </div>
    </footer>
  );
}
