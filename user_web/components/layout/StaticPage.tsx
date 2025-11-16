import Head from "next/head"
import { ReactNode } from "react"
import Navbar from "@/shared/navbar"
import { Container } from "./Container"
import { Card, CardContent } from "@/components/ui/card"

interface StaticPageProps {
  title: string
  description?: string
  children: ReactNode
}

export function StaticPage({ title, description, children }: StaticPageProps) {
  return (
    <>
      <Head>
        <title>{title} - GolBot</title>
        <meta name="description" content={description || title} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen">
        <Navbar />
        <Container size="md" className="py-24">
          <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-8 md:p-12">
              <article className="prose prose-gray max-w-none dark:prose-invert">
                {children}
              </article>
            </CardContent>
          </Card>
        </Container>
      </div>
    </>
  )
}
