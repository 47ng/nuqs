#!/usr/bin/env zx
// @ts-check

import MailPace from '@mailpace/mailpace.js'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'
import 'zx/globals'

const canaryRegexp = /^(\d+)\.(\d+)\.(\d+)-canary\.(\d+)$/

const env = createEnv({
  server: {
    MAILPACE_API_TOKEN: z.string(),
    EMAIL_ADDRESS_FROM: z.string().email(),
    EMAIL_ADDRESS_TO: z.string().email()
  },
  isServer: true,
  runtimeEnv: process.env
})

main()

const fileSchema = z.object({
  filename: z.string(),
  patch: z.string().optional()
})

async function main() {
  const thisVersion = argv.version
  const previousVersion = getPreviousVersion(argv.version)

  if (!previousVersion) {
    console.log('No previous version to compare with')
    process.exit(0)
  }
  const compareURL = `https://api.github.com/repos/vercel/next.js/compare/v${previousVersion}...v${thisVersion}`
  const compare = await fetch(compareURL).then(res => res.json())
  const files = z.array(fileSchema).parse(compare.files)
  const appRouterFile = files.find(
    file =>
      file.filename === 'packages/next/src/client/components/app-router.tsx'
  )
  if (!appRouterFile) {
    console.log('No changes in app-router.tsx')
    process.exit(0)
  }
  sendNotificationEmail(thisVersion, appRouterFile)
}

// --

/**
 * @param {string} version
 */
function getPreviousVersion(version) {
  const match = canaryRegexp.exec(version)
  if (!match || !match[4]) {
    return null
  }
  const canary = parseInt(match[4])
  if (canary === 0) {
    return null
  }
  return `${match[1]}.${match[2]}.${match[3]}-canary.${canary - 1}`
}

/**
 *
 * @param {string} thisVersion
 * @param {z.infer<typeof fileSchema>} appRouterFile
 * @returns
 */
function sendNotificationEmail(thisVersion, appRouterFile) {
  const client = new MailPace.DomainClient(env.MAILPACE_API_TOKEN)
  const body = `Changes to the app router have been published in Next.js ${thisVersion}.

Release: https://github.com/vercel/next.js/releases/tag/v${thisVersion}

${
  appRouterFile.patch
    ? `The patch is:
  \`\`\`diff
  ${appRouterFile.patch}
  \`\`\``
    : 'No patch available'
}
`
  console.info('Sending email')
  console.info(body)
  return client.sendEmail({
    from: env.EMAIL_ADDRESS_FROM,
    to: env.EMAIL_ADDRESS_TO,
    subject: `[nuqs] Next.js ${thisVersion} has app router changes`,
    textbody: body,
    tags: ['nuqs']
  })
}
