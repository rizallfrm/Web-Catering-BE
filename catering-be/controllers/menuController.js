const { Menu } = require("../models");

module.exports = {
  getAll: async (req, res) => {
    try {
      const menus = await Menu.findAll();
      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Success get all menu",
        data: { menus },
      });
    } catch (error) {
      console.error("Error getting menus:", error);
      res.status(500).json({
        status: "Error",
        isSuccess: false,
        message: "Failed to get menus",
      });
    }
  },

  getById: async (req, res) => { 
    try {
      const menu = await Menu.findByPk(req.params.id);
      if(!menu) return res.status(404).json({ 
        status: "Error",
        isSuccess: false,
        message: "Menu not found!" 
      });
      
      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Success get menu by id",
        data: { menu },
      });
    } catch (error) {
      console.error("Error getting menu by id:", error);
      res.status(500).json({
        status: "Error", 
        isSuccess: false,
        message: "Failed to get menu"
      });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, price, image_url } = req.body;
      
      // Validasi data
      if (!name) {
        return res.status(400).json({
          status: "Error",
          isSuccess: false,
          message: "Name is required",
        });
      }
      
      if (!price) {
        return res.status(400).json({
          status: "Error",
          isSuccess: false,
          message: "Price is required",
        });
      }
      
      // Validasi panjang URL gambar jika ada
      const processedImageUrl = image_url && image_url.length > 250 
        ? image_url.substring(0, 250) 
        : image_url;
      
      const menu = await Menu.create({ 
        name, 
        description, 
        price, 
        image_url: processedImageUrl 
      });
      
      res.status(201).json({
        status: "Success",
        isSuccess: true,
        message: "Success create menu",
        data: { menu }
      });
    } catch (error) {
      console.error("Error creating menu:", error);
      res.status(500).json({
        status: "Error",
        isSuccess: false,
        message: "Failed to create menu",
      });
    }
  },

  update: async (req, res) => { 
    try {
      const menu = await Menu.findByPk(req.params.id);
      if(!menu) {
        return res.status(404).json({ 
          status: "Error",
          isSuccess: false,
          message: "Menu not found!" 
        });
      }
      
      // Validasi panjang URL gambar jika ada
      if (req.body.image_url && req.body.image_url.length > 250) {
        req.body.image_url = req.body.image_url.substring(0, 250);
      }
      
      await menu.update(req.body);
      
      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Success update menu",
        data: { menu },
      });
    } catch (error) {
      console.error("Error updating menu:", error);
      res.status(500).json({
        status: "Error",
        isSuccess: false,
        message: "Failed to update menu",
      });
    }
  },
  
  delete: async (req, res) => { 
    try {
      const menu = await Menu.findByPk(req.params.id);
      if(!menu) {
        return res.status(404).json({ 
          status: "Error",
          isSuccess: false,
          message: "Menu not found!" 
        });
      }

      await menu.destroy();
      
      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Success delete menu",
      });
    } catch (error) {
      console.error("Error deleting menu:", error);
      res.status(500).json({
        status: "Error", 
        isSuccess: false,
        message: "Failed to delete menu"
      });
    }
  }
};