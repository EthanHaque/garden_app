import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/Auth";
import io from "socket.io-client";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    type SortingState,
    getSortedRowModel,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Data Types ---
interface IJob {
    _id: string;
    url: string;
    status: "queued" | "processing" | "completed" | "failed";
    progress: {
        stage: string;
        percentage: number;
    };
    result?: {
        htmlContent?: string;
        extractedText?: string;
        chunks?: { text: string; embedding: number[] }[];
    };
    error?: string;
    createdAt: string;
}

export function DashboardPage() {
    const { api, user } = useAuth();
    const [url, setUrl] = useState("");
    const [jobs, setJobs] = useState<IJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // --- API Calls & Real-time updates ---
    useEffect(() => {
        api.fetch("/api/jobs")
            .then((res) => res.json())
            .then((data) => setJobs(data));
    }, [api]);

    useEffect(() => {
        if (!user) return;
        const socket = io("http://localhost:3000");

        socket.on("connect", () => {
            socket.emit("join", user._id);
        });

        socket.on(`job:update`, (data) => {
            setJobs((prevJobs) => prevJobs.map((job) => (job._id === data.jobId ? { ...job, ...data } : job)));
            if (selectedJob && selectedJob._id === data.jobId) {
                setSelectedJob((prev) => (prev ? { ...prev, ...data } : null));
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user, selectedJob]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitError(null);
        try {
            const res = await api.fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const responseData = await res.json();

            if (!res.ok) {
                if (res.status === 422 && responseData.errors && responseData.errors.url) {
                    throw new Error(responseData.errors.url);
                }
                throw new Error(responseData.message || "Failed to start job");
            }

            setJobs((prevJobs) => [responseData, ...prevJobs]);
            setUrl("");
        } catch (error: any) {
            setSubmitError(error.message);
        }
    };

    const handleRowClick = (job: IJob) => {
        setIsLoadingDetails(true);
        setSelectedJob(job);
        api.fetch(`/api/jobs/${job._id}`)
            .then((res) => res.json())
            .then((jobDetails) => {
                setSelectedJob(jobDetails);
                setIsLoadingDetails(false);
            })
            .catch(() => setIsLoadingDetails(false));
    };

    // --- Table Definition ---
    const columns: ColumnDef<IJob>[] = useMemo(
        () => [
            {
                accessorKey: "url",
                header: "URL",
                cell: ({ row }) => <div className="font-medium">{row.original.url}</div>,
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                    const status = row.original.status;
                    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
                    if (status === "completed") variant = "default";
                    if (status === "failed") variant = "destructive";
                    if (status === "processing") variant = "outline";
                    return <Badge variant={variant}>{status}</Badge>;
                },
            },
            {
                accessorKey: "progress",
                header: "Progress",
                cell: ({ row }) => {
                    const progress = row.original.progress;
                    return (
                        <div className="flex items-center gap-2">
                            <Progress value={progress.percentage} className="w-[60%]" />
                            <span className="text-sm text-muted-foreground">{progress.percentage}%</span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: "Created At",
                cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
            },
        ],
        [],
    );

    const table = useReactTable({
        data: jobs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    // --- Render ---
    return (
        <div className="h-screen flex flex-col p-4 sm:p-6 lg:p-8 gap-4 bg-muted/40">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Crawler Dashboard</h1>
                    <p className="text-muted-foreground">Monitor and inspect your scraping jobs.</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter URL to process"
                            className="w-80"
                            aria-invalid={!!submitError}
                        />
                        <Button type="submit">Start Job</Button>
                    </div>
                    {submitError && <p className="text-red-500 text-xs">{submitError}</p>}
                </form>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
                {/* Jobs List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Jobs</CardTitle>
                        <CardDescription>A list of all submitted jobs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column.columnDef.header,
                                                              header.getContext(),
                                                          )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                                onClick={() => handleRowClick(row.original)}
                                                className="cursor-pointer"
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                                No jobs yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Job Details Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                        <CardDescription>Select a job to see its details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingDetails ? (
                            <div className="flex items-center justify-center h-full">
                                <p>Loading details...</p>
                            </div>
                        ) : selectedJob ? (
                            <Tabs defaultValue="html" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="html">Raw HTML</TabsTrigger>
                                    <TabsTrigger value="text">Extracted Text</TabsTrigger>
                                    <TabsTrigger value="chunks">Chunks & Embeddings</TabsTrigger>
                                </TabsList>
                                <ScrollArea className="h-[calc(100vh-20rem)] mt-4">
                                    <TabsContent value="html">
                                        <pre className="text-xs p-2 bg-muted rounded-md whitespace-pre-wrap break-all">
                                            {selectedJob.result?.htmlContent || "No HTML content available."}
                                        </pre>
                                    </TabsContent>
                                    <TabsContent value="text">
                                        <pre className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">
                                            {selectedJob.result?.extractedText || "No extracted text available."}
                                        </pre>
                                    </TabsContent>
                                    <TabsContent value="chunks">
                                        {selectedJob.result?.chunks?.length
                                            ? selectedJob.result.chunks.map((chunk, index) => (
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
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p>No job selected.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
