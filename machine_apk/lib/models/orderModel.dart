class Order {
  ItemQty? itemQty;
  Amount? amount;
  String? sId;
  String? uid;
  String? machineId;
  String? ostatus;
  String? orderOtp;
  String? createdAt;
  String? updatedAt;

  Order({
    this.itemQty,
    this.amount,
    this.sId,
    this.uid,
    this.machineId,
    this.ostatus,
    this.orderOtp,
    this.createdAt,
    this.updatedAt,
  });

  Order.fromJson(Map<String, dynamic> json) {
    itemQty =
        json['itemQty'] != null ? new ItemQty.fromJson(json['itemQty']) : null;
    amount =
        json['amount'] != null ? new Amount.fromJson(json['amount']) : null;
    sId = json['_id'];
    uid = json['uid'];
    machineId = json['machineId'];
    ostatus = json['ostatus'];
    orderOtp = json['orderOtp'];
    createdAt = json['createdAt'];
    updatedAt = json['updatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.itemQty != null) {
      data['itemQty'] = this.itemQty!.toJson();
    }
    if (this.amount != null) {
      data['amount'] = this.amount!.toJson();
    }
    data['_id'] = this.sId;
    data['uid'] = this.uid;
    data['machineId'] = this.machineId;
    data['ostatus'] = this.ostatus;
    data['orderOtp'] = this.orderOtp;
    data['createdAt'] = this.createdAt;
    data['updatedAt'] = this.updatedAt;
    return data;
  }
}

class ItemQty {
  int? GOL;
  int? PAN;
  int? PWO;

  ItemQty({this.GOL, this.PAN, this.PWO});

  ItemQty.fromJson(Map<String, dynamic> json) {
    GOL = json['GOL'] ?? 0;
    PAN = json['PAN'] ?? 0;
    PWO = json['PWO'] ?? 0;
  }

  Map<String, int> toJson() {
    final Map<String, int> data = <String, int>{};
    data['GOL'] = GOL ?? 0;
    data['PAN'] = PAN ?? 0;
    data['PWO'] = PWO ?? 0;
    return data;
  }
}

class Amount {
  num? price;
  num? gst;
  num? total;

  Amount({this.price, this.gst, this.total});

  Amount.fromJson(Map<String, dynamic> json) {
    price = json['price'];
    gst = json['gst'];
    total = json['total'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['price'] = this.price;
    data['gst'] = this.gst;
    data['total'] = this.total;
    return data;
  }
}
