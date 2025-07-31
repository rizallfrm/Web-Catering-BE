const AddressOngkirService = require("../services/addressOngkirService");

const ongkirService = new AddressOngkirService();

const smartDeliveryController = {
  // Auto detect ongkir dari alamat
  autoDetectOngkir: async (req, res) => {
    try {
      const { address, manual_distance } = req.body;

      console.log('Received autoDetectOngkir request:', { address, manual_distance });

      if (!address && !manual_distance) {
        return res.status(400).json({
          status: "error",
          message: "Address or manual distance is required",
        });
      }

      let result;

      if (manual_distance) {
        // Hitung berdasarkan jarak manual
        result = ongkirService.calculateByDistance(parseFloat(manual_distance));
      } else {
        // Auto detect dari alamat
        result = ongkirService.detectOngkirFromAddress(address);
      }

      console.log('Delivery calculation result:', result);

      res.status(200).json({
        status: "success",
        message: "Delivery fee calculated successfully",
        data: {
          fee: result.fee,
          area_name: result.area_name,
          description: result.description,
          confidence: result.confidence,
          detection_method: result.detection_method,
          tier: result.tier,
          matched_keyword: result.matched_keyword,
          distance_estimate: ongkirService.getDistanceEstimate(result.tier),
          requires_confirmation: result.requires_confirmation || false,
        },
      });
    } catch (error) {
      console.error("Error in autoDetectOngkir:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to calculate delivery fee",
        error: error.message,
      });
    }
  },

  // Validasi alamat dan berikan suggestions
  validateAddress: async (req, res) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({
          status: "error",
          message: "Address is required",
        });
      }

      const validation = ongkirService.validateAddress(address);

      res.status(200).json({
        status: "success",
        message: "Address validated successfully",
        data: validation,
      });
    } catch (error) {
      console.error("Error in validateAddress:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to validate address",
        error: error.message,
      });
    }
  },

  // Get suggestions berdasarkan input
  getAddressSuggestions: async (req, res) => {
    try {
      const { query } = req.query;

      console.log('Received suggestion request for:', query);

      if (!query || query.length < 2) {
        return res.status(400).json({
          status: "error",
          message: "Query must be at least 2 characters",
        });
      }

      const suggestions = ongkirService.getSuggestions(query);

      console.log('Found suggestions:', suggestions.length);

      res.status(200).json({
        status: "success",
        message: "Suggestions retrieved successfully",
        data: {
          suggestions: suggestions.map(suggestion => ({
            area: suggestion.keyword,
            fee: suggestion.fee,
            tier: suggestion.tier,
            area_name: suggestion.area_name,
            description: suggestion.description,
          })),
          total: suggestions.length,
        },
      });
    } catch (error) {
      console.error("Error in getAddressSuggestions:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get suggestions",
        error: error.message,
      });
    }
  },

  // Get semua area delivery dengan info lengkap
  getDeliveryAreas: async (req, res) => {
    try {
      console.log('Received getDeliveryAreas request');
      
      const areas = ongkirService.getAllAreasWithInfo();

      console.log('Returning delivery areas:', areas.length);

      res.status(200).json({
        status: "success",
        message: "Delivery areas retrieved successfully",
        data: {
          store_location: {
            address: "Ds. Karangjati RT 01/RW 03, Kec. Susukan",
            regency: "Kab. Banjarnegara",
            province: "Jawa Tengah",
          },
          areas,
          note: "Biaya pengiriman dihitung berdasarkan jarak dari lokasi toko",
        },
      });
    } catch (error) {
      console.error("Error in getDeliveryAreas:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get delivery areas",
        error: error.message,
      });
    }
  },
};

module.exports = smartDeliveryController;