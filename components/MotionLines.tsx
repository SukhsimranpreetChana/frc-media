// Decorative lines that sweep across the page behind its content, running in
// the gaps of the dot grid. Positions, colors, and timing for each line live in
// globals.css (.motion-line).
const lineCount = { across: 6, down: 3 };

export default function MotionLines() {
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
