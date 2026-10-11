# LongDay design system

Character artwork is authoritative. No AI-generated substitute, redrawing, background removal, recoloring or cropping is used. The main artwork is shown in full inside a tilted glass frame. Mobile rearranges the hero into a single column, with a full-width illustration below the introduction.

| Role | Light | Dark |
|---|---|---|
| Background | #F7F2E8 | #1B1915 |
| Text | #302B22 | #F7F0E4 |
| Secondary text | #756B5B | #C1B39D |
| Accent text | #805018 | #F3C776 |
| Gold | #EDB744 | #E9B54E |
| Glass | warm-white, 53% | warm-charcoal, 57% |

Character palette: cream-white fur and coat; yellow-gold fringe and tail tip; amber-gold eyes; warm-gray markings and straps; coral paw pads and thigh marking; dark inner clothing. The avatar also has an orange-red bow. The UI contains no purple or blue-purple gradient.

Liquid-glass treatment combines translucent tinted surfaces, backdrop blur/saturation, masked multi-directional highlight rims, pointer-positioned specular light, SVG-displaced decorative reflections, inset shadows, pointer parallax and elastic touch compression. Text remains undistorted. This is an Apple-inspired web interpretation, not Apple's native optical renderer.

Safari uses standard CSS and -webkit-backdrop-filter. SVG is restricted to the reflection layer; touch devices replace its displacement with a cheaper angled reflection gradient. Unsupported blur falls back to a readable opaque surface. Reduced-motion preferences, manual pause, low memory/core counts, data-saver and measured slow frame cadence reduce effects. The canvas pauses when the tab is hidden. Color transition remains subtle.

The reference https://www.dispnt.com/ was available as search-indexed public content (personal introduction, social accounts, theme control and music). The cloud browser displayed “Site Unavailable”, so its layout and animations were not visually verified or copied.
