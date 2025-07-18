export type OrderModel = {
  oid?: string;
  id: string;
  uid: any;
  itemQty?: { GOL: number; PAN: number; PWO: number };
  machineId: string;
  amount?: {
    price: number;
    gst: number;
    total: number;
  };
  ostatus: "PENDING" | "READY" | "PREPARING" | "COMPLETED" | "CANCELED";
  orderOtp?: string;
  orderCompleted: boolean;
  paymentOrderId?: string;
};
