import { cn } from '@/src/lib/utils'
import Image from 'next/image'
import type { Result } from './crawler'

const dependents: Result[] = [
  { repo: 'GitbookIO/gitbook', stars: 26267, pkg: 'nuqs', avatarID: '7111340' },
  {
    repo: 'hyperdxio/hyperdx',
    stars: 5909,
    pkg: 'nuqs',
    avatarID: '130113031'
  },
  { repo: 'unkeyed/unkey', stars: 2118, pkg: 'nuqs', avatarID: '138932600' },
  { repo: 'midday-ai/midday', stars: 1945, pkg: 'nuqs', avatarID: '145366395' },
  {
    repo: 'Openpanel-dev/openpanel',
    stars: 803,
    pkg: 'nuqs',
    avatarID: '161692650'
  },
  {
    repo: 'osmosis-labs/osmosis-frontend',
    stars: 202,
    pkg: 'nuqs',
    avatarID: '79296913'
  },
  {
    repo: 'piotrkulpinski/openalternative',
    stars: 166,
    pkg: 'nuqs',
    avatarID: '358412'
  },
  {
    repo: 'smartive/smartive.ch',
    stars: 121,
    pkg: 'nuqs',
    avatarID: '2870077'
  },
  {
    repo: 'commonalityco/commonality',
    stars: 109,
    pkg: 'nuqs',
    avatarID: '85583126'
  },
  {
    repo: 'BennyKok/comfyui-deploy-next-example',
    stars: 107,
    pkg: 'next-usequerystate',
    avatarID: '18395202'
  },
  {
    repo: 'michaelkremenetsky/Refeed',
    stars: 99,
    pkg: 'nuqs',
    avatarID: '28833521'
  },
  { repo: 'zakiego/baku-hantam', stars: 79, pkg: 'nuqs', avatarID: '78015359' },
  {
    repo: 'blefnk/reliverse-website-builder',
    stars: 72,
    pkg: 'next-usequerystate',
    avatarID: '104720746'
  },
  {
    repo: 'gitcoinco/easy-retro-pgf',
    stars: 39,
    pkg: 'nuqs',
    avatarID: '30044474'
  },
  {
    repo: 'theopensource-company/playrbase',
    stars: 22,
    pkg: 'nuqs',
    avatarID: '110784955'
  },
  { repo: 'micro-course/core', stars: 20, pkg: 'nuqs', avatarID: '152098750' },
  {
    repo: 'aristofany-herderson/react-pokedex',
    stars: 15,
    pkg: 'nuqs',
    avatarID: '102054077'
  },
  {
    repo: 'betagouv/france-chaleur-urbaine',
    stars: 12,
    pkg: 'nuqs',
    avatarID: '7874148'
  },
  {
    repo: 'PhantomKnight287/frameground',
    stars: 12,
    pkg: 'nuqs',
    avatarID: '76196237'
  },
  {
    repo: 'jacobtipp/bloc-state',
    stars: 12,
    pkg: 'nuqs',
    avatarID: '17633005'
  },
  {
    repo: 'doubleopen-project/dos',
    stars: 10,
    pkg: 'nuqs',
    avatarID: '47321992'
  },
  { repo: 'joulev/website', stars: 10, pkg: 'nuqs', avatarID: '44609036' },
  {
    repo: 'jsartisan/frontend-challenges',
    stars: 10,
    pkg: 'nuqs',
    avatarID: '6636360'
  },
  {
    repo: 'datduyng/personal-site',
    stars: 9,
    pkg: 'nuqs',
    avatarID: '35666615'
  },
  { repo: 'y-temp4/y-temp4.com', stars: 9, pkg: 'nuqs', avatarID: '13657589' },
  { repo: 'CSSPanel/Panel', stars: 9, pkg: 'nuqs', avatarID: '162069258' },
  {
    repo: 'swishjam/promptcraft',
    stars: 8,
    pkg: 'nuqs',
    avatarID: '119890799'
  },
  {
    repo: 'informatyzacja/strona-organizacji-studenckich',
    stars: 7,
    pkg: 'nuqs',
    avatarID: '65964865'
  },
  {
    repo: 'jonahsnider/frc-colors.com',
    stars: 6,
    pkg: 'nuqs',
    avatarID: '7608555'
  },
  { repo: 'mateusfg7/text-tools', stars: 6, pkg: 'nuqs', avatarID: '40613276' },
  {
    repo: 'Superdev0909/lobe-chat-main',
    stars: 6,
    pkg: 'nuqs',
    avatarID: '158264259'
  },
  {
    repo: 'viliket/live-trains-finland',
    stars: 5,
    pkg: 'nuqs',
    avatarID: '25618592'
  },
  {
    repo: 'SwiichyCode/GitShareSpace',
    stars: 5,
    pkg: 'nuqs',
    avatarID: '91782609'
  },
  {
    repo: 'GoodPointt/mutahae-proj',
    stars: 5,
    pkg: 'nuqs',
    avatarID: '119069023'
  },
  {
    repo: 'christianalares/seventy-seven',
    stars: 4,
    pkg: 'nuqs',
    avatarID: '893819'
  },
  { repo: 'teamreflex/cosmo-web', stars: 4, pkg: 'nuqs', avatarID: '13760063' },
  { repo: 'datacite/akita', stars: 4, pkg: 'nuqs', avatarID: '411326' },
  { repo: 'ShiNxz/CSS-Panel', stars: 4, pkg: 'nuqs', avatarID: '62391669' },
  {
    repo: 'XenoPOMP/next-template',
    stars: 3,
    pkg: 'nuqs',
    avatarID: '101574433'
  },
  { repo: 'RiskyMH/Stats', stars: 3, pkg: 'nuqs', avatarID: '56214343' },
  { repo: 'alfonsusac/art-findr', stars: 3, pkg: 'nuqs', avatarID: '20208219' },
  {
    repo: 'downbeat-academy/downbeat-academy',
    stars: 3,
    pkg: 'nuqs',
    avatarID: '87111748'
  },
  {
    repo: 'optionhq/negation-game',
    stars: 3,
    pkg: 'nuqs',
    avatarID: '140654146'
  },
  { repo: 'wavyrai/PromptShare', stars: 2, pkg: 'nuqs', avatarID: '64166502' },
  {
    repo: 'chenshuai2144/xingxing',
    stars: 2,
    pkg: 'nuqs',
    avatarID: '8186664'
  },
  {
    repo: 'danlevison/FUTR-Gaming-App',
    stars: 2,
    pkg: 'nuqs',
    avatarID: '100078678'
  },
  {
    repo: 'RafalWojciechRolsky/sklep-nextjs',
    stars: 2,
    pkg: 'nuqs',
    avatarID: '42720974'
  },
  {
    repo: 'bratislava/konto.bratislava.sk',
    stars: 2,
    pkg: 'nuqs',
    avatarID: '68340480'
  },
  {
    repo: 'andrewtsun25/djin-next',
    stars: 2,
    pkg: 'nuqs',
    avatarID: '5544691'
  },
  { repo: 'OmniBytes/pi-hub', stars: 2, pkg: 'nuqs', avatarID: '22182961' },
  { repo: 'd-asensio/dive-nerd', stars: 2, pkg: 'nuqs', avatarID: '13970905' },
  { repo: 'tygrxqt/katarogu', stars: 2, pkg: 'nuqs', avatarID: '59417077' },
  {
    repo: 'Johnnyhhhhh/lobe-chat1',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '87590242'
  },
  {
    repo: 'niklasarnitz/waslaeuftin',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '24507162'
  },
  { repo: 'victorwrage/lobe-hub', stars: 1, pkg: 'nuqs', avatarID: '5088587' },
  {
    repo: 'noxify/reactquerybuilder-nextjs-rsc-queryparams',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '521777'
  },
  { repo: 'maxwiseman/ai-inbox', stars: 1, pkg: 'nuqs', avatarID: '60909484' },
  { repo: 'jackchen75/lob', stars: 1, pkg: 'nuqs', avatarID: '1335589' },
  {
    repo: 'independenceee/aiken-tutorial',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '108068667'
  },
  {
    repo: 'bookwormapp2/Bookworm',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '152719069'
  },
  { repo: 'adsyam/Nukt-NEXTJS', stars: 1, pkg: 'nuqs', avatarID: '142198564' },
  {
    repo: 'maiconlara/nextjs-template',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '105327553'
  },
  { repo: 'blakewilson/graphman', stars: 1, pkg: 'nuqs', avatarID: '5946219' },
  { repo: 'dorji-dev/next_app', stars: 1, pkg: 'nuqs', avatarID: '139944071' },
  {
    repo: 'gabrielccarvalho/cardfy',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '47671243'
  },
  {
    repo: 'XxSonicGhostxX/lobe-chat',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '109825115'
  },
  {
    repo: 'Hans774882968/en-notes',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '44315461'
  },
  {
    repo: 'xixixao/prisma-vs-convex',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '1473433'
  },
  {
    repo: 'eliac7/pharmafinder-greece',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '26083840'
  },
  {
    repo: 'luizpaulo2005/wishlist',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '62365747'
  },
  {
    repo: 'SiskoWeb/grand-taxi-booking-system',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '100540300'
  },
  {
    repo: 'scumah/choose-your-colors',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '517488'
  },
  {
    repo: 'GabiC15/frontend-funkos-taller',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '77060486'
  },
  { repo: 'mikelix/LobeChat', stars: 1, pkg: 'nuqs', avatarID: '12215386' },
  { repo: 'ShiNxz/CSS-PanelDocs', stars: 1, pkg: 'nuqs', avatarID: '62391669' },
  {
    repo: 'w1redl4in/promotions-frontend',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '43390533'
  },
  { repo: 'feeeyli/multitwitch', stars: 1, pkg: 'nuqs', avatarID: '48140698' },
  {
    repo: 'PedakiHQ/pedaki-community',
    stars: 1,
    pkg: 'nuqs',
    avatarID: '139811489'
  },
  {
    repo: 'wyvern-cloud/wyvern-ui',
    stars: 1,
    pkg: 'next-usequerystate',
    avatarID: '154391291'
  },
  {
    repo: 'nguyenhieptech/openai-function-calling',
    stars: 0,
    pkg: 'nuqs',
    avatarID: '48057064'
  },
  {
    repo: 'KenzoBenzo/makenna.dev',
    stars: 0,
    pkg: 'nuqs',
    avatarID: '32865577'
  },
  { repo: 'YIFI222/lobe-chat', stars: 0, pkg: 'nuqs', avatarID: '165947273' },
  {
    repo: 'ok-akshat/RA2111032010021',
    stars: 0,
    pkg: 'nuqs',
    avatarID: '157677237'
  },
  { repo: 'nironwp/grupoporno', stars: 0, pkg: 'nuqs', avatarID: '93016971' },
  { repo: 'zjpChina/lobe-chat', stars: 0, pkg: 'nuqs', avatarID: '109899231' },
  {
    repo: 'E1-XP/mp-recruitment-task',
    stars: 0,
    pkg: 'nuqs',
    avatarID: '28780663'
  },
  { repo: 'xxnnfd/nnfd-chat', stars: 0, pkg: 'nuqs', avatarID: '146893636' },
  { repo: 'flt6/lobe-chat', stars: 0, pkg: 'nuqs', avatarID: '42725841' },
  { repo: 'szamanr/sz-rooms', stars: 0, pkg: 'nuqs', avatarID: '2622838' },
  {
    repo: 'Shotalee/lobe-chat123',
    stars: 0,
    pkg: 'nuqs',
    avatarID: '153580445'
  },
  { repo: 'chunlongniu/lobe-chat', stars: 0, pkg: 'nuqs', avatarID: '5426028' },
  {
    repo: 'xykxyk1101/lobe-chat',
    stars: 0,
    pkg: 'nuqs',
    avatarID: '157770421'
  },
  {
    repo: 'Liberlay/sct-mannol.com.ua',
    stars: 0,
    pkg: 'nuqs',
    avatarID: '61653177'
  },
  { repo: 'Gzzzy/lobe-chat', stars: 0, pkg: 'nuqs', avatarID: '26765274' },
  { repo: 'lihongyun68/lhy', stars: 0, pkg: 'nuqs', avatarID: '165663552' },
  { repo: 'stingfeng/lobe-chat', stars: 0, pkg: 'nuqs', avatarID: '8219512' },
  {
    repo: 'BlazarWinGX/lobe-chat',
    stars: 0,
    pkg: 'nuqs',
    avatarID: '133990625'
  },
  {
    repo: 'jonahsnider/scores.frc.sh',
    stars: 0,
    pkg: 'nuqs',
    avatarID: '7608555'
  },
  { repo: 'zachalbert/mezzokit', stars: 0, pkg: 'nuqs', avatarID: '2305040' },
  { repo: 'Heverchun/lobe-chat', stars: 0, pkg: 'nuqs', avatarID: '61159294' }
]

