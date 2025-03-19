const { Menu } = require("../models");

module.exports = {
  getAll: async (req, res) => {
    const menus = await Menu.findAll();
    res.status(200).json({
      status: "Success",
      isSuccess: true,
      message: "Success get all menu",
      data: { menus },
    });
  },

  getById: async (req, res) => { 
    const menu = await Menu.findByPk(req.params.id);
    if(!menu) return res.status(404).json({ message: "Menu not found!" });
    res.status(200).json({
      status: "Success",
      isSuccess: true,
      message: "Success get menu by id",
      data: { menu },
    });
  },

  create: async (req, res) => {
    const { name, description, price, image_url } = req.body;
    const menu = await Menu.create({ name, description, price, image_url });
    res.status(201).json(
        {
            status: "Success",
            isSuccess: true,
            message: "Success create menu",
            data: { menu }
        }
    );
  },

  update: async (req, res) => { 
    const menu = await Menu.findByPk(req.params.id);
    if(!menu) return res.status(404).json({ message: "Menu not found!" });
    await menu.update(req.body);
    res.status(200).json({
      status: "Success",
      isSuccess: true,
      message: "Success update menu",
      data: { menu },
    });
  },
  
  delete: async (req, res) => { 
    const menu = await Menu.findByPk(req.params.id);
    if(!menu) return res.status(404).json({ message: "Menu not found!" });

    await menu.destroy();
    res.status(200).json({
      status: "Success",
      isSuccess: true,
      message: "Success delete menu",
    });
  }
};
