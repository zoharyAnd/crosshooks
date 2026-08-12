import { CodeBlock, Step } from './components';

export default function GettingStarted() {
  return (
    <article className="rounded-[18px] border border-[#263050] bg-[#141a2e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-[#263050] px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-[#6ea8fe]">
          Documentation
        </span>
        <h1 className="mb-3 text-3xl font-bold">Getting started</h1>
        <p className="leading-6 text-[#93a0c4]">
          Install <code className="font-mono">crosshooks</code>, choose a push transport,
          register the device, and send its subscription to your backend.
        </p>
      </header>

      <Step number={1} title="Install the package">
        <CodeBlock lang="bash" code="pnpm add @zoharyandrianome/crosshooks" />
        <p>
          React 16.8 or newer is required. Provider SDKs are optional and are only
          installed when your application chooses that provider.
        </p>
      </Step>
    </article>
  );
}
