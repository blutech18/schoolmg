import React from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function NotFoundPage() {
  return (
    <section className="w-full min-h-[60vh] flex items-center justify-center mt-10">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <Image
          src="/img/404.png"
          alt="Page not found"
          height={500}
          width={500}
        />
        <div>
          <h1 className="text-4xl font-bold mb-5">This page is gone</h1>
          <p className="text-gray-500 !text-lg">
            Maybe the page you're looking for is not found or never existed.
          </p>
        </div>
        <a href="/">
          <Button className="mt-3">Back to Home</Button>
        </a>
      </div>
    </section>
  )
}
