"use client";

import { usePathname } from "next/navigation";

// Decorative lines that sweep across the page behind its content, running in
// the gaps of the dot grid. Only on the home page: moving lines behind long
// text or forms make them harder to read. Positions, colors, and timing for
// each line live in globals.css (.motion-line).
const lineCount = { across: 3, down: 1 };

export default function MotionLines() {
  const pathname = usePathname();

  if (pathname !== "/") {
    return null;
  }

  return (
    <div aria-hidden="true" className="motion-lines">
      {Array.from({ length: lineCount.across }, (_, index) => (
        <span className="motion-line motion-line--across" key={`across-${index}`} />
      ))}
      {Array.from({ length: lineCount.down }, (_, index) => (
        <span className="motion-line motion-line--down" key={`down-${index}`} />
      ))}
    </div>
  );
}
