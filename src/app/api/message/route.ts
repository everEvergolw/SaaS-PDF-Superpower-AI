
import { db } from '@/db'
import { SendMessageValidator } from '@/lib/validators/SendMessageValidator'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { NextRequest } from 'next/server'
import { openai } from '@/lib/openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'


import { pinecone } from "@/lib/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";

export const POST = async (req: NextRequest) => {


      // endpoint for asking a question to a pdf file
      const body = await req.json() 


      const { getUser } = getKindeServerSession()
      const user =  await getUser()

      const { id: userId } = user

      if (!userId)
        return new Response('Unauthorized', { status: 401 })


      const { fileId, message } =
      SendMessageValidator.parse(body) 
      
      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      })

      if (!file)
        return new Response('Not found', { status: 404 })
    
      await db.message.create({
        data: {
          text: message,
          isUserMessage: true, 
          userId,
          fileId,
        },
      })  

        // 1: vectorize message
      
        const pineconeIndex = pinecone.Index("quill")  

        const embeddings = new OpenAIEmbeddings({ 
          openAIApiKey: process.env.OPENAI_API_KEY, 
        })  

        const vectorStore = await PineconeStore.fromExistingIndex(
          embeddings,
          {
            pineconeIndex,
            namespace: file.id,
          }
        )


        const results = await vectorStore.similaritySearch(
          message,
          4
        )
      
        const prevMessages = await db.message.findMany({
          where: {
            fileId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 6,
        })

        

        const formattedPrevMessages = prevMessages.map((msg) => ({
          role: msg.isUserMessage
            ? ('user' as const)
            : ('assistant' as const),
          content: msg.text,
        }))

        

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          temperature: 0,
          stream: true,
          messages: [
            {
              role: 'system',
              content:
                'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
            },
            {
              role: 'user',
              content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
              
        \n----------------\n
        
        PREVIOUS CONVERSATION:
        ${formattedPrevMessages.map((message) => {
          if (message.role === 'user')
            return `User: ${message.content}\n`
          return `Assistant: ${message.content}\n`
        })}
        
        \n----------------\n
        
        CONTEXT:
        ${results.map((r) => r.pageContent).join('\n\n')}
        
        USER INPUT: ${message}`,
            },
          ],
        }) 

        console.log(response)
      

        const stream = OpenAIStream(response, {

          async onCompletion(completion) {
            // 等待整个 completion 完成后再保存
            await db.message.create({
              data: {
                text: completion,
                isUserMessage: false,
                fileId,
                userId,
              },
            });
          },
        });
        
        // 返回完整的 StreamingTextResponse
        return new StreamingTextResponse(stream);
        


     

}