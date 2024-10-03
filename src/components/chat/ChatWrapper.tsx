'use client'

import Link from 'next/link'

import React from 'react'
import Messages from './Messages'
import ChatInput from './ChatInput'
import { trpc } from '@/app/_trpc/client'
import { ChevronLeft, Loader2, XCircle } from 'lucide-react'
interface ChatWrapperProps {
  fileId: string
  isSubscribed: boolean
}


function ChatWrapper({
  fileId,
  isSubscribed,
}: ChatWrapperProps) { 

  
  const { data, isLoading } = trpc.getFileUploadStatus.useQuery(
    {
      fileId,
    },
    {
      refetchInterval: (query) =>
        query.state.data?.status === 'SUCCESS' ||
        query.state.data?.status === 'FAILED'
          ? false
          : 500,
    }
  )

  if (isLoading)
    return (
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2'>
            <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
            <h3 className='font-semibold text-xl'>
              Loading...
            </h3> 
            <p className='text-zinc-500 text-sm'>
              We&apos;re preparing your PDF.
            </p>
          </div>
        </div>

        <ChatInput isDisabled /> 
      </div>
    )

    

  if (data?.status === 'PROCESSING')
    return (
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>
          <div className='flex flex-col items-center gap-2'>
            <Loader2 className='h-8 w-8 text-blue-500 animate-spin' />
            <h3 className='font-semibold text-xl'>
              Processing PDF...
            </h3>
            <p className='text-zinc-500 text-sm'>
              This won&apos;t take long.
            </p>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    )

    if (data?.status === 'FAILED')
      return (
        <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
          <div className='flex-1 flex justify-center items-center flex-col mb-28'>
            <div className='flex flex-col items-center gap-2'>
              <XCircle className='h-8 w-8 text-red-500' />
              <h3 className='font-semibold text-xl'>
                Too many pages in PDF
              </h3>
              <p className='text-zinc-500 text-sm'>
                Your{' '}
                <span className='font-medium'>
                  {isSubscribed ? 'Pro' : 'Free'}
                </span>{' '}
                plan supports up to{' '}
                
                pages per PDF.
              </p>
              <Link
                href='/dashboard'
                >
                <ChevronLeft className='h-3 w-3 mr-1.5' />
                Back
              </Link>
            </div>
          </div>
  
          <ChatInput isDisabled />
        </div>
      )



    return (
      <div className='relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2'>
        
        <div className='flex-1 flex justify-center items-center flex-col mb-28'>

          <Messages fileId=''/>
        </div>


        <ChatInput isDisabled /> 
      </div>
    )
}






export default ChatWrapper 