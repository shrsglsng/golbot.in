import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ItemModel as BaseItemModel } from "@/models/itemModel"
import { Minus, Plus } from "lucide-react"

// Extend base model to include frontend-specific fields
type ExtendedItemModel = BaseItemModel & {
  quantity: number
  availableQty: number
}

interface ProductCardProps {
  item: ExtendedItemModel
  index: number
  onQuantityChange: (action: "+" | "-") => void
  onClick?: () => void
}

export function ProductCard({ item, index, onQuantityChange, onClick }: ProductCardProps) {
  const renderControls = () => {
    if (!item.isAvailable) {
      return (
        <Button
          disabled
          variant="outline"
          className="h-10 px-4 text-sm font-medium border-destructive/30 text-destructive/70"
          size="sm"
        >
          Out of Stock
        </Button>
      )
    }

    if (item.quantity === 0) {
      return (
        <Button
          onClick={() => onQuantityChange("+")}
          variant="default"
          className="h-10 px-6 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
          size="sm"
        >
          ADD
        </Button>
      )
    }

    return (
      <div className="flex items-center gap-1 bg-primary text-white rounded-lg px-1 py-1 shadow-md">
        <Button
          onClick={() => onQuantityChange("-")}
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-white/20 text-white rounded-md"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-sm font-bold min-w-[32px] text-center">{item.quantity}</span>
        <Button
          onClick={() => onQuantityChange("+")}
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-white/20 text-white rounded-md"
          disabled={item.quantity >= 10}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border transition-all hover:shadow-lg",
        !item.isAvailable && "opacity-60",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex gap-0">
        {/* Content Section */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div className="space-y-2">
            {/* Veg/Non-veg Indicator */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-5 w-5 border-2 flex items-center justify-center rounded-sm",
                "border-green-600"
              )}>
                <div className="h-2 w-2 rounded-full bg-green-600" />
              </div>
              {index < 3 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                  Bestseller
                </Badge>
              )}
            </div>

            {/* Item Name */}
            <h3 className="font-bold text-lg leading-tight line-clamp-2">
              {item.name}
            </h3>

            {/* Description */}
            {item.desc && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {item.desc}
              </p>
            )}
          </div>

          {/* Price and Controls */}
          <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t">
            <span className="text-xl font-bold">₹{item.price}</span>
            <div onClick={(e) => e.stopPropagation()}>
              {renderControls()}
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="relative w-32 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent z-10" />
          {item.imgUrl ? (
            <Image
              src={item.imgUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="128px"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted text-5xl">
              🍽️
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
