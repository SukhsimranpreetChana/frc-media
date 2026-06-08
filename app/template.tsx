export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition-shell flex flex-1 flex-col">{children}</div>;
}
