const { Service, Cart, OrderItem } = require("../models")

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      order: [["name", "ASC"]],
    })
    res.status(200).json(services)
  } catch (error) {
    console.error("Error fetching services:", error)
    res.status(500).json({ message: "Failed to fetch services", error: error.message })
  }
}

// Get service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id)

    if (!service) {
      return res.status(404).json({ message: "Service not found" })
    }

    res.status(200).json(service)
  } catch (error) {
    console.error("Error fetching service:", error)
    res.status(500).json({ message: "Failed to fetch service", error: error.message })
  }
}

// Create new service
exports.createService = async (req, res) => {
  try {
    const { name, description, price, duration, image_url } = req.body

    if (!name || !price) {
      return res.status(400).json({ message: "Service name and price are required" })
    }

    const newService = await Service.create({
      name,
      description,
      price,
      duration,
      image_url,
      created_at: new Date(),
      updated_at: new Date(),
    })

    res.status(201).json(newService)
  } catch (error) {
    console.error("Error creating service:", error)
    res.status(500).json({ message: "Failed to create service", error: error.message })
  }
}

// Update service
exports.updateService = async (req, res) => {
  try {
    const { name, description, price, duration, image_url } = req.body
    const service = await Service.findByPk(req.params.id)

    if (!service) {
      return res.status(404).json({ message: "Service not found" })
    }

    await service.update({
      name: name || service.name,
      description: description !== undefined ? description : service.description,
      price: price || service.price,
      duration: duration !== undefined ? duration : service.duration,
      image_url: image_url !== undefined ? image_url : service.image_url,
      updated_at: new Date(),
    })

    res.status(200).json(service)
  } catch (error) {
    console.error("Error updating service:", error)
    res.status(500).json({ message: "Failed to update service", error: error.message })
  }
}

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id)

    if (!service) {
      return res.status(404).json({ message: "Service not found" })
    }

    // Check if service is in any cart or order
    const cartCount = await Cart.count({ where: { service_id: req.params.id } })
    const orderCount = await OrderItem.count({ where: { service_id: req.params.id } })

    if (cartCount > 0 || orderCount > 0) {
      return res.status(400).json({
        message: "Cannot delete service that is in carts or orders",
      })
    }

    await service.destroy()
    res.status(200).json({ message: "Service deleted successfully" })
  } catch (error) {
    console.error("Error deleting service:", error)
    res.status(500).json({ message: "Failed to delete service", error: error.message })
  }
}
