import { useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  QrCode,
  Power,
  PowerOff,
  Trash2,
  RotateCcw,
  Filter,
  Download,
  Settings,
  MapPin,
  Activity,
  Package
} from "lucide-react";
import { toast } from "sonner";
import { updateMachineStatus, softDeleteMachine, restoreMachine } from "@/services/machineQR";
import { useRouter } from "next/router";
import MachineQRManager from "@/components/MachineQRManager";

interface Machine {
  mid: string;
  mstatus: string;
  location: string;
  isActive: boolean;
  email?: string;
  ipAddress?: string;
  createdAt?: string;
  puriQuantity?: number;
  lowQuantityThreshold?: number;
}

export default function ViewMachines() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [refillDialogOpen, setRefillDialogOpen] = useState(false);
  const [refillQuantity, setRefillQuantity] = useState<number>(0);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [newThreshold, setNewThreshold] = useState<number>(30);

  useEffect(() => {
    fetchMachines();
  }, [page, showDeleted]);

  async function fetchMachines() {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const res = await axios.get(`${baseUrl}/admin/machines`, {
        params: {
          page,
          isActive: showDeleted ? "false" : "true",
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      if (res.status === 200) {
        setMachines(res.data.data.machines);
        setTotalPages(res.data.data.pagination.numOfPages);
      }
    } catch (error) {
      console.error("Failed to fetch machines:", error);
      toast.error("Failed to load machines");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const res = await axios.get(`${baseUrl}/admin/machines`, {
        params: {
          mid: searchQuery,
          mstatus: statusFilter !== "ALL" ? statusFilter : undefined,
          page,
          isActive: showDeleted ? "false" : "true",
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      if (res.status === 200) {
        setMachines(res.data.data.machines);
        setTotalPages(res.data.data.pagination.numOfPages);
      }
    } catch (error) {
      console.error("Failed to search machines:", error);
      toast.error("Failed to search machines");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (mid: string, currentStatus: string) => {
    const newStatus = currentStatus === "CONNECTED" ? "DISCONNECTED" : "CONNECTED";

    try {
      const result = await updateMachineStatus(mid, newStatus);
      if (result.success) {
        toast.success(`Machine ${mid} is now ${newStatus}`);
        fetchMachines();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update machine status");
    }
  };

  const handleDeleteMachine = async (mid: string) => {
    try {
      const result = await softDeleteMachine(mid);
      if (result.success) {
        toast.success(`Machine ${mid} deleted successfully`);
        fetchMachines();
      } else {
        toast.error(result.error || "Failed to delete machine");
      }
    } catch (error) {
      toast.error("Failed to delete machine");
    }
  };

  const handleRestoreMachine = async (mid: string) => {
    try {
      const result = await restoreMachine(mid);
      if (result.success) {
        toast.success(`Machine ${mid} restored successfully`);
        fetchMachines();
      } else {
        toast.error(result.error || "Failed to restore machine");
      }
    } catch (error) {
      toast.error("Failed to restore machine");
    }
  };

  const handleOpenRefillDialog = (machine: Machine) => {
    setSelectedMachine(machine);
    setRefillQuantity(100); // Default refill amount
    setNewThreshold(machine.lowQuantityThreshold || 30);
    setRefillDialogOpen(true);
  };

  const handleCloseRefillDialog = () => {
    setRefillDialogOpen(false);
    setSelectedMachine(null);
    setRefillQuantity(0);
    setNewThreshold(30);
  };

  const handleRefillPuris = async () => {
    if (!selectedMachine || refillQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      // Refill puris
      const refillRes = await axios.post(
        `${baseUrl}/admin/machines/${selectedMachine.mid}/puris/refill`,
        { quantity: refillQuantity },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      // Update threshold if changed
      const thresholdChanged = newThreshold !== selectedMachine.lowQuantityThreshold;
      if (thresholdChanged) {
        await axios.put(
          `${baseUrl}/admin/machines/${selectedMachine.mid}/threshold`,
          { threshold: newThreshold },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("Token")}`,
            },
          }
        );
      }

      if (refillRes.status === 200) {
        const message = thresholdChanged
          ? `Added ${refillQuantity} puris and updated threshold to ${newThreshold}`
          : `Added ${refillQuantity} puris to ${selectedMachine.mid}`;
        toast.success(message);
        handleCloseRefillDialog();
        fetchMachines();
      }
    } catch (error: any) {
      console.error("Failed to update machine:", error);
      toast.error(error.response?.data?.message || "Failed to update machine");
    }
  };

  const getPuriStatusColor = (machine: Machine): string => {
    const quantity = machine.puriQuantity || 0;
    const threshold = machine.lowQuantityThreshold || 30;

    if (quantity === 0) return "text-red-500";
    if (quantity < threshold) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return "success";
      case "DISCONNECTED":
        return "secondary";
      case "PREPARING":
        return "warning";
      case "READY_FOR_PICKUP":
        return "default";
      default:
        return "secondary";
    }
  };

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.mid.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         machine.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <Head>
        <title>Machines - GolBot Admin</title>
      </Head>

      <AppLayout title="Machines" description="Manage your vending machines">
        <div className="space-y-4">
          {/* Action Bar */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>All Machines</CardTitle>
                  <CardDescription>
                    View and manage all vending machines
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleted(!showDeleted)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {showDeleted ? "Show Active" : "Show Deleted"}
                  </Button>
                  <Button onClick={() => router.push("/addMachine")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Machine
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by machine ID or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="CONNECTED">Connected</SelectItem>
                    <SelectItem value="DISCONNECTED">Disconnected</SelectItem>
                    <SelectItem value="PREPARING">Preparing</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Machines Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Puri Stock</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredMachines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No machines found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMachines.map((machine) => (
                      <TableRow key={machine.mid}>
                        <TableCell className="font-mono font-medium">
                          {machine.mid}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{machine.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(machine.mstatus) as any}>
                            <Activity className="mr-1 h-3 w-3" />
                            {machine.mstatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Package className={`h-4 w-4 ${getPuriStatusColor(machine)}`} />
                              <span className={`font-medium ${getPuriStatusColor(machine)}`}>
                                {machine.puriQuantity || 0}
                              </span>
                              {(machine.puriQuantity || 0) < (machine.lowQuantityThreshold || 30) && (
                                <Badge variant="warning" className="text-xs">
                                  Low
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Alert: {machine.lowQuantityThreshold || 30}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={machine.isActive ? "default" : "outline"}>
                            {machine.isActive ? "Active" : "Deleted"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {machine.ipAddress || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {machine.isActive ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenRefillDialog(machine)}
                                  title="Refill puris"
                                >
                                  <Package className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMachineId(machine.mid);
                                    setQrDialogOpen(true);
                                  }}
                                >
                                  <QrCode className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleStatus(machine.mid, machine.mstatus)}
                                >
                                  {machine.mstatus === "CONNECTED" ? (
                                    <PowerOff className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <Power className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteMachine(machine.mid)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreMachine(machine.mid)}
                              >
                                <RotateCcw className="h-4 w-4 text-green-500" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* QR Code Manager Dialog */}
        {selectedMachineId && (
          <MachineQRManager
            open={qrDialogOpen}
            onClose={() => {
              setQrDialogOpen(false);
              setSelectedMachineId(null);
            }}
            machineId={selectedMachineId}
          />
        )}

        {/* Puri Refill Dialog */}
        <Dialog open={refillDialogOpen} onOpenChange={setRefillDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Puris - {selectedMachine?.mid}</DialogTitle>
              <DialogDescription>
                Add puris and configure low stock alert threshold. Current stock: {selectedMachine?.puriQuantity || 0} puris
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refillQuantity">Quantity to Add</Label>
                <Input
                  id="refillQuantity"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="100"
                  value={refillQuantity || ""}
                  onChange={(e) => setRefillQuantity(parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  New total: {(selectedMachine?.puriQuantity || 0) + refillQuantity} puris
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowThreshold">Low Stock Alert Threshold</Label>
                <Input
                  id="lowThreshold"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="30"
                  value={newThreshold || ""}
                  onChange={(e) => setNewThreshold(parseInt(e.target.value) || 30)}
                />
                <p className="text-sm text-muted-foreground">
                  Alert when stock falls below this amount (currently: {selectedMachine?.lowQuantityThreshold || 30})
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-medium">{selectedMachine?.puriQuantity || 0} puris</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Adding:</span>
                  <span className="font-medium">+{refillQuantity} puris</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-medium">After Refill:</span>
                  <span className="font-bold">{(selectedMachine?.puriQuantity || 0) + refillQuantity} puris</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Alert Threshold:</span>
                  <span className="font-medium">{newThreshold} puris</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Estimated Orders:</span>
                  <span>~{Math.floor(((selectedMachine?.puriQuantity || 0) + refillQuantity) / 6)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseRefillDialog}>
                Cancel
              </Button>
              <Button onClick={handleRefillPuris} disabled={refillQuantity <= 0}>
                <Package className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
