const { Service } = require("../models");
const { uploadFileToSupabase, deleteFileFromSupabase } = require('../services/uploadService');

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      order: [["name", "ASC"]],
    });
    res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Failed to fetch services", error: error.message });
  }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ message: "Failed to fetch service", error: error.message });
  }
};

// Create new service with image upload
exports.createService = async (req, res) => {
  try {
    const { name, description, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Service name and price are required" });
    }

    // Handle image upload if file is provided
    let image_url = null;
    if (req.file) {
      try {
        image_url = await uploadFileToSupabase(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'services'
        );
        console.log("Image uploaded successfully:", image_url);
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return res.status(500).json({ 
          message: "Failed to upload service image", 
          error: uploadError.message 
        });
      }
    }

    // Create service with image URL
    const newService = await Service.create({
      name,
      description,
      price,
      image_url,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json(newService);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ message: "Failed to create service", error: error.message });
  }
};

// Update service with image upload
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;

    // Check if service exists
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Handle image upload if file is provided
    let image_url = service.image_url;
    if (req.file) {
      try {
        // Upload new image
        const newImageUrl = await uploadFileToSupabase(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'services'
        );
        
        // Delete old image if it exists
        if (service.image_url) {
          await deleteFileFromSupabase(service.image_url);
        }
        
        image_url = newImageUrl;
        console.log("Image updated successfully:", image_url);
      } catch (uploadError) {
        console.error("Error updating image:", uploadError);
        return res.status(500).json({ 
          message: "Failed to update service image", 
          error: uploadError.message 
        });
      }
    }

    // Update service
    await service.update({
      name: name || service.name,
      description: description !== undefined ? description : service.description,
      price: price || service.price,
      image_url: image_url,
      updated_at: new Date(),
    });

    res.status(200).json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Failed to update service", error: error.message });
  }
};

// Delete service and its image
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Delete image from Supabase if it exists
    if (service.image_url) {
      try {
        await deleteFileFromSupabase(service.image_url);
        console.log("Service image deleted successfully");
      } catch (deleteError) {
        console.error("Error deleting service image:", deleteError);
        // Continue with service deletion even if image deletion fails
      }
    }

    // Delete service
    await service.destroy();
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Failed to delete service", error: error.message });
  }
};