import { ReactNode } from 'react';

// The main admin layout already shows the page title, back navigation and "View Portfolio".
export default function SkillsLayout({ children }: { children: ReactNode }) {
  return <div className="max-w-6xl mx-auto">{children}</div>;
}
