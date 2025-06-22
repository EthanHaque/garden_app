import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IJob } from "../../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JobDetailsProps {
    job: IJob | null;
    isLoading: boolean;
}

export function JobDetails({ job, isLoading }: JobDetailsProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Loading details...</p>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>No job selected.</p>
            </div>
        );
    }

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
                        {job.result?.htmlContent || "No HTML content available."}
                    </pre>
                </TabsContent>
                <TabsContent value="text">
                    <pre className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">
                        {job.result?.extractedText || "No extracted text available."}
                    </pre>
                </TabsContent>
                <TabsContent value="chunks">
                    {job.result?.chunks?.length
                        ? job.result.chunks.map((chunk, index) => (
                              <Card key={index} className="mb-2">
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
