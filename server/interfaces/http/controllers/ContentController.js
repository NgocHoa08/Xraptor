export class ContentController {
  constructor({
    createContact,
    listContacts,
    updateContactStatus,
    deleteContact,
    createSubscriber,
    listSubscribers,
    deleteSubscriber,
    listBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    getDashboard,
    uploadImage,
  }) {
    this.createContactUseCase = createContact;
    this.listContactsUseCase = listContacts;
    this.updateContactStatusUseCase = updateContactStatus;
    this.deleteContactUseCase = deleteContact;
    this.createSubscriberUseCase = createSubscriber;
    this.listSubscribersUseCase = listSubscribers;
    this.deleteSubscriberUseCase = deleteSubscriber;
    this.listBlogsUseCase = listBlogs;
    this.createBlogUseCase = createBlog;
    this.updateBlogUseCase = updateBlog;
    this.deleteBlogUseCase = deleteBlog;
    this.getDashboardUseCase = getDashboard;
    this.uploadImageUseCase = uploadImage;
  }

  // Contacts
  createContact = async (req, res) => {
    const result = await this.createContactUseCase.execute(req.body);
    res.status(201).json(result);
  };
  listContacts = async (req, res) => {
    const result = await this.listContactsUseCase.execute(req.user);
    res.json(result);
  };
  updateContactStatus = async (req, res) => {
    const result = await this.updateContactStatusUseCase.execute(
      req.user,
      req.params.id,
      req.body?.status
    );
    res.json(result);
  };
  deleteContact = async (req, res) => {
    const result = await this.deleteContactUseCase.execute(req.user, req.params.id);
    res.json(result);
  };

  // Subscribers
  createSubscriber = async (req, res) => {
    const result = await this.createSubscriberUseCase.execute(req.body?.email);
    res.status(201).json(result);
  };
  listSubscribers = async (req, res) => {
    const result = await this.listSubscribersUseCase.execute(req.user);
    res.json(result);
  };
  deleteSubscriber = async (req, res) => {
    const result = await this.deleteSubscriberUseCase.execute(req.user, req.params.id);
    res.json(result);
  };

  // Blogs
  listBlogs = async (_req, res) => {
    const result = await this.listBlogsUseCase.execute();
    res.json(result);
  };
  createBlog = async (req, res) => {
    const result = await this.createBlogUseCase.execute(req.user, req.body);
    res.status(201).json(result);
  };
  updateBlog = async (req, res) => {
    const result = await this.updateBlogUseCase.execute(req.user, req.params.id, req.body);
    res.json(result);
  };
  deleteBlog = async (req, res) => {
    const result = await this.deleteBlogUseCase.execute(req.user, req.params.id);
    res.json(result);
  };

  // Dashboard & Media
  getDashboard = async (req, res) => {
    const result = await this.getDashboardUseCase.execute(req.user);
    res.json(result);
  };
  uploadImage = async (req, res) => {
    const result = await this.uploadImageUseCase.execute(req.user, req.file);
    res.json(result);
  };
}
