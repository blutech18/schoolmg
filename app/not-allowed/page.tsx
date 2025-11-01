import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function NotAllowed() {
  return (
    <section className="w-full min-h-[60vh] flex items-center justify-center mt-10 px-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <Image
            src="/img/403.png"
            alt="Page not found"
            height={500}
            width={500}
          />
        <div>
          <h1 className="text-4xl font-bold mb-5">Access Denied</h1>
          <p className="text-gray-500 text-lg">
            Sorry, you don’t have permission to view this page.
          </p>
        </div>
        <Link href="/" passHref>
          <Button className="mt-3" aria-label="Back to Home">
            Back to Home
          </Button>
        </Link>
      </div>
    </section>
  )
}
