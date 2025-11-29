/**
 * Component source code for Sandpack demos
 * These components are injected into the Sandpack environment
 */

/**
 * Default demo code showing basic nuqs usage
 * A simple example with a single query parameter
 */
export const INITIAL_CODE = `import React from 'react';
import { useQueryState } from "nuqs";

export default function Demo() {
  const [hello, setHello] = useQueryState("hello", { defaultValue: "" });
  
  return (
    <>
      <input
        className="border text-black border-gray-300 rounded-md px-4 py-2"
        value={hello}
        placeholder="Enter your name"
        onChange={(e) => setHello(e.target.value || null)}
      />
      <p>Hello, {hello || "anonymous visitor"}!</p>
    </>
  );
}
`

/**
 * Compact querystring display component
 * Displays URL search parameters in a formatted, readable way
 */
export const QUERYSTRING_COMPONENT = `import React, { Fragment, useMemo } from 'react';

export type QuerystringProps = React.ComponentProps<'pre'> & {
  value: string | URLSearchParams
  keepKeys?: string[]
}

function filterKeys(query: string | URLSearchParams, keys?: string[]) {
  const src = new URLSearchParams(query)
  if (!keys?.length) return src
  
  const dest = new URLSearchParams()
  for (const [k, v] of src.entries()) {
    if (keys.includes(k)) dest.append(k, v)
  }
  return dest
}

export function Querystring({ value, keepKeys, className, ...props }: QuerystringProps) {
  const search = useMemo(() => filterKeys(value, keepKeys), [value, keepKeys])
  
  return (
    <pre
      aria-label="Querystring spy"
      className="block w-full overflow-x-auto rounded-lg px-4 py-3 text-xs sm:text-sm font-mono"
      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
      {...props}
    >
      {Array.from(search.entries()).map(([k, v], i) => (
        <Fragment key={k + i}>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>
            {i === 0 ? '?' : <><wbr />&</>}
          </span>
          <span className="text-[#005CC5] dark:text-[#79B8FF]">{k}</span>=
          <span className="text-[#D73A49] dark:text-[#F97583]">{v}</span>
        </Fragment>
      ))}
      {search.size === 0 && (
        <span style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
          {'<empty query>'}
        </span>
      )}
    </pre>
  )
}
`

/**
 * Query spy with iframe-parent URL sync
 * Handles bidirectional communication between Sandpack iframe and parent window
 */
export const QUERY_SPY_COMPONENT = `import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Querystring, QuerystringProps } from './querystring';

export function QuerySpy(props: Omit<QuerystringProps, 'value'>) {
  const [searchParams] = useSearchParams();
  const [current, setCurrent] = useState(() => new URLSearchParams(window.location.search));
  const isUpdating = useRef(false);
  const lastSearch = useRef('');

  const sendToParent = (search: string) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'nuqs-url-update', search }, '*');
    }
  };

  // Sync React Router params to parent
  useEffect(() => {
    const params = searchParams.toString();
    if (params !== lastSearch.current && !isUpdating.current) {
      lastSearch.current = params;
      sendToParent(params);
    }
    isUpdating.current = false;
  }, [searchParams]);

  // Poll for immediate URL changes
  useEffect(() => {
    let lastUrl = window.location.search;
    
    const check = () => {
      const curr = window.location.search;
      if (curr !== lastUrl) {
        lastUrl = curr;
        const params = new URLSearchParams(curr);
        setCurrent(params);
        const str = params.toString();
        if (str !== lastSearch.current && !isUpdating.current) {
          lastSearch.current = str;
          sendToParent(str);
        }
      }
    };

    let rafId: number;
    const poll = () => {
      check();
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Listen for parent URL and theme updates
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'nuqs-parent-url-update') {
        const newSearch = e.data.search;
        if (new URLSearchParams(window.location.search).toString() !== newSearch) {
          isUpdating.current = true;
          window.history.replaceState({}, '', newSearch ? \`?\${newSearch}\` : window.location.pathname);
          setCurrent(new URLSearchParams(newSearch));
          window.dispatchEvent(new PopStateEvent('popstate'));
          lastSearch.current = newSearch;
        }
      } else if (e.data?.type === 'nuqs-theme-update') {
        const theme = e.data.theme;
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.style.backgroundColor = 'hsl(var(--background))';
          document.body.style.color = 'hsl(var(--foreground))';
        } else {
          document.documentElement.classList.remove('dark');
          document.body.style.backgroundColor = 'hsl(var(--background))';
          document.body.style.color = 'hsl(var(--foreground))';
        }
      }
    };

    window.addEventListener('message', handleMessage);
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'nuqs-child-ready' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return <Querystring value={current} {...props} />;
}
`

/**
 * App wrapper component
 * Main application layout for demos
 */
export const APP_COMPONENT = `import React from 'react';
import Demo from './Demo';
import { QuerySpy } from './QuerySpy';
import "/globals.css";

function App() {
  return (
    <section className="my-5 flex flex-col items-start gap-4 p-5">
      <Demo />
      <div className="mt-6">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground">
          Query String
        </div>
        <QuerySpy />
      </div>
    </section>
  );
}

export default App;
`

/**
 * Entry point with router and nuqs setup
 * Configures React Router, NuqsAdapter, and Tailwind
 */
export const INDEX_COMPONENT = `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import App from './App';

// Configure Tailwind CDN with custom colors
if (typeof window !== 'undefined' && !document.getElementById('tailwind-config')) {
  const script = document.createElement('script');
  script.id = 'tailwind-config';
  script.innerHTML = \`
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: {
              DEFAULT: 'hsl(var(--primary))',
              foreground: 'hsl(var(--primary-foreground))',
            },
            secondary: {
              DEFAULT: 'hsl(var(--secondary))',
              foreground: 'hsl(var(--secondary-foreground))',
            },
            destructive: {
              DEFAULT: 'hsl(var(--destructive))',
              foreground: 'hsl(var(--destructive-foreground))',
            },
            muted: {
              DEFAULT: 'hsl(var(--muted))',
              foreground: 'hsl(var(--muted-foreground))',
            },
            accent: {
              DEFAULT: 'hsl(var(--accent))',
              foreground: 'hsl(var(--accent-foreground))',
            },
            popover: {
              DEFAULT: 'hsl(var(--popover))',
              foreground: 'hsl(var(--popover-foreground))',
            },
            card: {
              DEFAULT: 'hsl(var(--card))',
              foreground: 'hsl(var(--card-foreground))',
            },
          },
          borderRadius: {
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)',
          },
        },
      },
    };
  \`;
  document.head.insertBefore(script, document.head.firstChild);
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NuqsAdapter>
        <App />
      </NuqsAdapter>
    </BrowserRouter>
  </React.StrictMode>
);
`