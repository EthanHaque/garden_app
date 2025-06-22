import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/Auth";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronsUpDown, ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type IJob } from "@/types";

interface JobsTableProps {
    jobs: IJob[];
    onRowClick: (job: IJob) => void;
    selectedJobId?: string | null;
}

export function JobsTable({ jobs, onRowClick, selectedJobId }: JobsTableProps) {
    const { api } = useAuth();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const tableContainerRef = useRef<HTMLDivElement>(null);

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
                                    <TooltipContent>
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

    return (
        <>
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
                                            : flexRender(header.column.columnDef.header, header.getContext())}
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
                                    data-state={selectedJobId === row.original._id ? "selected" : ""}
                                    onClick={() => onRowClick(row.original)}
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
        </>
    );
}
