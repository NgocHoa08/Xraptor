export class ProductController {
  constructor({ listProducts, getProduct, createProduct, updateProduct, deleteProduct }) {
    this.listProductsUseCase = listProducts;
    this.getProductUseCase = getProduct;
    this.createProductUseCase = createProduct;
    this.updateProductUseCase = updateProduct;
    this.deleteProductUseCase = deleteProduct;
  }

  list = async (req, res) => {
    const result = await this.listProductsUseCase.execute(req.query);
    res.json(result);
  };

  getById = async (req, res) => {
    const result = await this.getProductUseCase.execute(req.params.id);
    res.json(result);
  };

  create = async (req, res) => {
    const result = await this.createProductUseCase.execute(req.user, req.body);
    res.status(201).json(result);
  };

  update = async (req, res) => {
    const result = await this.updateProductUseCase.execute(req.user, req.params.id, req.body);
    res.json(result);
  };

  delete = async (req, res) => {
    const result = await this.deleteProductUseCase.execute(req.user, req.params.id);
    res.json(result);
  };
}
