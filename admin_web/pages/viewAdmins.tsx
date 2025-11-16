import { useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Mail,
  MapPin,
  Shield,
  Key,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import ChangePasswordDialog from "@/shared/changePasswordDialog";

interface Admin {
  email: string;
  location: string;
  createdAt?: string;
}

export default function ViewAdmins() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [changePasswordDialog, setChangePasswordDialog] = useState({
    open: false,
    email: "",
  });

  useEffect(() => {
    fetchAdmins();
  }, [page]);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const res = await axios.get(`${baseUrl}/admin/admins`, {
        params: {
          email: emailFilter || undefined,
          location: locationFilter || undefined,
          page,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      if (res.status === 200) {
        setAdmins(res.data.data.admins);
        setTotalPages(res.data.data.pagination.numOfPages);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = () => {
    setPage(1);
    fetchAdmins();
  };

  const handleClearFilters = () => {
    setEmailFilter("");
    setLocationFilter("");
    setSearchQuery("");
    setPage(1);
  };

  const filteredAdmins = admins.filter((admin) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      admin.email.toLowerCase().includes(query) ||
      admin.location?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Head>
        <title>Admins - GolBot Admin</title>
      </Head>

      <AppLayout title="Admins" description="Manage administrator accounts">
        <div className="space-y-6">
          {/* Action Bar */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>All Administrators</CardTitle>
                  <CardDescription>
                    {filteredAdmins.length} admin{filteredAdmins.length !== 1 ? "s" : ""} registered
                  </CardDescription>
                </div>
                <Button onClick={() => router.push("/addAdmin")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Admin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Filter by email..."
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full md:w-48"
                  />
                  <Input
                    placeholder="Filter by location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full md:w-48"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                  {(emailFilter || locationFilter) && (
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admins Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Shield className="h-12 w-12 opacity-20" />
                          <p className="text-lg font-medium">No admins found</p>
                          <p className="text-sm">
                            {searchQuery
                              ? "Try adjusting your search query"
                              : "Add a new admin to get started"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdmins.map((admin, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{admin.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{admin.location || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {admin.createdAt ? (
                            <span className="text-sm text-muted-foreground">
                              {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setChangePasswordDialog({ open: true, email: admin.email })
                            }
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Change Password
                          </Button>
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
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={page}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= totalPages) {
                        setPage(val);
                      }
                    }}
                    className="w-16 text-center"
                  />
                  <span className="text-sm text-muted-foreground">of {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Dialog */}
        <ChangePasswordDialog
          open={changePasswordDialog.open}
          onClose={() => setChangePasswordDialog({ open: false, email: "" })}
          email={changePasswordDialog.email}
          isAdmin={true}
        />
      </AppLayout>
    </>
  );
}
