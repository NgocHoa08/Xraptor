export class UserController {
  constructor({ listUsers, getRolesCatalog, createUser, updateUser, deleteUser }) {
    this.listUsersUseCase = listUsers;
    this.getRolesCatalogUseCase = getRolesCatalog;
    this.createUserUseCase = createUser;
    this.updateUserUseCase = updateUser;
    this.deleteUserUseCase = deleteUser;
  }

  list = async (req, res) => {
    const result = await this.listUsersUseCase.execute(req.user);
    res.json(result);
  };

  roles = async (req, res) => {
    const result = await this.getRolesCatalogUseCase.execute(req.user);
    res.json(result);
  };

  create = async (req, res) => {
    const result = await this.createUserUseCase.execute(req.user, req.body);
    res.status(201).json(result);
  };

  update = async (req, res) => {
    const result = await this.updateUserUseCase.execute(req.user, req.params.id, req.body);
    res.json(result);
  };

  delete = async (req, res) => {
    const result = await this.deleteUserUseCase.execute(req.user, req.params.id);
    res.json(result);
  };
}
