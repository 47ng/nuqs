#!/usr/bin/env node
// @ts-check

import MailPace from '@mailpace/mailpace.js'
import { createEnv } from '@t3-oss/env-core'
import minimist from 'minimist'
import { z } from 'zod'

const gaRegexp = /^\d+\.\d+\.\d+$/
const canaryRegexp = /^(\d+)\.(\d+)\.(\d+)-canary\.(\d+)$/

const env = createEnv({
  server: {
    CI: z
      .string()
      .optional()
      .transform(v => v === 'true'),
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
  const argv = minimist(process.argv.slice(2))
  const thisVersion = argv.version
  if (gaRegexp.test(thisVersion)) {
    await sendGAEmail(thisVersion)
    return
  }

  const previousVersion = getPreviousVersion(argv.version)

  if (!previousVersion) {
    console.log('No previous version to compare with')
    process.exit(0)
  }
  const compareURL = `https://api.github.com/repos/vercel/next.js/compare/v${previousVersion}...v${thisVersion}`
  const compare = await fetch(compareURL).then(res => res.json())
  const files = z.array(fileSchema).parse(compare.files)
  const relevantFiles = files.filter(file =>
    [
      'packages/next/src/client/components/app-router.tsx',
      'packages/next/src/client/components/search-params.ts',
      'packages/next/src/client/components/navigation.ts'
    ].includes(file.filename)
  )
  if (relevantFiles.length === 0) {
    console.log('No relevant changes')
    process.exit(0)
  }
  await sendNotificationEmail(thisVersion, relevantFiles)
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
 * @param {z.infer<typeof fileSchema>[]} files
 * @returns
 */
async function sendNotificationEmail(thisVersion, files) {
  const client = new MailPace.DomainClient(env.MAILPACE_API_TOKEN)
  const release = await fetch(
    `https://api.github.com/repos/vercel/next.js/releases/tags/v${thisVersion}`
  ).then(res => res.json())
  const subject = `[nuqs] Next.js ${thisVersion} has relevant core changes`
  const patchSection = files
    .map(file => {
      if (!file.patch) {
        return `${file.filename}: no patch available`
      }
      return `${file.filename}:
\`\`\`diff
${file.patch}
\`\`\`
`
    })
    .join('\n')

  const body = `Release: ${release.html_url}

${release.body}
---

${patchSection}
`
  console.info('Sending email:', subject)
  console.info(body)
  if (!env.CI) {
    return
  }
  return client.sendEmail({
    from: env.EMAIL_ADDRESS_FROM,
    to: env.EMAIL_ADDRESS_TO,
    subject,
    textbody: body,
    tags: ['nuqs']
  })
}

/**
 * @param {string} thisVersion
 */
function sendGAEmail(thisVersion) {
  const client = new MailPace.DomainClient(env.MAILPACE_API_TOKEN)
  const subject = `[nuqs] Next.js ${thisVersion} was published to GA`
  const body = `https://github.com/vercel/next.js/releases/tag/v${thisVersion}`
  console.info('Sending email:', subject)
  console.info(body)
  if (!env.CI) {
    return
  }
  return client.sendEmail({
    from: env.EMAIL_ADDRESS_FROM,
    to: env.EMAIL_ADDRESS_TO,
    subject,
    textbody: body,
    tags: ['nuqs']
  })
}
