'use client'

import { parseAsString, useQueryStates } from 'next-usequerystate'

const url =
  '/pretty?exclamationMark=!&doubleQuote="&hash=%23&dollar=$&percent=%&ampersand=%26&apostrophe=\'&leftParenthesis=(&rightParenthesis=)&asterisk=*&plus=+&comma=,&hyphen=-&period=.&slash=/&colon=:&semicolon=;&lessThan=<&equals==&greaterThan=>&questionMark=?&at=@&leftSquareBracket=[&backslash=&rightSquareBracket=]&caret=^&underscore=_&backtick=`&leftCurlyBrace={&pipe=|&rightCurlyBrace=}&space= &tilde=~'

const keys = [
  'exclamationMark',
  'doubleQuote',
  'hash',
  'dollar',
  'percent',
  'ampersand',
  'apostrophe',
  'leftParenthesis',
  'rightParenthesis',
  'asterisk',
  'plus',
  'comma',
  'hyphen',
  'period',
  'slash',
  'colon',
  'semicolon',
  'lessThan',
  'equals',
  'greaterThan',
  'questionMark',
  'at',
  'leftSquareBracket',
  'backslash',
  'rightSquareBracket',
  'caret',
  'underscore',
  'backtick',
  'leftCurlyBrace',
  'pipe',
  'rightCurlyBrace',
  'space',
  'tilde'
] as const

const keyMap = keys.reduce((acc, key) => {
  acc[key] = parseAsString
  return acc
}, {} as Record<(typeof keys)[number], typeof parseAsString>)

export default function Page() {
  const [state] = useQueryStates(keyMap)
  return (
    <main>
      <h1>Crowdsourcing URL display across browsers & OS</h1>
      <ol>
        <li>
          <a href={url}>Click this link</a>
          <br />
          Or copy from here and paste it in your browser:
          <div style={{ display: 'flex', paddingRight: '2rem' }}>
            <input type="text" readOnly value={url} style={{ flex: 1 }} />
          </div>
        </li>
        <li>
          Copy it again <strong>from the URL bar</strong>
        </li>
        <li>
          Paste it{' '}
          <a href="https://github.com/47ng/next-usequerystate/issues/355">
            in this thread
          </a>
          , along with the name of your browser and OS, and the resulting object
          below.
        </li>
        <li>Thanks! 🙏</li>
      </ol>
      <textarea
        readOnly
        value={JSON.stringify(state, null, 2)}
        style={{ width: '24rem', height: '36rem' }}
      />
    </main>
  )
}
