import { blog } from '@/src/app/source'
import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ComponentProps } from 'react'

// Image metadata
export const size = {
  width: 1200,
  height: 675
}
export const contentType = 'image/png'
export const dynamic = 'force-static'

type PageProps = {
  params: Promise<{ slug: string }>
}

// Image generation
export default async function Image({ params }: PageProps) {
  const { slug } = await params
  const page = blog.getPage([slug])
  if (!page) notFound()
  const customImage = await getCustomImage(slug)
  if (customImage) {
    return new ImageResponse(
      (
        <img
          src={customImage}
          alt="Open Graph Image"
          style={{
            position: 'absolute',
            inset: 0
          }}
        />
      ),
      size
    )
  }
  // Fallback to generated image
  const { fonts, images } = await loadResources()
  const title = page.data.title
  const description = page.data.description
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #000, #000, #35353A)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '50px 0 0',
          gap: '20px',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter'
        }}
      >
        <img
          src={images.bg}
          alt="Background"
          style={{ position: 'absolute', inset: 0 }}
        />
        {/* <div
          // Center marker
          style={{
            width: '1px',
            position: 'absolute',
            top: 0,
            left: '50%',
            height: '100%',
            background: 'red'
          }}
        /> */}
        <header
          style={{
            position: 'absolute',
            left: 0,
            top: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            margin: '0 0 40px',
            width: '100%',
            padding: '0 40px'
          }}
        >
          <Logo style={{ width: '293px', height: '53px' }} />
          <p
            style={{
              fontSize: '28px',
              color: 'white',
              marginLeft: 'auto',
              fontWeight: 500
            }}
          >
            {new Date().toISOString()}
          </p>
        </header>
        <h1
          style={{
            fontSize: getFontSize(title) + 'px',
            color: 'white',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.1,
            margin: '0 16px 20px 16px',
            textWrap: title.length > 20 ? 'balance' : 'wrap'
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              fontWeight: 300,
              fontSize: '48px',
              color: '#CBCBD2',
              textAlign: 'center',
              textWrap: description.length > 50 ? 'balance' : 'wrap',
              margin: 0
            }}
          >
            {description}
          </p>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: fonts.inter.light,
          style: 'normal',
          weight: 300
        },
        {
          name: 'Inter',
          data: fonts.inter.regular,
          style: 'normal',
          weight: 400
        },
        {
          name: 'Inter',
          data: fonts.inter.medium,
          style: 'normal',
          weight: 500
        },
        {
          name: 'Inter',
          data: fonts.inter.semibold,
          style: 'normal',
          weight: 600
        },
        {
          name: 'Inter',
          data: fonts.inter.bold,
          style: 'normal',
          weight: 700
        }
      ]
    }
  )
}

// --

function getFont(weight: string) {
  return readFile(
    join(process.cwd(), `src/assets/fonts/Inter_24pt-${weight}.ttf`)
  )
}

async function loadResources() {
  const [light, regular, medium, semibold, bold] = await Promise.all([
    getFont('Light'),
    getFont('Regular'),
    getFont('Medium'),
    getFont('SemiBold'),
    getFont('Bold')
  ])
  const bg =
    'data:image/png;base64,' +
    (
      await readFile(join(process.cwd(), 'src/assets/images/og-bg.png'))
    ).toString('base64')
  return {
    fonts: {
      inter: {
        light,
        regular,
        medium,
        semibold,
        bold
      }
    },
    images: {
      bg
    }
  }
}

function getFontSize(text: string) {
  if (text.length < 30) return 128
  if (text.length < 50) return 85
  if (text.length < 70) return 64
  return 48
}

