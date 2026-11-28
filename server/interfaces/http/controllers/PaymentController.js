export class PaymentController {
  constructor({
    listPaymentMethods,
    createPaymentIntent,
    getOrderPayment,
    listPayments,
    handleVnpayCallback,
    handleSandboxPayment,
    confirmManualPayment,
    refundPayment,
    appBaseUrl,
  }) {
    this.listPaymentMethodsUseCase = listPaymentMethods;
    this.createPaymentIntentUseCase = createPaymentIntent;
    this.getOrderPaymentUseCase = getOrderPayment;
    this.listPaymentsUseCase = listPayments;
    this.handleVnpayCallbackUseCase = handleVnpayCallback;
    this.handleSandboxPaymentUseCase = handleSandboxPayment;
    this.confirmManualPaymentUseCase = confirmManualPayment;
    this.refundPaymentUseCase = refundPayment;
    this.appBaseUrl = appBaseUrl;
  }

  methods = async (_req, res) => {
    const result = await this.listPaymentMethodsUseCase.execute();
    res.json(result);
  };

  createIntent = async (req, res) => {
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const result = await this.createPaymentIntentUseCase.execute(req.body || {}, { clientIp });
    res.status(201).json(result);
  };

  getByOrder = async (req, res) => {
    const result = await this.getOrderPaymentUseCase.execute(req.params.orderCode);
    res.json(result);
  };

  list = async (req, res) => {
    const result = await this.listPaymentsUseCase.execute(req.user, req.query);
    res.json(result);
  };

  vnpayIpn = async (req, res) => {
    const result = await this.handleVnpayCallbackUseCase.execute(req.query);
    res.json({ RspCode: result.rspCode, Message: result.message });
  };

  vnpayReturn = async (req, res) => {
    const result = await this.handleVnpayCallbackUseCase.execute(req.query);
    if (req.query.format === 'json') {
      return res.json(result);
    }
    const qs = new URLSearchParams({
      payment_result: result.success ? 'success' : 'failed',
      order: result.orderCode || '',
      code: result.rspCode || '',
    }).toString();
    res.redirect(`${this.appBaseUrl}/?${qs}`);
  };

  sandboxConfirm = async (req, res) => {
    const result = await this.handleSandboxPaymentUseCase.execute(req.body);
    res.json(result);
  };

  confirmManual = async (req, res) => {
    const result = await this.confirmManualPaymentUseCase.execute(
      req.user,
      req.params.id,
      req.body || {}
    );
    res.json(result);
  };

  refund = async (req, res) => {
    const result = await this.refundPaymentUseCase.execute(
      req.user,
      req.params.id,
      req.body || {}
    );
    res.json(result);
  };
}
