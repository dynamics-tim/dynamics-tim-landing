/** Sort helpers for content collection entries. */

/** Featured entries first, otherwise keep the original order (stable sort). */
export function byFeaturedFirst(
  a: { data: { featured: boolean } },
  b: { data: { featured: boolean } }
): number {
  if (a.data.featured === b.data.featured) return 0;
  return a.data.featured ? -1 : 1;
}
