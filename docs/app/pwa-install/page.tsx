import { CodeBlock, Step } from '../components';

export default function PWAInstall() {
  return (
    <article className="rounded-[18px] border border-[#263050] bg-[#141a2e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-[#263050] px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-[#6ea8fe]">
          PWA install
        </span>
        <h1 className="mb-3 text-3xl font-bold">PWA install prompt</h1>
        <p className="text-sm leading-6 text-[#93a0c4]">
          <code className="font-mono">usePWAInstallPrompt</code> lets you offer your own
          &ldquo;Install app&rdquo; button instead of relying on the browser&apos;s default
          banner. It tracks when the browser is ready to install, whether the app is already
          installed, and triggers the native prompt on demand. On React Native and during
          server rendering it is a safe no-op, so the same button simply stays hidden.
        </p>
      </header>

      <section className="border-t border-[#263050] py-6">
        <h2 className="mb-3 text-xl font-bold text-[#e8ecf8]">What the hook returns</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[#e8ecf8]">
                <th className="border-b border-[#263050] py-2 pr-4 font-semibold">Field</th>
                <th className="border-b border-[#263050] py-2 pr-4 font-semibold">Type</th>
                <th className="border-b border-[#263050] py-2 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#93a0c4]">
              <tr>
                <td className="border-b border-[#263050] py-2 pr-4 align-top font-mono text-[#6ea8fe]">
                  canInstall
                </td>
                <td className="border-b border-[#263050] py-2 pr-4 align-top font-mono">boolean</td>
                <td className="border-b border-[#263050] py-2 align-top leading-6">
                  The browser offered an install prompt and it is ready to show.
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#263050] py-2 pr-4 align-top font-mono text-[#6ea8fe]">
                  isInstalled
                </td>
                <td className="border-b border-[#263050] py-2 pr-4 align-top font-mono">boolean</td>
                <td className="border-b border-[#263050] py-2 align-top leading-6">
                  The app is already running as an installed PWA.
                </td>
              </tr>
              <tr>
                <td className="border-b border-[#263050] py-2 pr-4 align-top font-mono text-[#6ea8fe]">
                  isSupported
                </td>
                <td className="border-b border-[#263050] py-2 pr-4 align-top font-mono">boolean</td>
                <td className="border-b border-[#263050] py-2 align-top leading-6">
                  <code className="font-mono">false</code> on React Native, during server
                  rendering, and where install prompts do not exist.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top font-mono text-[#6ea8fe]">promptInstall</td>
                <td className="py-2 pr-4 align-top font-mono">{'() => Promise'}</td>
                <td className="py-2 align-top leading-6">
                  Shows the native prompt and resolves with an{' '}
                  <code className="font-mono">outcome</code> of{' '}
                  <code className="font-mono">accepted</code>,{' '}
                  <code className="font-mono">dismissed</code>, or{' '}
                  <code className="font-mono">unavailable</code>.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <Step number={1} title="Make the app installable">
        <p>
          The browser only fires an install prompt when the app meets its install criteria:
          a web app manifest with an icon set and a registered service worker, served over
          HTTPS. Localhost counts as secure during development.
        </p>
        <p>
          The hook does not create these for you — it listens for the browser&apos;s
          install signals once the criteria are met.
        </p>
      </Step>

      <Step number={2} title="Read the install state">
        <CodeBlock
          lang="tsx"
          code={`import { usePWAInstallPrompt } from '@zoharyandrianome/crosshooks';

function InstallButton() {
  const { canInstall, isInstalled, promptInstall } = usePWAInstallPrompt();

  // Nothing to offer: already installed, or the browser isn't ready.
  if (isInstalled || !canInstall) return null;

  // Render your button here.
}`}
        />
        <p>
          <code className="font-mono">canInstall</code> stays{' '}
          <code className="font-mono">false</code> until the browser is ready, so the button
          appears only when installing will actually work.
        </p>
      </Step>

      <Step number={3} title="Trigger the prompt from a user action">
        <p>
          Call <code className="font-mono">promptInstall()</code> directly from a click. The
          browser blocks the prompt if it is not tied to a user gesture.
        </p>
        <CodeBlock
          lang="tsx"
          code={`return (
  <button
    onClick={async () => {
      const { outcome } = await promptInstall();
      if (outcome === 'accepted') {
        // The user installed the app.
      }
    }}
  >
    Install app
  </button>
);`}
        />
        <p>
          A deferred prompt can be shown only once. After the user responds,{' '}
          <code className="font-mono">canInstall</code> becomes{' '}
          <code className="font-mono">false</code> and, on acceptance,{' '}
          <code className="font-mono">isInstalled</code> becomes{' '}
          <code className="font-mono">true</code>.
        </p>
      </Step>

      <Step number={4} title="Account for platforms without a prompt">
        <p>
          Some platforms — notably iOS Safari — do not expose a programmatic install prompt.
          There <code className="font-mono">canInstall</code> stays{' '}
          <code className="font-mono">false</code> and users install through the browser
          menu (Share → Add to Home Screen). Because the hook already hides the button in
          that case, no extra branching is required; add your own hint if you want to guide
          those users.
        </p>
      </Step>
    </article>
  );
}
