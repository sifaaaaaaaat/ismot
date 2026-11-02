/**
 * Re-mounts on every navigation, so each route can fade in. Kept at a couple of
 * dozen lines rather than pulling in a page-transition library: the only
 * transition this site needs is a short, tasteful fade.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade flex min-h-0 w-full flex-1 flex-col">{children}</div>;
}
