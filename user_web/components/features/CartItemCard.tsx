import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, X } from "lucide-react"
import { ItemModel as BaseItemModel } from "@/models/itemModel"
import { cn } from "@/lib/utils"

type ExtendedItemModel = BaseItemModel & { quantity: number }

interface CartItemCardProps {
  item: ExtendedItemModel
  index: number
  onQuantityChange: (action: "+" | "-") => void
  onRemove: () => void
}

export function CartItemCard({ item, index, onQuantityChange, onRemove }: CartItemCardProps) {
  const itemTotal = (item.price ?? 0) * item.quantity;

  return (
    <div className="group">
      <div className="flex gap-4 py-5">
        {/* Product Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted ring-1 ring-border">
          {item.imgUrl ? (
            <Image
              src={item.imgUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="96px"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-4xl">
              🍽️
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Section - Name, Badge, Remove */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-5 w-5 border-2 flex items-center justify-center rounded-sm border-green-600 flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                </div>
                {index === 0 && (
                  <Badge variant="secondary" className="h-5 px-2 text-xs bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                    Bestseller
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-base leading-snug mb-1">
                {item.name}
              </h3>
              {item.desc && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  {item.desc}
                </p>
              )}
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 bg-red-500 hover:bg-red-600 shadow-sm transition-colors -mt-1"
              onClick={onRemove}
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>

          {/* Bottom Section - Price and Controls */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1 bg-primary text-white rounded-lg px-1.5 py-1.5 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/20 text-white"
                onClick={() => onQuantityChange("-")}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[36px] text-center font-bold text-sm">
                {item.quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/20 text-white"
                onClick={() => onQuantityChange("+")}
                disabled={item.quantity >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-right">
              <div className="text-base font-bold">
                ₹{itemTotal.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">
                ₹{item.price} each
              </div>
            </div>
          </div>
        </div>
      </div>
      <Separator />
    </div>
  )
}
