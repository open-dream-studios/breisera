// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;


// const isPlayer = process.env.PLAYER === 'true';

// const nextConfig = {
//   reactStrictMode: true,
//   // experimental: {
//   //   appDir: true,
//   // },
//   rewrites: async () => {
//     return isPlayer
//       ? [
//           {
//             source: '/watch/:id*',
//             destination: '/(player)/watch/:id*',
//           },
//         ]
//       : [
//           {
//             source: '/home',
//             destination: '/(app)/home',
//           },
//         ];
//   },
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const isPlayer = process.env.PLAYER === 'true';

const nextConfig = {
  reactStrictMode: true,
  basePath: isPlayer ? '' : '',
  // no experimental section needed
};

export default nextConfig;