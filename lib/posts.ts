/** Post helpers safe on the client too (no database): the live preview's view uses them. */
import type { Locale, Post } from './cms'

/** A post's language: posts from before the field are English. */
export const postLanguage = (post: Pick<Post, 'language'>): Locale => (post.language === 'th' ? 'th' : 'en')

/**
 * Minutes to read: 220 words a minute. Thai has no spaces between words, so a Thai post counts
 * characters instead, at about six a word.
 */
export function readingTime(post: Pick<Post, 'body' | 'language'>) {
  const text = JSON.stringify(post.body ?? '')
  const words = postLanguage(post) === 'th' ? text.length / 6 : text.split(/\s+/).length
  return Math.max(2, Math.round(words / 220))
}
