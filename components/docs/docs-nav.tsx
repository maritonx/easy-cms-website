'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { DocGroup } from '@/lib/docs/sidebar'

export function DocsNav({ groups }: { groups: DocGroup[] }) {
  const pathname = usePathname()
  return (
    <>
      {groups.map((group) => (
        <div className="side-group" key={group.title}>
          <h5>{group.title}</h5>
          <ul>
            {group.items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}
