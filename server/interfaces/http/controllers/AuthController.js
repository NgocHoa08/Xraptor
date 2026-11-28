export class AuthController {
  constructor({ login, getProfile, changePassword }) {
    this.loginUseCase = login;
    this.getProfileUseCase = getProfile;
    this.changePasswordUseCase = changePassword;
  }

  login = async (req, res) => {
    const result = await this.loginUseCase.execute(req.body);
    res.json(result);
  };

  me = async (req, res) => {
    const result = await this.getProfileUseCase.execute(req.user);
    res.json(result);
  };

  changePassword = async (req, res) => {
    const result = await this.changePasswordUseCase.execute(req.user, req.body);
    res.json(result);
  };
}
