/**
 * Render system.
 *
 * Encapsulates frame drawing so the browser app can keep its current canvas
 * renderer while making the update/render boundary obvious to future changes.
 */
export class RenderSystem {
  constructor(renderer) {
    this.renderer = renderer;
  }

  render(context) {
    this.renderer.draw(context, performance.now() / 1000);
  }
}
