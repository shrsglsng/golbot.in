import Head from "next/head"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { selectCart, setItems, updateCart, clearCart } from "../../redux/cartSlice"
import { GetServerSideProps } from "next/types"
import Navbar from "../../shared/navbar"
import { ItemModel as BaseItemModel } from "../../models/itemModel"
import { ProductCard } from "@/components/features/ProductCard"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/Container"
import { Stack } from "@/components/layout/Stack"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import MachineBanner from "@/components/MachineBanner"
import ActiveOrderBanner from "@/components/ActiveOrderBanner"
import { saveMachineId, isAuthenticated } from "../../utils/machineStorage"
import { getActiveOrder } from "../../services/order"
import { OrderModel } from "../../models/orderModel"
import { Loader2, Search, ShoppingCart, ChevronRight, Minus, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Extend base model to include frontend-specific fields
type ExtendedItemModel = BaseItemModel & {
  quantity: number
  availableQty: number
}

interface MachineData {
  mid: string;
  location?: string;
  mstatus?: string;
}

export default function Home({ allItems, machineData }: Readonly<{ allItems: ExtendedItemModel[], machineData?: MachineData }>) {
  const router = useRouter()
  const dispatch = useDispatch()
  const items = useSelector(selectCart) as ExtendedItemModel[]
  const { mid } = router.query
  const [total, setTotal] = useState(0)
  const [showOrderStrip, setShowOrderStrip] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItem, setSelectedItem] = useState<ExtendedItemModel | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [activeOrder, setActiveOrder] = useState<OrderModel | null>(null)
  const initializedMachineRef = useRef<string | null>(null)

  // Check authentication and save MID
  useEffect(() => {
    if (mid && typeof mid === 'string') {
      // Save the MID to localStorage
      saveMachineId(mid);

      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        router.replace(`/auth/login?next=${mid}`);
        return;
      }

      setCheckingAuth(false);
    }
  }, [mid, router]);

  // Check for active orders
  const checkActiveOrder = () => {
    if (isAuthenticated()) {
      getActiveOrder()
        .then((result) => {
          if (result && result.hasActiveOrder && result.activeOrder) {
            setActiveOrder(result.activeOrder);
          } else {
            setActiveOrder(null);
          }
        })
        .catch((error) => {
          console.error("Error checking active order:", error);
        });
    }
  };

  useEffect(() => {
    if (!checkingAuth) {
      checkActiveOrder();
    }
  }, [checkingAuth]);

  // Re-check active orders when page becomes visible (e.g., after browser back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !checkingAuth) {
        checkActiveOrder();
      }
    };

    const handleFocus = () => {
      if (!checkingAuth) {
        checkActiveOrder();
      }
    };

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Handle browser back/forward navigation
    window.addEventListener('pageshow', (event) => {
      // Check if page was restored from bfcache
      if (event.persisted && !checkingAuth) {
        checkActiveOrder();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkingAuth]);

  // Initialize cart with allItems, then restore saved cart from localStorage
  useEffect(() => {
    // Only initialize cart when machine ID is available and hasn't been initialized yet
    if (mid && typeof mid === 'string' && allItems.length > 0 && initializedMachineRef.current !== mid) {
      initializedMachineRef.current = mid

      try {
        const savedCart = localStorage.getItem(`golbot_cart_${mid}`)
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          // Merge saved quantities with current items
          const restoredItems = allItems.map(item => {
            const savedItem = parsedCart.find((saved: any) => saved.id === item.id)
            return savedItem ? { ...item, quantity: Math.min(savedItem.quantity, 10) } : item
          })
          dispatch(setItems({ allItems: restoredItems }))
        } else {
          // No saved cart, initialize with zero quantities
          dispatch(setItems({ allItems }))
        }
      } catch (error) {
        console.error('Error restoring cart from localStorage:', error)
        dispatch(setItems({ allItems }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mid]) // Only run when machine ID changes

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (mid && typeof mid === 'string' && items.length > 0) {
      try {
        // Only save items with quantity > 0
        const itemsToSave = items
          .filter(item => item.quantity > 0)
          .map(item => ({ id: item.id, quantity: item.quantity }))
        localStorage.setItem(`golbot_cart_${mid}`, JSON.stringify(itemsToSave))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [items, mid])

  useEffect(() => {
    let tmp = 0
    items.forEach((ele) => {
      if (!isNaN(ele.price) && !isNaN(ele.quantity)) {
        tmp += ele.price * ele.quantity
      }
    })
    setTotal(tmp)
  }, [items])

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    // Check if user came from order completion
    if (router.asPath.includes('fromOrderComplete=true')) {
      setShowOrderStrip(true)

      // Clear cart from localStorage after successful order
      if (mid && typeof mid === 'string') {
        try {
          localStorage.removeItem(`golbot_cart_${mid}`)
          // Reset cart in Redux
          dispatch(clearCart())
          dispatch(setItems({ allItems }))
        } catch (error) {
          console.error('Error clearing cart:', error)
        }
      }

      // Hide the strip after 10 seconds
      const stripTimeout = setTimeout(() => {
        setShowOrderStrip(false)
      }, 10000)

      return () => clearTimeout(stripTimeout)
    }
  }, [router.asPath, mid, dispatch, allItems])

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.desc?.toLowerCase().includes(query)
    )
  })

  const itemsInCart = items.filter(i => i.quantity > 0).length
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // Show normal menu
  return (
    <>
      <Head>
        <title>Menu - GolBot</title>
        <meta name="description" content="Order delicious snacks from GolBot vending machine" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="w-full fixed top-0 z-[45] bg-background/95 backdrop-blur-md border-b shadow-sm">
        <Navbar />
        {machineData && (
          <MachineBanner
            machineId={machineData.mid}
            location={machineData.location}
            variant="compact"
          />
        )}
        {/* Machine offline warning */}
        {machineData && machineData.mstatus !== 'CONNECTED' && (
          <div className="w-full bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 py-2.5 px-4">
            <div className="flex items-center justify-center gap-2 text-amber-900 dark:text-amber-100">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs font-medium">Machine offline - Browse only mode</p>
            </div>
          </div>
        )}
      </div>

      {/* Green strip for order completion */}
      {showOrderStrip && (
        <div className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 px-4 fixed top-[72px] z-[44] shadow-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
            <p className="text-sm font-medium">Order is being prepared</p>
            <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background">
        <div className="w-full flex justify-center">
          <div className="w-full md:w-5/6 lg:max-w-4xl min-h-screen pb-32">
            <div className="pt-[72px]">
              {/* Active Order Banner */}
              {activeOrder && (
                <div className="px-4 pt-4 pb-2">
                  <ActiveOrderBanner activeOrder={activeOrder} />
                </div>
              )}

              {/* Search and Header Section */}
              <div className="bg-background sticky top-[72px] z-[43] border-b shadow-sm">
                <div className="p-4 space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
                    <p className="text-sm text-muted-foreground">{items.filter(i => i.isAvailable).length} items available</p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search for items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                  </div>
                </div>
              </div>

              {/* Product List */}
              <div className="px-4 py-6">
                {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item, i) => {
                      const uniqueKey = item.id ? `item-${item.id}` : `item-index-${i}`;
                      return (
                        <ProductCard
                          key={uniqueKey}
                          item={item}
                          index={i}
                          onClick={() => {
                            // Get fresh item from Redux store
                            const freshItem = items.find(it => it.id === item.id);
                            setSelectedItem(freshItem || item);
                          }}
                          onQuantityChange={(action) => {
                            // Always get the latest item from Redux store, not from the closure
                            const currentItem = items.find(it => it.id === item.id);
                            const originalIndex = items.findIndex(it => it.id === item.id);

                            if (!currentItem || originalIndex === -1) {
                              console.error('❌ Item not found in cart:', item.name);
                              return;
                            }

                            if (action === "+" && currentItem.quantity < 10) {
                              const updatedItem = { ...currentItem, quantity: currentItem.quantity + 1 }
                              dispatch(updateCart({ item: updatedItem, index: originalIndex }))
                            } else if (action === "-" && currentItem.quantity > 0) {
                              const updatedItem = { ...currentItem, quantity: currentItem.quantity - 1 }
                              dispatch(updateCart({ item: updatedItem, index: originalIndex }))
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No items found</h3>
                    <p className="text-sm text-muted-foreground">Try searching with different keywords</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                  </div>
                )}
              </div>
            </div>

            {/* Floating Cart Button - Swiggy/Zomato Style */}
            {total > 0 && (
              <div className="fixed bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:w-5/6 lg:max-w-4xl md:-translate-x-1/2 p-4 z-40 bg-gradient-to-t from-background via-background to-transparent pt-8 pointer-events-none">
                <div className="pointer-events-auto">
                  <Button
                    onClick={() => router.push(`/${mid}/checkout`)}
                    disabled={machineData?.mstatus !== 'CONNECTED'}
                    size="lg"
                    className="w-full h-16 text-base font-semibold shadow-2xl relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium opacity-90">{itemsInCart} {itemsInCart === 1 ? 'item' : 'items'} • {totalItems} total</div>
                          <div className="text-xs opacity-75">Added to cart</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-lg font-bold">₹{Intl.NumberFormat("en-IN").format(total)}</div>
                        </div>
                        <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Empty state when no items in cart */}
            {total === 0 && (
              <div className="fixed bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:w-5/6 lg:max-w-4xl md:-translate-x-1/2 p-4 z-40 bg-gradient-to-t from-background via-background to-transparent pt-8 pointer-events-none">
                <div className="bg-muted/50 rounded-xl p-4 text-center border border-dashed pointer-events-auto">
                  <p className="text-sm text-muted-foreground">Your cart is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">Add items to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Item View - Responsive: Sheet for Mobile, Dialog for Desktop */}
      {isMobile ? (
        <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl">
            {selectedItem && (
              <div className="h-full flex flex-col">
              {/* Image Section with Gradient Overlay */}
              <div className="relative h-64 w-full bg-gradient-to-br from-orange-100 to-red-100 flex-shrink-0">
                {selectedItem.imgUrl ? (
                  <Image
                    src={selectedItem.imgUrl}
                    alt={selectedItem.name}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    onError={(e) => {
                      // Fallback to emoji if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-9xl">
                    🍽️
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Bestseller Badge */}
                {items.findIndex(it => it.id === selectedItem.id) < 3 && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-xl px-3 py-1.5">
                      <span className="mr-1">⭐</span> Bestseller
                    </Badge>
                  </div>
                )}

                {/* Veg Indicator - Bottom Left */}
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
                    <div className="h-5 w-5 border-2 flex items-center justify-center rounded-sm border-green-600">
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                    </div>
                    <span className="text-xs font-semibold text-green-700">VEG</span>
                  </div>
                </div>

                {/* Price Tag - Bottom Right */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-xl">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary">₹{selectedItem.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Title Section */}
                  <div>
                    <SheetHeader>
                      <SheetTitle className="text-3xl font-bold text-left mb-2">
                        {selectedItem.name}
                      </SheetTitle>
                    </SheetHeader>
                    {selectedItem.desc && (
                      <p className="text-base text-muted-foreground leading-relaxed mt-2">
                        {selectedItem.desc}
                      </p>
                    )}
                  </div>

                  {/* Availability Badge */}
                  <div className="flex items-center gap-2">
                    {selectedItem.isAvailable ? (
                      <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                        Available Now
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
                        <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                        Out of Stock
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Customization Note */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-sm text-orange-900 font-medium">
                      💡 Fresh food prepared on-site just for you!
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Action Bar */}
              <div className="flex-shrink-0 p-4 bg-background border-t shadow-2xl">
                {selectedItem.quantity > 0 ? (
                  <div className="space-y-3">
                    {/* Quantity Counter */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-3">
                      <span className="text-sm font-semibold text-muted-foreground">Quantity</span>
                      <div className="flex items-center gap-3 bg-primary text-white rounded-xl px-2 py-2 shadow-lg">
                        <Button
                          onClick={() => {
                            const idx = items.findIndex(it => it.id === selectedItem.id)
                            if (idx !== -1 && selectedItem.quantity > 0) {
                              const updated = { ...selectedItem, quantity: selectedItem.quantity - 1 }
                              dispatch(updateCart({ item: updated, index: idx }))
                              setSelectedItem(updated)
                            }
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-white/20 text-white rounded-xl"
                        >
                          <Minus className="h-5 w-5 stroke-[3]" />
                        </Button>
                        <span className="text-xl font-bold min-w-[50px] text-center">
                          {selectedItem.quantity}
                        </span>
                        <Button
                          onClick={() => {
                            const idx = items.findIndex(it => it.id === selectedItem.id)
                            if (idx !== -1 && selectedItem.quantity < 10) {
                              const updated = { ...selectedItem, quantity: selectedItem.quantity + 1 }
                              dispatch(updateCart({ item: updated, index: idx }))
                              setSelectedItem(updated)
                            }
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-white/20 text-white rounded-xl"
                          disabled={selectedItem.quantity >= 10}
                        >
                          <Plus className="h-5 w-5 stroke-[3]" />
                        </Button>
                      </div>
                    </div>

                    {/* Total Price & Update Cart */}
                    <Button
                      size="lg"
                      className="w-full h-14 text-base font-bold shadow-xl rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                      onClick={() => setSelectedItem(null)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>Update Cart</span>
                        <div className="flex items-center gap-2">
                          <span>₹{(selectedItem.price * selectedItem.quantity).toFixed(0)}</span>
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      const idx = items.findIndex(it => it.id === selectedItem.id)
                      if (idx !== -1) {
                        const updated = { ...selectedItem, quantity: 1 }
                        dispatch(updateCart({ item: updated, index: idx }))
                        setSelectedItem(updated)
                      }
                    }}
                    disabled={!selectedItem.isAvailable}
                    size="lg"
                    className="w-full h-14 text-base font-bold shadow-xl rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Add to Cart</span>
                      <div className="flex items-center gap-2">
                        <span>₹{selectedItem.price}</span>
                        <Plus className="h-5 w-5" />
                      </div>
                    </div>
                  </Button>
                )}
              </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
            {selectedItem && (
              <div className="flex flex-col max-h-[90vh]">
                {/* Image Section with Gradient Overlay */}
                <div className="relative h-56 w-full bg-gradient-to-br from-orange-100 to-red-100 flex-shrink-0">
                  {selectedItem.imgUrl ? (
                    <Image
                      src={selectedItem.imgUrl}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 700px"
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-8xl">
                      🍽️
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Bestseller Badge */}
                  {items.findIndex(it => it.id === selectedItem.id) < 3 && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-xl px-3 py-1.5">
                        <span className="mr-1">⭐</span> Bestseller
                      </Badge>
                    </div>
                  )}

                  {/* Veg Indicator - Bottom Left */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
                      <div className="h-5 w-5 border-2 flex items-center justify-center rounded-sm border-green-600">
                        <div className="h-2 w-2 rounded-full bg-green-600" />
                      </div>
                      <span className="text-xs font-semibold text-green-700">VEG</span>
                    </div>
                  </div>

                  {/* Price Tag - Bottom Right */}
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-xl">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-primary">₹{selectedItem.price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {/* Title Section */}
                    <div>
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-left mb-2">
                          {selectedItem.name}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedItem.desc && (
                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                          {selectedItem.desc}
                        </p>
                      )}
                    </div>

                    {/* Availability Badge */}
                    <div className="flex items-center gap-2">
                      {selectedItem.isAvailable ? (
                        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                          Available Now
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
                          <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    {/* Customization Note */}
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                      <p className="text-sm text-orange-900 font-medium">
                        💡 Fresh food prepared on-site just for you!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="flex-shrink-0 p-4 bg-background border-t">
                  {selectedItem.quantity > 0 ? (
                    <div className="space-y-3">
                      {/* Quantity Counter */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-3">
                        <span className="text-sm font-semibold text-muted-foreground">Quantity</span>
                        <div className="flex items-center gap-3 bg-primary text-white rounded-xl px-2 py-2 shadow-lg">
                          <Button
                            onClick={() => {
                              const idx = items.findIndex(it => it.id === selectedItem.id)
                              if (idx !== -1 && selectedItem.quantity > 0) {
                                const updated = { ...selectedItem, quantity: selectedItem.quantity - 1 }
                                dispatch(updateCart({ item: updated, index: idx }))
                                setSelectedItem(updated)
                              }
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-white/20 text-white rounded-xl"
                          >
                            <Minus className="h-5 w-5 stroke-[3]" />
                          </Button>
                          <span className="text-xl font-bold min-w-[50px] text-center">
                            {selectedItem.quantity}
                          </span>
                          <Button
                            onClick={() => {
                              const idx = items.findIndex(it => it.id === selectedItem.id)
                              if (idx !== -1 && selectedItem.quantity < 10) {
                                const updated = { ...selectedItem, quantity: selectedItem.quantity + 1 }
                                dispatch(updateCart({ item: updated, index: idx }))
                                setSelectedItem(updated)
                              }
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-white/20 text-white rounded-xl"
                            disabled={selectedItem.quantity >= 10}
                          >
                            <Plus className="h-5 w-5 stroke-[3]" />
                          </Button>
                        </div>
                      </div>

                      {/* Total Price & Update Cart */}
                      <Button
                        size="lg"
                        className="w-full h-14 text-base font-bold shadow-xl rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        onClick={() => setSelectedItem(null)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>Update Cart</span>
                          <div className="flex items-center gap-2">
                            <span>₹{(selectedItem.price * selectedItem.quantity).toFixed(0)}</span>
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        const idx = items.findIndex(it => it.id === selectedItem.id)
                        if (idx !== -1) {
                          const updated = { ...selectedItem, quantity: 1 }
                          dispatch(updateCart({ item: updated, index: idx }))
                          setSelectedItem(updated)
                        }
                      }}
                      disabled={!selectedItem.isAvailable}
                      size="lg"
                      className="w-full h-14 text-base font-bold shadow-xl rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>Add to Cart</span>
                        <div className="flex items-center gap-2">
                          <span>₹{selectedItem.price}</span>
                          <Plus className="h-5 w-5" />
                        </div>
                      </div>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { mid } = context.params as { mid: string };

  if (!process.env.NEXT_PUBLIC_SERVER_URL) {
    throw new Error("Server Url Not Set");
  }

  const machineRes = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/machine/${mid}`
  );

  if (machineRes.status === 404) {
    return { notFound: true };
  }

  const machineJson = await machineRes.json();

  // Extract machine data from API response (wrapped in .data)
  const machineInfo = machineJson?.data || machineJson;

  // Debug logging
  console.log('[SSR] Machine data fetched:', {
    mid: machineInfo?.mid,
    mstatus: machineInfo?.mstatus,
    location: machineInfo?.location,
    fullResponse: machineJson
  });

  const machineData: MachineData | null = machineInfo?.mid ? {
    mid: machineInfo.mid,
    location: machineInfo.location,
    mstatus: machineInfo.mstatus
  } : null;

  const itemsRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/getAllItems`);
  const json = await itemsRes.json();
  const rawItems = json.data?.items ?? [];

  const allItems: ExtendedItemModel[] = rawItems.map((item: any) => ({
    ...item,
    id: item._id || item.id, // Map MongoDB _id to id
    availableQty: item.qtyLeft ?? 0,
    quantity: 0,
  }));

  return {
    props: {
      allItems,
      machineData
    },
  };
};

