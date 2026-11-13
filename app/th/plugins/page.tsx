import type { Metadata } from 'next'
import { PluginsPage } from '@/components/plugins/plugins-page'
import { PLUGINS_COPY } from '@/lib/plugins'

// Shows each plugin's downloads from npm, kept for six hours (lib/npm-downloads.ts).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: PLUGINS_COPY.th.meta.title,
  description: PLUGINS_COPY.th.meta.description,
  alternates: { canonical: '/th/plugins', languages: { en: '/plugins', th: '/th/plugins', 'x-default': '/plugins' } },
}

export default function Page() {
  return <PluginsPage locale="th" />
}