export async function DependentsSection() {
  return (
    <section className="container">
      <h2 className="mb-8 text-center text-3xl font-bold tracking-tighter dark:text-white md:text-4xl xl:text-5xl">
        Used by
      </h2>
      <p className="my-8 flex justify-center">
        <a href="https://vercel.com">
          <svg
            aria-label="Vercel"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 284 65"
            className="inline h-8 fill-black dark:fill-white md:h-10"
          >
            <path d="M141.68 16.25c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.46 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm117.14-14.5c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.45 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm-39.03 3.5c0 6 3.92 10 10 10 4.12 0 7.21-1.87 8.8-4.92l7.68 4.43c-3.18 5.3-9.14 8.49-16.48 8.49-11.05 0-19-7.2-19-18s7.96-18 19-18c7.34 0 13.29 3.19 16.48 8.49l-7.68 4.43c-1.59-3.05-4.68-4.92-8.8-4.92-6.07 0-10 4-10 10zm82.48-29v46h-9v-46h9zM37.59.25l36.95 64H.64l36.95-64zm92.38 5l-27.71 48-27.71-48h10.39l17.32 30 17.32-30h10.39zm58.91 12v9.69c-1-.29-2.06-.49-3.2-.49-5.81 0-10 4-10 10v14.8h-9v-34h9v9.2c0-5.08 5.91-9.2 13.2-9.2z" />
          </svg>
        </a>
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {dependents.map(dep => (
          <a
            key={dep.repo}
            href={`https://github.com/${dep.repo}`}
            className="relative h-8 w-8 rounded-full"
          >
            <Image
              src={`https://avatars.githubusercontent.com/u/${dep.avatarID}?s=64&v=4`}
              alt={dep.repo}
              className="rounded-full"
              width={64}
              height={64}
            />
            <span
              className={cn(
                'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                dep.pkg === 'nuqs' ? 'bg-green-500' : 'bg-zinc-500'
              )}
              aria-label={`Using ${dep.pkg}`}
            />
          </a>
        ))}
      </div>
    </section>
  )
}
