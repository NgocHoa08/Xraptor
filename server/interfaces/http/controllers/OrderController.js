export class OrderController {
  constructor({ createOrder, trackOrders, listOrders, updateOrderStatus, deleteOrder }) {
    this.createOrderUseCase = createOrder;
    this.trackOrdersUseCase = trackOrders;
    this.listOrdersUseCase = listOrders;
    this.updateOrderStatusUseCase = updateOrderStatus;
    this.deleteOrderUseCase = deleteOrder;
  }

  create = async (req, res) => {
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const result = await this.createOrderUseCase.execute(req.body, { clientIp });
    res.status(201).json(result);
  };

  track = async (req, res) => {
    const result = await this.trackOrdersUseCase.execute(req.params.query);
    res.json(result);
  };

  list = async (req, res) => {
    const result = await this.listOrdersUseCase.execute(req.user, req.query);
    res.json(result);
  };

  updateStatus = async (req, res) => {
    const result = await this.updateOrderStatusUseCase.execute(
      req.user,
      req.params.id,
      req.body?.status
    );
    res.json(result);
  };

  delete = async (req, res) => {
    const result = await this.deleteOrderUseCase.execute(req.user, req.params.id);
    res.json(result);
  };
}
