import { Quote } from '@/src/components/quote'

export function QuotesSection() {
  return (
    <section className="container my-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
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
          handle: 'nathanbrachotte',
          avatar:
            'https://pbs.twimg.com/profile_images/1589918605977722882/Iu7GZSZ9_400x400.jpg'
        }}
        url="https://twitter.com/nathanbrachotte/status/1747244520163397659"
      />
      <Quote
        text="The DX improvement using nuqs for me has been amazing."
        author={{
          name: 'Kingsley O.',
          handle: 'Kingsley_codes',
          avatar:
            'https://pbs.twimg.com/profile_images/1679549288689352704/RqDBl9w1_400x400.jpg'
        }}
        url="https://twitter.com/Kingsley_codes/status/1748123036543316075"
      />
      <Quote
        author={{
          name: 'Hruthik Reddy',
          avatar:
            'https://media.licdn.com/dms/image/C5103AQGJX_VlGqUQ1g/profile-displayphoto-shrink_400_400/0/1538894718740?e=1710979200&v=beta&t=XykS6uVm4z2KsyDs6IfqVzl0_X7dV6YV2MuSpATOAnQ'
        }}
        text={
          <>
            Loved your blog post on Shallow routing and the nuqs package!
            <br />
            You saved me a lot of time!
          </>
        }
      />
    </section>
  )
}
