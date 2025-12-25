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
            'https://pbs.twimg.com/profile_images/1991136440135106560/KtTAASs0_400x400.jpg'
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
            'https://pbs.twimg.com/profile_images/1991962658023612416/AAao07da_400x400.jpg'
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
          handle: '@dominikdoesdev',
          avatar:
            'https://pbs.twimg.com/profile_images/1933961142457581568/i2Y0u0lV_400x400.jpg'
        }}
        text="i love nuqs"
        url="https://x.com/DominikDoesDev/status/1973696846079135968"
      />
      <Quote
        author={{
          name: 'Josh tried coding',
          handle: '@joshtriedcoding',
          avatar:
            'https://pbs.twimg.com/profile_images/1899476552464646146/Vooiz1-9_400x400.jpg'
        }}
        text="nuqs is one of my favorite pieces of software recently. don't mean to glaze but man, it's a type-safe, way better version of react state"
        url="https://x.com/joshtriedcoding/status/1981561126254235959"
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

      <Quote
        author={{
          name: 'OrcDev',
          handle: '@theorcdev',
          avatar:
            'https://pbs.twimg.com/profile_images/1756766826736893952/6Gvg6jha_400x400.jpg'
        }}
        text={
          <>
            <p>Keep it up guys! You're doing a great job!</p>
            <p>
              I'm using nuqs on real projects in production already, it's
              amazing how easy it is to control URL params.
            </p>
          </>
        }
        url="https://x.com/theorcdev/status/1849368178717290945"
      />
      <Quote
        author={{
          name: 'Brandon McConnell',
          handle: '@branmcconnell',
          avatar:
            'https://pbs.twimg.com/profile_images/1980738441986859008/Cby9Dgd2_400x400.jpg'
        }}
        text={
          <>
            <p>
              nuqs is the perfect solution to the epidemically annoying problem
              of query param state management
            </p>

            <p>I wish I had this 10 years ago</p>
          </>
        }
        url="https://x.com/branmcconnell/status/1976717520653459678"
      />
      <Quote
        author={{
          name: 'Iza',
          handle: '@izadoesdev',
          avatar:
            'https://pbs.twimg.com/profile_images/1995822557115637760/HEiF8JFH_400x400.jpg'
        }}
        text="goated library"
        url="https://x.com/izadoesdev/status/1977276660090388523"
      />
      <Quote
        author={{
          name: 'Code With Antonio',
          handle: '@YTCodeAntonio',
          avatar:
            'https://pbs.twimg.com/profile_images/1677359164580929544/jngFF04Y_400x400.jpg'
        }}
        text="i am so happy every time i get to use nuqs!"
        url="https://x.com/YTCodeAntonio/status/1978044756157481313"
      />
      <Quote
        author={{
          name: 'arth',
          handle: '@arthy',
          avatar:
            'https://pbs.twimg.com/profile_images/1997561168064544768/IdismN0M_400x400.jpg'
        }}
        text="also, nuqs is amazing"
        url="https://x.com/arthty/status/1980237430256234768"
      />
      <Quote
        author={{
          name: 'Mr T.',
          handle: '@DorianTho5',
          avatar:
            'https://pbs.twimg.com/profile_images/2000156881772216324/h9lf-PZ6_400x400.jpg'
        }}
        text={
          <>
            <p>one of the most useful pieces of library ever made</p>
            <p>
              thx for making our life easier as devs and ux way better for our
              users
            </p>
          </>
        }
        url="https://x.com/DorianTho5/status/1981419755723739213"
      />
      <Quote
        author={{
          name: 'Hayden Bleasel',
          handle: '@haydenbleasel',
          avatar:
            'https://pbs.twimg.com/profile_images/1964093609801895936/B3_Cmkma_400x400.jpg'
        }}
        text="deez nuqs"
        url="https://x.com/haydenbleasel/status/1981572915591258189"
      />
      <Quote
        author={{
          name: 'Christopher Burns',
          handle: '@BurnedChris',
          avatar:
            'https://pbs.twimg.com/profile_images/1988259821020221440/qRyYd6iE_400x400.jpg'
        }}
        text="Really glad to finally met Francois from nuqs! I love using it!"
        url="https://x.com/BurnedChris/status/1981071113154417018"
      />
      <Quote
        author={{
          name: 'Chánh Đại',
          handle: '@iamncdai',
          avatar:
            'https://pbs.twimg.com/profile_images/1905665979662958595/Y0_Ifuk5_400x400.jpg'
        }}
        text="I integrated nuqs into an internal project, and it helped simplify filter-related query logic and reduce development time."
        url="https://x.com/iamncdai/status/1981606278444249232"
      />
      <Quote
        author={{
          name: 'Abhishek Chauhan',
          handle: '@abhishekashwinc',
          avatar:
            'https://pbs.twimg.com/profile_images/1999736604102123520/p4VZVIcH_400x400.jpg'
        }}
        text="Big fan of nuqs!"
        url="https://x.com/abhishekashwinc/status/1981613111472996827"
      />
      <Quote
        author={{
          name: 'Michael',
          handle: '@michael_chomsky',
          avatar:
            'https://pbs.twimg.com/profile_images/1995587948914638854/iGEDdcOq_400x400.jpg'
        }}
        text="meeting the guy behind nuqs was insane. it's one of those tools literally every web dev should know about"
        url="https://x.com/michael_chomsky/status/1981633873529471064"
      />
      <Quote
        author={{
          name: 'James Perkins',
          handle: '@james_r_perkins',
          avatar:
            'https://pbs.twimg.com/profile_images/1854308174817579008/Lon8OO2h_400x400.jpg'
        }}
        text="nuqs is so goated"
        url="https://x.com/james_r_perkins/status/1981744427132424690"
      />
      <Quote
        author={{
          name: 'dmytro',
          handle: '@pqoqubbw',
          avatar:
            'https://pbs.twimg.com/profile_images/2002890026905169920/T6FpaVHH_400x400.jpg'
        }}
        text={
          <>
            <p>thank you for your hard work 🫶</p>
            <p>nuqs is awesome</p>
          </>
        }
        url="https://x.com/pqoqubbw/status/1981753810654494892"
      />
      <Quote
        author={{
          name: 'Suraj Jha',
          handle: '@surajtwt_',
          avatar:
            'https://pbs.twimg.com/profile_images/1984373283136106496/OkLU-izR_400x400.jpg'
        }}
        text="Currently Using nuqs to add some pagination and searching feature into my nextjs app and i am loving it"
        url="https://x.com/surajtwt_/status/1982684604307034362"
      />
      <Quote
        author={{
          name: 'shibbi',
          handle: '@shibbicodes',
          avatar:
            'https://pbs.twimg.com/profile_images/1911788743721164800/TBqun0ZP_400x400.jpg'
        }}
        text="We started using nuqs and achieved world peace internally."
        url="https://x.com/shibbicodes/status/2002396495832817803"
      />
      <Quote
        author={{
          name: 'Ajay Patel',
          handle: '@ajaypatel_aj',
          avatar:
            'https://pbs.twimg.com/profile_images/1957717329397141507/7ctDgOuc_400x400.jpg'
        }}
        text={
          <>
            <p>
              Big thanks to nuqs for making URL state management actually
              enjoyable! 🙌
            </p>
            <br />
            <ul>
              <li>useState but synced with the URL? ✅</li>
              <li>Type-safe? ✅</li>
              <li>Works everywhere (Next.js, Remix, React Router)? ✅</li>
              <li>Only 6kb? ✅</li>
            </ul>
            <br />
            <p>Happy to support such a well-crafted library 😇</p>
          </>
        }
        url="https://x.com/ajaypatel_aj/status/2004082719047778362"
      />
      <Quote
        author={{
          name: 'anarki supreme',
          handle: '@basedanarki',
          avatar:
            'https://pbs.twimg.com/profile_images/1994299964730781696/lh8gQd0V_400x400.jpg'
        }}
        text="I LOVE NUQS I LOVE PARAMS THAT JUST WORK AHAHA WOOHOOO❤️❤️❤️❤️"
        url="https://x.com/basedanarki/status/2001970260426318003"
      />
    </section>
  )
}
