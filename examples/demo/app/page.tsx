import { InstallCard } from './InstallCard';
import { PushCard } from './PushCard';

export default function Home() {
  return (
    <main className="page">
      <h1 className="sr-only">crosshooks — live React hook demos</h1>

      <div className="stack">
        <InstallCard />
        <PushCard />
      </div>

      <a
        className="repo-link"
        href="https://github.com/zoharyAnd/crosshooks"
        target="_blank"
        rel="noreferrer"
      >
        View source on GitHub →
      </a>
    </main>
  );
}
