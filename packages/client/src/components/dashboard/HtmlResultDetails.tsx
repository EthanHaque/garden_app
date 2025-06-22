import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IHtmlResult } from "@/types/job";

export function HtmlResultDetails({ result }: { result: IHtmlResult }) {
    return (
        <Tabs defaultValue="html" className="w-full">
            <TabsList>
                <TabsTrigger value="html">Raw HTML</TabsTrigger>
                <TabsTrigger value="text">Extracted Text</TabsTrigger>
                <TabsTrigger value="chunks">Chunks & Embeddings</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[calc(100vh-20rem)] mt-4">
                <TabsContent value="html">
                    <pre className="text-xs p-2 bg-muted rounded-md whitespace-pre-wrap break-all">
                        {result?.htmlContent || "No HTML content available."}
                    </pre>
                </TabsContent>
                <TabsContent value="text">
                    <pre className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">
                        {result?.extractedText || "No extracted text available."}
                    </pre>
                </TabsContent>
                <TabsContent value="chunks">
                    {result?.chunks?.length
                        ? result.chunks.map((chunk, index) => (
                              <Card key={chunk._id} className="mb-2">
                                  <CardHeader>
                                      <CardTitle>Chunk {index + 1}</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                      <p className="text-sm mb-2">{chunk.text}</p>
                                      <details>
                                          <summary className="cursor-pointer text-xs text-muted-foreground">
                                              View Embedding
                                          </summary>
                                          <pre className="text-xs mt-1 p-2 bg-muted rounded-md whitespace-pre-wrap break-all">
                                              [{chunk.embedding.join(", ")}]
                                          </pre>
                                      </details>
                                  </CardContent>
                              </Card>
                          ))
                        : "No chunks available."}
                </TabsContent>
            </ScrollArea>
        </Tabs>
    );
}
