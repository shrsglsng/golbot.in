export interface ItemModel {
  id: string; // make required
  name: string;
  desc: string;
  imgUrl: string;
  price: number;
  gst: number;
  isAvailable: boolean;
  qtyLeft: number;
  quantity: number; // ✅ add this
}