import type { Metadata } from 'next'
import { CompareOverview } from '@/components/why/compare-pages'
import { whyMetadata } from '@/components/why/why-metadata'
import { COMPARE_OVERVIEW } from '@/lib/why/copy'

export const metadata: Metadata = whyMetadata({ locale: 'th', rest: 'compare', ...COMPARE_OVERVIEW.th.meta })

export default function Compare() {
  return <CompareOverview locale="th" />
}
