import Head from "next/head";


// Default value for some meta data
const defaultMeta = {
  title: 'LaslesVPN',
  siteName: 'LaslesVPN',
  description:
    'Landing page VPN LaslesVPN Best VPN For Privacy, Country and Cheapest',
  // change base url of your web (without '/' at the end)
  url: 'https://next-landing-vpn.vercel.app',
  type: 'website',
  robots: 'follow, index',
  // change with url of your image (recommended dimension = 1.91:1)
  // used in twitter, facebook, etc. card when link copied in tweet/status 
  image: 'https://next-landing-vpn.vercel.app/assets/card-image.png',
  author: 'Lorem Ipsum'
};

/**
 * Next Head component populated with necessary SEO tags and title
 * props field used:
 * - title
 * - siteName
 * - description
 * - url
 * - type
 * - robots
 * - image
 * - date
 * - author
 * - templateTitle
 * all field are optional (default value defined on defaultMeta)
 * @example
 * <SeoHead title="Page's Title" />
 */
function SeoHead(props) {
  const meta = {
    ...defaultMeta,
    ...props
  };

  // Use siteName if there is templateTitle
  // but show full title if there is none
  meta.title = props.templateTitle
    ? `${props.templateTitle} | ${meta.siteName}`
    : meta.title;

  return (
    <Head>
      <title>{meta.title}</title>
      <meta content={meta.robots} name='robots' />
      <meta content={meta.description} name='description' />
      <meta content={`${meta.url}`} property='og:url' />
      <link href={`${meta.url}`} rel='canonical' />
      {/* Open Graph */}
      <meta content={meta.type} property='og:type' />
      <meta content={meta.siteName} property='og:site_name' />
      <meta content={meta.description} property='og:description' />
      <meta content={meta.title} property='og:title' />
      <meta content={meta.image} name='image' property='og:image' />
      {/* Twitter */}
      <meta content='summary_large_image' name='twitter:card' />
      <meta content='@F2aldi' name='twitter:site' />
      <meta content={meta.title} name='twitter:title' />
      <meta content={meta.description} name='twitter:description' />
      <meta content={meta.image} name='twitter:image' />
      {meta.date ? <>
          <meta content={meta.date} property='article:published_time' />
          <meta
            content={meta.date}
            name='publish_date'
            property='og:publish_date'
          />
          <meta
            content={meta.author}
            name='author'
            property='article:author'
          />
        </> : null}
      {/* Favicons */}
      {favicons.map((linkProps) => (
        <link key={linkProps.href} {...linkProps} />
      ))}
      {/* Windows 8 app icon */}
      <meta content='#F53838' name='msapplication-TileColor' />
      <meta
        content='/favicon/ms-icon-144x144.png'
        name='msapplication-TileImage'
      />
      {/* Accent color on supported browser */}
      <meta content='#F53838' name='theme-color' />
    </Head>
  );
}

// Favicons, other icons, and manifest definition
const favicons = [
  {
    rel: 'apple-touch-icon',
    sizes: '57x57',
    href: '/favicon/apple-icon-57x57.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '60x60',
    href: '/favicon/apple-icon-60x60.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '72x72',
    href: '/favicon/apple-icon-72x72.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '76x76',
    href: '/favicon/apple-icon-76x76.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '114x114',
    href: '/favicon/apple-icon-114x114.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '120x120',
    href: '/favicon/apple-icon-120x120.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '144x144',
    href: '/favicon/apple-icon-144x144.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '152x152',
    href: '/favicon/apple-icon-152x152.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/favicon/apple-icon-180x180.png',
  },
  {
    rel: 'mask-icon',
    href: '/favicon/safari-pinned-tab.svg',
    color: '#F59A9A',
  },
  {
    rel: 'icon',
    href: '/favicon/favicon.ico',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon/favicon-16x16.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon/favicon-32x32.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '96x96',
    href: '/favicon/favicon-96x96.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '192x192',
    href: '/favicon/android-icon-192x192.png',
  },
  {
    rel: 'manifest',
    href: '/site.webmanifest',
  },
];

export default SeoHead;