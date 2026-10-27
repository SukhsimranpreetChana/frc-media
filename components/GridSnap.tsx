"use client";

import { useEffect } from "react";

// Blocks whose edges should sit in the gaps between rows of the dot grid:
// page sections, then the larger boxes inside them.
const snapTargets = [
  "main > *",
  "main .page-intro",
  "main .section-heading",
  "main .scrap-card",
  "main .media-card",
].join(", ");

// Sliding carousels clip and swap their cards, so their contents are left
// alone; the section around each one still snaps as a whole.
const skipInside = ".recent-uploads-viewport, .collab-scroller";

// Nudges each block's top down onto the nearest grid line (extra margin-top)
// and rounds its height up to whole grid cells (min-height). The header is a
// whole number of cells, so the page then lines up with the dots top to
// bottom. Re-runs as content loads or changes size.
export default function GridSnap() {
  useEffect(() => {
    const main = document.querySelector("main");

    if (!main || main.hasAttribute("data-no-grid-snap")) {
      return;
    }

    const gridSize =
      parseFloat(getComputedStyle(document.body).getPropertyValue("--dot-grid")) || 18;
    const adjusted = new Set<HTMLElement>();
    let frame = 0;

    function getTargets() {
      return Array.from(document.querySelectorAll<HTMLElement>(snapTargets)).filter(
        (element) =>
          element.offsetParent !== null &&
          !element.closest(skipInside) &&
          getComputedStyle(element).position !== "absolute" &&
          getComputedStyle(element).position !== "fixed",
      );
    }

    function clearSnap(element: HTMLElement) {
      element.style.marginTop = "";
      element.style.paddingTop = "";
      element.style.minHeight = "";
      element.style.alignSelf = "";
      element.style.height = "";
    }

    // Layout position, unaffected by transforms such as the page slide-in
    // animation or the slight tilt on some cards.
    function getPageTop(element: HTMLElement) {
      let top = 0;
      let current: HTMLElement | null = element;

      while (current) {
        top += current.offsetTop;
        current = current.offsetParent as HTMLElement | null;
      }

      return top;
    }

    // How far past the last grid line a value is, ignoring sub-pixel noise.
    function overshoot(value: number) {
      const remainder = ((value % gridSize) + gridSize) % gridSize;

      return remainder < 0.5 || remainder > gridSize - 0.5 ? 0 : remainder;
    }

    // Blocks side by side in a row stretch to match each other, so they are
    // rounded together: every block in the row gets the same height.
    // Only rows that stretch their items to a shared height; layouts that
    // align items to the top keep each block's own height.
    function isInRow(element: HTMLElement) {
      const parent = element.parentElement;

      if (!parent) {
        return false;
      }

      const parentStyle = getComputedStyle(parent);
      const isRowLayout =
        parentStyle.display.includes("grid") ||
        (parentStyle.display.includes("flex") &&
          parentStyle.flexDirection.startsWith("row"));
      const alignSelf = getComputedStyle(element).alignSelf;
      const stretches =
        alignSelf === "stretch" ||
        (alignSelf === "auto" &&
          ["normal", "stretch"].includes(parentStyle.alignItems));

      return isRowLayout && stretches;
    }

    function getRowGroup(element: HTMLElement, targets: Set<HTMLElement>) {
      const parent = element.parentElement;

      if (!parent || !isInRow(element)) {
        return [element];
      }

      const top = getPageTop(element);

      return (Array.from(parent.children) as HTMLElement[]).filter(
        (sibling) =>
          targets.has(sibling) && Math.abs(getPageTop(sibling) - top) < 1,
      );
    }

    // One pass over every block; returns whether anything moved. Rounded
    // heights depend only on content, so repeating a pass changes nothing.
    function snapPass() {
      let changed = false;
      const targets = getTargets();
      const targetSet = new Set(targets);

      // Tops first, in page order, so each nudge is measured after the ones above it.
      for (const element of targets) {
        const offset = overshoot(getPageTop(element));

        if (offset) {
          const margin = parseFloat(getComputedStyle(element).marginTop) || 0;
          element.style.marginTop = `${margin + gridSize - offset}px`;
          adjusted.add(element);
          changed = true;

          // The first block in a section with no top padding or border has its
          // margin absorbed by the section's own margin; push the section's
          // content down instead.
          const parent = element.parentElement;
          const parentStyle = parent ? getComputedStyle(parent) : null;
          const marginCollapses =
            parent !== null &&
            parentStyle !== null &&
            parent.firstElementChild === element &&
            parentStyle.display === "block" &&
            parseFloat(parentStyle.paddingTop) === 0 &&
            parseFloat(parentStyle.borderTopWidth) === 0;

          if (parent && marginCollapses) {
            element.style.marginTop = "";
            const padding = parseFloat(getComputedStyle(parent).paddingTop) || 0;
            parent.style.paddingTop = `${padding + gridSize - offset}px`;
            adjusted.add(parent);
          }
        }
      }

      // Heights children-first, so a parent rounds up around its final content.
      const done = new Set<HTMLElement>();

      for (const element of [...targets].reverse()) {
        if (done.has(element)) {
          continue;
        }

        const group = getRowGroup(element, targetSet);
        group.forEach((member) => done.add(member));

        const height = Math.max(...group.map((member) => member.offsetHeight));
        const offset = overshoot(height);

        if (!offset) {
          continue;
        }

        const target = `${height + gridSize - offset}px`;

        group.forEach((member) => {
          if (member.style.minHeight !== target) {
            // Pin row members to the rounded height so stretching to their
            // neighbors cannot push them back off the grid.
            if (isInRow(member)) {
              // A fixed height (not just a minimum) so content sized to fill
              // the block, like a photo set to full height, still fills it.
              member.style.alignSelf = "start";
              member.style.height = target;
            }
            member.style.minHeight = target;
            adjusted.add(member);
            changed = true;
          }
        });
      }

      return changed;
    }

    // Always starts from the natural layout, so results never build on old ones.
    function snap() {
      adjusted.forEach(clearSnap);
      adjusted.clear();

      // Each pass can shift later blocks; a few passes always settle.
      for (let pass = 0; pass < 6 && snapPass(); pass += 1) {
        // keep going until nothing moves
      }
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(snap);
    }

    schedule();

    // Snapping lands on the same result each time, so these settle after one
    // run: the observers only fire again if the final size actually changed.
    const handleResize = () => schedule();
    const resizeObserver = new ResizeObserver(handleResize);
    const mutationObserver = new MutationObserver(handleResize);

    window.addEventListener("resize", handleResize);
    // The page slides in on load; settle once more after it lands.
    document.addEventListener("animationend", handleResize);
    resizeObserver.observe(main);
    mutationObserver.observe(main, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("animationend", handleResize);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      adjusted.forEach(clearSnap);
    };
  }, []);

  return null;
}
