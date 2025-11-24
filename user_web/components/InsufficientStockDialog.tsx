import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Package, TrendingDown, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface InsufficientStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  needed: number;
  available: number;
  onRetry?: () => void;
}

export function InsufficientStockDialog({
  open,
  onOpenChange,
  itemName = "puris",
  needed,
  available,
  onRetry,
}: InsufficientStockDialogProps) {
  const shortage = needed - available;
  const percentageAvailable = available > 0 ? Math.round((available / needed) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-500" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">Insufficient Stock</DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                Not enough {itemName} available right now
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stock Status Alert */}
          <Alert className="border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10">
            <Package className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
              Your order requires <span className="font-bold">{needed} {itemName}</span>,
              but only <span className="font-bold">{available} {itemName}</span> are currently available.
            </AlertDescription>
          </Alert>

          {/* Visual Stock Indicator */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stock Availability</span>
              <Badge variant={available > 0 ? "secondary" : "destructive"}>
                {percentageAvailable}% available
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                style={{ width: `${percentageAvailable}%` }}
              />
            </div>

            {/* Stock Details */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Required</p>
                <p className="text-lg font-bold text-foreground">{needed}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-500">{available}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Short by</p>
                <p className="text-lg font-bold text-destructive flex items-center justify-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  {shortage}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Suggestions */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">What you can do:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>Reduce the quantity of items in your cart</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>Wait a few minutes and try again (machine may be restocking)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>Try a different vending machine nearby</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Modify Cart
          </Button>
          {onRetry && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onRetry();
              }}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
