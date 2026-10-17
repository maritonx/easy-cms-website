import type { Metadata } from 'next'
import { WhyOverview } from '@/components/why/overview'
import { whyMetadata } from '@/components/why/why-metadata'
import { WHY_OVERVIEW } from '@/lib/why/copy'

export const metadata: Metadata = whyMetadata({ locale: 'th', rest: '', ...WHY_OVERVIEW.th.meta })

export default function Why() {
  return <WhyOverview locale="th" />
}
