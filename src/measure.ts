import type { PreviewMeasurement } from "../engine/one-slide-or-three/index.ts";

export async function measureSlide(title: string, copy: string): Promise<PreviewMeasurement> {
  const host = document.createElement("div");
  host.className = "measurement-host";
  const box = document.createElement("div");
  box.className = "measurement-slide";
  const titleElement = document.createElement("h2");
  titleElement.textContent = title;
  const bodyElement = document.createElement("p");
  bodyElement.textContent = copy;
  box.append(titleElement, bodyElement);
  host.appendChild(box);
  document.body.appendChild(host);
  try {
    await Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((resolve) => window.setTimeout(resolve, 500)),
    ]);
    const ratio = Math.max(box.scrollHeight / box.clientHeight, box.scrollWidth / box.clientWidth);
    return {
      fit: ratio > 1.01 ? "overflows" : ratio > 0.9 ? "fits_tightly" : "fits",
      typePressure: ratio > 1.18 ? "below_selected_minimum" : "comfortable",
      titleLines: lineCount(titleElement),
      bodyLines: lineCount(bodyElement),
      scrollWidth: box.scrollWidth,
      clientWidth: box.clientWidth,
      scrollHeight: box.scrollHeight,
      clientHeight: box.clientHeight,
    };
  } finally {
    host.remove();
  }
}

function lineCount(element: HTMLElement): number {
  if (!element.textContent?.trim()) return 0;
  const style = getComputedStyle(element);
  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;
  return Math.max(1, Math.round(element.scrollHeight / lineHeight));
}
