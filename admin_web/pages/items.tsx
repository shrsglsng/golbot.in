import { useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Edit,
  Image as ImageIcon,
  Package,
  IndianRupee,
  Filter,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

interface Item {
  id: string;
  name: string;
  desc: string;
  imgUrl: string;
  price: number;
  puriPerPlate: number;
  gst: number;
  isAvailable?: boolean;
}

interface ItemDialogData {
  id?: string;
  name: string;
  desc: string;
  imgUrl: string;
  price: number;
  puriPerPlate: number;
  gst: number;
  isAvailable?: boolean;
}

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentItem, setCurrentItem] = useState<ItemDialogData>({
    name: "",
    desc: "",
    imgUrl: "",
    price: 0,
    puriPerPlate: 6,
    gst: 0,
    isAvailable: true,
  });
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const res = await axios.get(`${baseUrl}/admin/items`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      if (res.status === 200) {
        setItems(res.data.data?.items || res.data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDialog = (mode: "add" | "edit", item?: Item) => {
    setDialogMode(mode);
    if (mode === "edit" && item) {
      setCurrentItem({
        id: item.id,
        name: item.name,
        desc: item.desc,
        imgUrl: item.imgUrl,
        price: item.price,
        puriPerPlate: item.puriPerPlate || 6,
        gst: item.gst,
        isAvailable: item.isAvailable ?? true,
      });
      setImagePreview(item.imgUrl);
    } else {
      setCurrentItem({
        name: "",
        desc: "",
        imgUrl: "",
        price: 0,
        puriPerPlate: 6,
        gst: 0,
        isAvailable: true,
      });
      setImagePreview("");
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentItem({
      name: "",
      desc: "",
      imgUrl: "",
      price: 0,
      puriPerPlate: 6,
      gst: 0,
      isAvailable: true,
    });
    setImagePreview("");
  };

  const handleSaveItem = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      if (!currentItem.name || !currentItem.desc || currentItem.price <= 0) {
        toast.error("Please fill all required fields");
        return;
      }

      const url = `${baseUrl}/admin/updateItem`;

      await axios.post(url, currentItem, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      toast.success(
        dialogMode === "add" ? "Item added successfully" : "Item updated successfully"
      );
      handleCloseDialog();
      fetchItems();
    } catch (error: any) {
      console.error("Failed to save item:", error);
      toast.error(error.response?.data?.message || "Failed to save item");
    }
  };

  const handleToggleAvailability = async (item: Item) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const newAvailability = !(item.isAvailable ?? true);

      await axios.post(
        `${baseUrl}/admin/updateItem`,
        {
          id: item.id,
          name: item.name,
          desc: item.desc,
          imgUrl: item.imgUrl,
          price: item.price,
          puriPerPlate: item.puriPerPlate || 6,
          gst: item.gst,
          isAvailable: newAvailability,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      toast.success(
        `Item ${newAvailability ? "enabled" : "disabled"} successfully`
      );
      fetchItems();
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      toast.error("Failed to update item availability");
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.desc.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Head>
        <title>Menu Items - GolBot Admin</title>
      </Head>

      <AppLayout title="Menu Items" description="Manage your food items catalog">
        <div className="space-y-6">
          {/* Action Bar */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>All Menu Items</CardTitle>
                  <CardDescription>
                    {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} in catalog
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={() => handleOpenDialog("add")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Items Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-48 w-full rounded-lg mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                  <Package className="h-12 w-12 opacity-20" />
                  <p className="text-lg font-medium">No items found</p>
                  <p className="text-sm">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "Add your first menu item to get started"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-muted">
                    {item.imgUrl ? (
                      <img
                        src={item.imgUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={item.isAvailable ?? true ? "success" : "secondary"}>
                        {item.isAvailable ?? true ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {item.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span className="text-2xl font-bold">
                            ₹{item.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          GST: {item.gst}% • {item.puriPerPlate || 6} puris/plate
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.isAvailable ?? true}
                          onCheckedChange={() => handleToggleAvailability(item)}
                        />
                        <Label className="text-sm cursor-pointer">
                          {item.isAvailable ?? true ? "Available" : "Disabled"}
                        </Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog("edit", item)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Item Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "add" ? "Add New Item" : "Edit Item"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "add"
                  ? "Add a new food item to your menu"
                  : "Update item information"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Gol Gappa"
                  value={currentItem.name}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Description *</Label>
                <Input
                  id="desc"
                  placeholder="Brief description of the item"
                  value={currentItem.desc}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({ ...prev, desc: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imgUrl">Image URL</Label>
                <Input
                  id="imgUrl"
                  placeholder="https://example.com/image.jpg"
                  value={currentItem.imgUrl}
                  onChange={(e) => {
                    setCurrentItem((prev) => ({ ...prev, imgUrl: e.target.value }));
                    setImagePreview(e.target.value);
                  }}
                />
                {imagePreview && (
                  <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={() => setImagePreview("")}
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={currentItem.price || ""}
                    onChange={(e) =>
                      setCurrentItem((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst">GST (%)</Label>
                  <Input
                    id="gst"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={currentItem.gst || ""}
                    onChange={(e) =>
                      setCurrentItem((prev) => ({
                        ...prev,
                        gst: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="puriPerPlate">Puris per Plate *</Label>
                <Input
                  id="puriPerPlate"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="6"
                  value={currentItem.puriPerPlate || ""}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({
                      ...prev,
                      puriPerPlate: parseInt(e.target.value) || 6,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of puris consumed per plate of this item
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={currentItem.isAvailable ?? true}
                  onCheckedChange={(checked) =>
                    setCurrentItem((prev) => ({ ...prev, isAvailable: checked }))
                  }
                />
                <Label>Item is available for ordering</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSaveItem}>
                {dialogMode === "add" ? "Add Item" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
