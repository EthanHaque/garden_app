import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/Auth";
import io from "socket.io-client";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    type SortingState,
    getSortedRowModel,
    getFilteredRowModel,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronsUpDown, ArrowUp, ArrowDown, User as UserIcon, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode_toggle";

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
    attempts: number;
    manualRetries?: number;
}

export function DashboardPage() {
    const { api, user, logout } = useAuth();
    const [url, setUrl] = useState("");
    const [jobs, setJobs] = useState<IJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const tableContainerRef = useRef<HTMLDivElement>(null);

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
            setSelectedJob((prevSelectedJob) => {
                if (prevSelectedJob && prevSelectedJob._id === data.jobId) {
                    return { ...prevSelectedJob, ...data };
                }
                return prevSelectedJob;
            });
        });

        socket.on(`job:delete`, (data: { jobId: string }) => {
            setJobs((prevJobs) => prevJobs.filter((job) => job._id !== data.jobId));
            setSelectedJob((prevSelectedJob) =>
                prevSelectedJob && prevSelectedJob._id === data.jobId ? null : prevSelectedJob,
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

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

    const handleRetry = async (e: React.MouseEvent<HTMLElement>, jobId: string) => {
        e.stopPropagation();
        try {
            await api.fetch(`/api/jobs/${jobId}/retry`, {
                method: "POST",
            });
        } catch (error) {
            console.error("Failed to retry job", error);
        }
    };

    const handleDelete = async (e: React.MouseEvent<HTMLElement>, jobId: string) => {
        e.stopPropagation();

        if (!window.confirm("Are you sure you want to delete this job permanently?")) {
            return;
        }

        try {
            await api.fetch(`/api/jobs/${jobId}`, {
                method: "DELETE",
            });
        } catch (error) {
            console.error("Failed to delete job", error);
        }
    };

    // --- Table Definition ---
    const columns: ColumnDef<IJob>[] = useMemo(
        () => [
            {
                accessorKey: "url",
                header: ({ column }) => (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        URL
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                ),
                cell: ({ row }) => {
                    const url = row.original.url;
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-[300px] block truncate font-medium hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {url}
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{url}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
            },
            {
                accessorKey: "status",
                header: ({ column }) => (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Status
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                ),
                cell: ({ row }) => {
                    const job = row.original;
                    const status = job.status;
                    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
                    if (status === "completed") variant = "default";
                    if (status === "failed") variant = "destructive";
                    if (status === "processing") variant = "outline";

                    if (status === "failed") {
                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant={variant} className="cursor-help">
                                            {status}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent variant="destructive">
                                        <p className="max-w-sm">{job.error || "An unknown error occurred."}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    return <Badge variant={variant}>{status}</Badge>;
                },
            },
            {
                accessorKey: "progress",
                header: "Progress",
                cell: ({ row }) => {
                    const job = row.original;
                    const progress = job.progress;
                    const totalRetries = (job.attempts || 0) + (job.manualRetries || 0);

                    let indicatorColor = "bg-primary";
                    if (job.status === "completed") {
                        indicatorColor = "bg-green-500";
                    } else if (job.status === "failed") {
                        indicatorColor = "bg-destructive";
                    } else if (job.status === "processing") {
                        indicatorColor = "bg-blue-500";
                    }

                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-help">
                                        <Progress
                                            value={progress.percentage}
                                            className="w-[60%]"
                                            indicatorClassName={indicatorColor}
                                        />
                                        <span className="text-sm text-muted-foreground">{progress.percentage}%</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Stage: {progress.stage}</p>
                                    {totalRetries > 0 && <p>Retries: {totalRetries}</p>}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: ({ column }) => (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Created At
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                ),
                cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    const job = row.original;
                    return (
                        <div className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {job.status === "failed" && (
                                        <DropdownMenuItem onClick={(e) => handleRetry(e, job._id)}>
                                            Retry Job
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        onClick={(e) => handleDelete(e, job._id)}
                                    >
                                        Delete Job
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ],
        [],
    );

    const table = useReactTable({
        data: jobs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            globalFilter,
        },
    });

    const [visibleJobsCount, setVisibleJobsCount] = useState(15);
    const { rows } = table.getRowModel();
    const visibleRows = useMemo(() => rows.slice(0, visibleJobsCount), [rows, visibleJobsCount]);

    useEffect(() => {
        const tableContainer = tableContainerRef.current;
        if (!tableContainer) return;

        const handleScroll = () => {
            const isAtBottom =
                tableContainer.scrollHeight - tableContainer.scrollTop <= tableContainer.clientHeight + 1;
            if (isAtBottom && visibleJobsCount < rows.length) {
                setVisibleJobsCount((prev) => prev + 15);
            }
        };

        tableContainer.addEventListener("scroll", handleScroll);
        return () => tableContainer.removeEventListener("scroll", handleScroll);
    }, [tableContainerRef, visibleJobsCount, rows.length]);

    // --- Render ---
    return (
        <div className="h-screen flex flex-col p-4 sm:p-6 lg:p-8 gap-4 bg-muted/40">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Crawler Dashboard</h1>
                    <p className="text-muted-foreground">Monitor and inspect your scraping jobs.</p>
                </div>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <UserIcon className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
                {/* Jobs List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Jobs</CardTitle>
                        <CardDescription>A list of all submitted jobs. Enter a URL to start a new one.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col items-start gap-2 mb-4">
                            <div className="flex items-center gap-2 w-full">
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="flex-grow"
                                    aria-invalid={!!submitError}
                                />
                                <Button type="submit">Start Job</Button>
                            </div>
                            {submitError && <p className="text-red-500 text-xs">{submitError}</p>}
                        </form>

                        <div className="flex items-center py-4 border-t">
                            <Input
                                placeholder="Filter jobs..."
                                value={globalFilter ?? ""}
                                onChange={(event) => setGlobalFilter(event.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                        <div className="rounded-md border h-[calc(100vh-30rem)] overflow-auto" ref={tableContainerRef}>
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
                                    {visibleRows.length ? (
                                        visibleRows.map((row) => (
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
                                                No jobs found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
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