function Logo(props: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 1912 351"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M76.2 206.6c0-16 2.667-29.6 8-40.8 5.6-11.467 14.933-22.533 28-33.2l8.8-7.2c8-6.133 14-11.067 18-14.8 4-4 7.2-8.533 9.6-13.6 2.667-5.067 4-11.067 4-18 .267-15.2-5.2-27.467-16.4-36.8-11.2-9.6-25.867-14.4-44-14.4-17.867 0-32.4 6-43.6 18C37.667 57.533 31.267 73.267 29.4 93L.2 91c1.333-17.6 6.133-33.2 14.4-46.8 8.267-13.6 18.933-24.267 32-32C59.933 4.467 74.733.6 91 .6c17.6 0 33.2 3.333 46.8 10 13.867 6.667 24.667 16 32.4 28 7.733 11.733 11.6 25.2 11.6 40.4 0 9.067-1.867 17.6-5.6 25.6-3.467 7.733-8.667 15.2-15.6 22.4-6.933 6.933-16 14.533-27.2 22.8l-.4.4c-10.4 7.733-17.867 16-22.4 24.8-4.533 8.533-6.8 19.067-6.8 31.6H76.2Zm31.6 46.4v38H71v-38h36.8Z"
        fill="#3F3F46"
      />
      <path
        d="m275.722 79 2.4 59.6-6.8-3.6c3.2-21.067 10.933-36.4 23.2-46 12.533-9.867 28-14.8 46.4-14.8 22.933 0 40.666 7.333 53.2 22 12.8 14.4 19.2 33.867 19.2 58.4V291h-51.6V171c0-12.533-1.2-22.667-3.6-30.4-2.4-8-6.267-14-11.6-18-5.334-4.267-12.4-6.4-21.2-6.4-14.133 0-25.067 4.667-32.8 14-7.734 9.333-11.6 22.933-11.6 40.8v120h-52V79h46.8Z"
        fill="#fff"
      />
      <path
        d="M669.147 119v25.2h-190.4V119h190.4Zm0 82.4v25.2h-190.4v-25.2h190.4Z"
        fill="#3F3F46"
      />
      <path
        d="m869.981 291-1.6-58.4 6.4 3.6c-3.2 20.533-10.933 35.6-23.2 45.2-12.266 9.6-27.333 14.4-45.2 14.4-22.666 0-40.266-7.333-52.8-22-12.533-14.667-18.8-34.133-18.8-58.4V79h52v119.6c0 12.8 1.067 23.2 3.2 31.2 2.4 7.733 6.134 13.733 11.2 18 5.334 4 12.4 6 21.2 6 13.6 0 24.134-4.667 31.6-14 7.734-9.333 11.6-23.067 11.6-41.2V79h52v212h-47.6Z"
        fill="#fff"
      />
      <path
        d="M1022.65 7c10.14-5.333 21.07-7.6 32.8-6.8 12.27.8 23.34 4.8 33.2 12 9.87 6.933 17.07 16 21.6 27.2 4.54 10.933 5.34 22.8 2.4 35.6-2.66 11.733-8.66 23.067-18 34-9.06 10.667-21.06 20.8-36 30.4l71.2 90.4c4.54-6.4 8-14.8 10.4-25.2 2.67-10.4 3.87-21.067 3.6-32l28.8 2.8c-.53 14.4-3.2 28.4-8 42-4.53 13.333-10.4 24.533-17.6 33.6l32.8 40h-33.2l-16.8-21.2c-8.53 8.267-19.06 14.667-31.6 19.2-12.26 4.533-25.6 6.8-40 6.8-18.66 0-35.2-3.067-49.6-9.2-14.397-6.4-25.73-15.467-33.997-27.2-8-11.733-12-25.867-12-42.4 0-16.267 4-30.4 12-42.4s20.933-24.267 38.797-36.8c2.4-1.6 4.67-3.067 6.8-4.4l-4-5.2c-9.06-12.267-15.86-23.467-20.397-33.6-4.267-10.4-6.4-20.8-6.4-31.2 0-13.067 2.933-24.4 8.8-34 6.137-9.867 14.267-17.333 24.397-22.4Zm66.4 258c9.34-3.733 16.8-8.933 22.4-15.6l-74.8-94.8c-14.66 9.6-26 19.333-34 29.2-7.73 9.6-11.597 20.667-11.597 33.2 0 10.933 2.8 20.4 8.4 28.4 5.867 8 13.867 14.133 23.997 18.4 10.14 4.267 21.74 6.4 34.8 6.4 11.2 0 21.47-1.733 30.8-5.2Zm-66-176.4c4.27 8.533 10.8 18.533 19.6 30 14.4-8 25.34-16.4 32.8-25.2 7.74-9.067 11.6-18.267 11.6-27.6 0-10.933-3.06-20-9.2-27.2-6.13-7.2-14.13-10.933-24-11.2-10.66-.267-19.46 3.067-26.4 10-6.93 6.933-10.4 15.867-10.4 26.8 0 7.467 2 15.6 6 24.4Z"
        fill="#3F3F46"
      />
      <path
        d="M1410.8 79v272h-52V246.6l5.2 4c-3.46 9.867-8.4 18.133-14.8 24.8-6.4 6.667-14 11.733-22.8 15.2-8.8 3.467-18.66 5.2-29.6 5.2-19.46 0-36.13-4.933-50-14.8-13.6-9.867-23.86-23.067-30.8-39.6-6.66-16.8-10-35.6-10-56.4 0-20.8 3.34-39.467 10-56 6.94-16.8 17.2-30.133 30.8-40 13.87-9.867 30.54-14.8 50-14.8 16.54 0 30.54 3.867 42 11.6 11.74 7.467 20.27 18.4 25.6 32.8l-4.4 4.8 1.6-44.4h49.2Zm-53.6 140.4c3.74-10.4 5.6-21.867 5.6-34.4 0-12.533-1.86-24-5.6-34.4-3.73-10.4-9.46-18.8-17.2-25.2-7.73-6.4-17.33-9.6-28.8-9.6-16.8 0-29.6 6.667-38.4 20-8.8 13.333-13.2 29.733-13.2 49.2 0 19.733 4.4 36.267 13.2 49.6 8.8 13.067 21.6 19.6 38.4 19.6 11.47 0 21.07-3.2 28.8-9.6 7.74-6.4 13.47-14.8 17.2-25.2Z"
        fill="#fff"
      />
      <path
        d="M1666.41 119v25.2h-190.4V119h190.4Zm0 82.4v25.2h-190.4v-25.2h190.4Z"
        fill="#3F3F46"
      />
      <path
        d="M1856.85 146.6c-1.87-10.133-6.94-18.267-15.2-24.4-8.27-6.133-17.47-9.2-27.6-9.2-10.14 0-18.54 2.533-25.2 7.6-6.67 4.8-9.87 11.333-9.6 19.6.26 8 4.26 14.133 12 18.4 7.73 4.267 17.86 7.6 30.4 10 20.8 3.467 37.6 7.733 50.4 12.8 12.8 4.8 22.53 11.467 29.2 20 6.93 8.533 10.4 19.467 10.4 32.8 0 13.6-4 25.067-12 34.4-8 9.067-18.8 15.867-32.4 20.4-13.6 4.533-28.94 6.8-46 6.8-19.2 0-36.27-2.8-51.2-8.4-14.67-5.867-26.27-14.133-34.8-24.8-8.54-10.933-13.34-23.867-14.4-38.8l52.4-2.8c1.33 7.467 4 13.867 8 19.2 4 5.333 9.33 9.467 16 12.4 6.66 2.667 14.4 4 23.2 4 10.13 0 18.93-1.867 26.4-5.6 7.73-4 11.6-10 11.6-18-.27-5.6-2-10.133-5.2-13.6-3.2-3.467-7.2-6-12-7.6-4.8-1.867-11.34-3.6-19.6-5.2-2.14-.267-4.94-.933-8.4-2-20-4-36.14-8.267-48.4-12.8-12-4.8-21.6-11.2-28.8-19.2-6.94-8.267-10.4-18.8-10.4-31.6 0-13.6 3.6-25.467 10.8-35.6 7.46-10.133 18-17.867 31.6-23.2 13.86-5.6 30.13-8.4 48.8-8.4 24.8 0 45.46 6.4 62 19.2 16.8 12.533 26.93 29.6 30.4 51.2l-52.4 2.4Z"
        fill="#fff"
      />
    </svg>
  )
}

async function getCustomImage(slug: string) {
  const filePath = join(process.cwd(), 'content/blog/' + slug + '.og.png')
  try {
    const imageBuffer = await readFile(filePath)
    return 'data:image/png;base64,' + imageBuffer.toString('base64')
  } catch {
    return null
  }
}
