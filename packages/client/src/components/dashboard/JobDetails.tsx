import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IJob, IHtmlResult, IPdfResult } from "../../types/job";

const API_BASE_URL = "http://localhost:3000";

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

    if (!job.result) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>This job has not produced a result yet.</p>
            </div>
        );
    }

    if (job.resultType === "PdfResult") {
        const result = job.result as IPdfResult;
        if (!result || !result.pages || result.pages.length === 0) {
            return <p>No pages found in this PDF result.</p>;
        }
        return (
            <ScrollArea className="h-[calc(100vh-20rem)] mt-4">
                {result.pages
                    .sort((a, b) => a.pageNumber - b.pageNumber)
                    .map((page) => (
                        <Card key={page._id} className="mb-4">
                            <CardHeader>
                                <CardTitle>Page {page.pageNumber}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="image" className="w-full">
                                    <TabsList>
                                        <TabsTrigger value="image">Image</TabsTrigger>
                                        <TabsTrigger value="ocr">OCR Text</TabsTrigger>
                                        <TabsTrigger value="chunks">Chunks</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="image" className="mt-2">
                                        <img
                                            src={`${API_BASE_URL}${page.imageUrl}`}
                                            alt={`Page ${page.pageNumber}`}
                                            className="rounded-md border max-w-full h-auto"
                                        />
                                    </TabsContent>
                                    <TabsContent value="ocr">
                                        <pre className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">
                                            {page.ocrText || "No OCR text available for this page."}
                                        </pre>
                                    </TabsContent>
                                    <TabsContent value="chunks">
                                        {page.chunks?.length
                                            ? page.chunks.map((chunk, index) => (
                                                  <Card key={chunk._id} className="mb-2">
                                                      <CardHeader className="py-4">
                                                          <CardTitle className="text-base">Chunk {index + 1}</CardTitle>
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
                                            : "No chunks available for this page."}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    ))}
            </ScrollArea>
        );
    } else if (job.resultType === "HtmlResult") {
        const result = job.result as IHtmlResult;
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

    return (
        <div className="flex items-center justify-center h-full">
            <p>Unsupported job result type.</p>
        </div>
    );
}
