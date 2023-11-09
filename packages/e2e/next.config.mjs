/** @type {import('next').NextConfig } */
const config = {
  basePath: process.env.BASE_PATH === '/' ? undefined : process.env.BASE_PATH
}

export default config
