/** @type {import("prettier").Config} */
const config = {
  singleQuote: true,
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
};

module.exports = config;
