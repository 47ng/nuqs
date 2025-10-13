import { Quote } from '@/src/components/quote'

export function QuotesSection() {
  return (
    <section className="container my-24 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
      <Quote
        text={
          <>
            <p>
              I started building my own hook helpers for handling URL states and
              had to deal with some performance drawbacks.
            </p>
            <p>
              Eventually stumbled on this little beauty and it has everything I
              wanted and more.
            </p>
          </>
        }
        author={{
          name: 'N8',
          handle: '@nathanbrachotte',
          avatar:
            'https://pbs.twimg.com/profile_images/1589918605977722882/Iu7GZSZ9_400x400.jpg'
        }}
        url="https://x.com/nathanbrachotte/status/1747244520163397659"
      />
      <Quote
        author={{
          name: 'Marc Seitz',
          handle: '@mfts0',
          avatar:
            'https://pbs.twimg.com/profile_images/1176854646343852032/iYnUXJ-m_400x400.jpg'
        }}
        text="It’s a database ORM for your URL"
        url="https://x.com/mfts0/status/1814577051703066783"
      />
      <Quote
        author={{
          name: 'Pontus Abrahamsson',
          handle: '@pontusab',
          avatar:
            'https://pbs.twimg.com/profile_images/1755611130368770048/JwLEqyeo_400x400.jpg'
        }}
        text={<>We use nuqs pretty much everywhere 🖤</>}
        url="https://x.com/pontusab/status/1774434057469780028"
      />
      <Quote
        text="nuqs is fkn dope"
        author={{
          name: 'kitze',
          handle: '@thekitze',
          avatar:
            'https://pbs.twimg.com/profile_images/1975336245992607744/ug-G1qXh_400x400.jpg'
        }}
        url="https://x.com/thekitze/status/1909576710179471466"
      />
      <Quote
        author={{
          name: 'Darathor17',
          avatar: 'https://avatars.githubusercontent.com/u/24258247?v=4'
        }}
        text="thx a lot for this awesome library! I was syncing with URL like nextjs recommends .. performance are awful and I was about to move back to useState."
        url="https://github.com/47ng/nuqs/discussions/444"
      />
      <Quote
        author={{
          name: 'KafKa',
          handle: '@KafKa303',
          avatar:
            'https://pbs.twimg.com/profile_images/703581659543654400/7WNdakTi_400x400.jpg'
        }}
        text="This is a great idea, way better than calling useSearchParam and cook my own stuff! nuqs is such a important last piece for app router! An extremely underrated lib!"
        url="https://x.com/KafKa303/status/1751058161740693694"
      />
      <Quote
        author={{
          name: 'ahmet',
          handle: '@bruvimtired',
          avatar:
            'https://pbs.twimg.com/profile_images/1974628705839267840/aMCXsAyI_400x400.jpg'
        }}
        text="nuqs has to be one of the best libraries out there. lifting state to the url is so easy now and far better for ux."
        url="https://x.com/bruvimtired/status/1944437102562759144"
      />
      <Quote
        author={{
          name: 'Aryan',
          handle: '@AryaAmour08',
          avatar:
            'https://pbs.twimg.com/profile_images/1880190860853444608/Ah13Xi4S_400x400.jpg'
        }}
        text={
          <>
            <p>
              Just used the nuqs library for the first time today… and wow -
              syncing URL query params in Next.js has never felt this elegant.
            </p>
            <p>
              Parsing, defaults, clearOnDefault — it's pretty wild
              <br />
              Where has this been all my life?
            </p>
          </>
        }
        url="https://x.com/AryaAmour08/status/1946565369537446127"
      />
      <Quote
        author={{
          name: 'Ru Chern Chong',
          handle: '@ruchernchong',
          avatar:
            'https://pbs.twimg.com/profile_images/1864759220048138240/cX7JIFtb_400x400.jpg'
        }}
        text="Sometimes, there is no need to complicate managing state. nuqs is really powerful."
        url="https://x.com/ruchernchong/status/1946618077581619392"
      />
      <Quote
        author={{
          name: 'Bharat Kara',
          handle: '@KaraBharat',
          avatar:
            'https://pbs.twimg.com/profile_images/1947143666616717312/r3BIu8OZ_400x400.jpg'
        }}
        text="nuqs simplifies your URL logic like magic. Seriously."
        url="https://x.com/KaraBharat/status/1947984051840983521"
      />
      <Quote
        author={{
          name: 'Ido Evergreen',
          handle: '@IdoEvergreen',
          avatar:
            'https://pbs.twimg.com/profile_images/1973707110388023297/comRbAQQ_400x400.jpg'
        }}
        text={
          <>
            <p>
              It made me realize URL should be part of the design convo not just
              a place to dump state.
            </p>
            <p>
              Since I started using nuqs more heavily in production, the way I
              see and treat URL completely changed.
            </p>
          </>
        }
        url="https://x.com/IdoEvergreen/status/1948014681207030054"
      />
      <Quote
        author={{
          name: 'Rhys Sullivan',
          handle: '@RhysSullivan',
          avatar:
            'https://pbs.twimg.com/profile_images/1303727365265203200/0cgHOP3y_400x400.jpg'
        }}
        text="The goat library"
        url="https://x.com/RhysSullivan/status/1971327979369398579"
      />
      <Quote
        author={{
          name: 'Virgile Rietsch',
          handle: '@virgilerietsch',
          avatar:
            'https://pbs.twimg.com/profile_images/1967572887629398016/CGM5YVvp_400x400.jpg'
        }}
        text="best library ever"
        url="https://x.com/virgilerietsch/status/1971320475180823012"
      />
      <Quote
        author={{
          name: 'Dominik Koch',
          handle: '@DominikDoesDev',
          avatar:
            'https://pbs.twimg.com/profile_images/1933961142457581568/i2Y0u0lV_400x400.jpg'
        }}
        text="i love nuqs"
        url="https://x.com/DominikDoesDev/status/1973696846079135968"
      />
      <Quote
        author={{
          name: 'Pavel Svitek',
          handle: '@pavelsvitek_',
          avatar:
            'https://pbs.twimg.com/profile_images/1632440743804428290/EUnmpz5l_400x400.jpg'
        }}
        text="Just did first custom parser today, pretty simple .. great API design 👌"
        url="https://x.com/pavelsvitek_/status/1976329834981925328"
      />
    </section>
  )
}
