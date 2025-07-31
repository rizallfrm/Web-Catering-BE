class AddressOngkirService {
  constructor() {
    // Origin toko: Ds. Karangjati, Kec. Susukan, Kab. Banjarnegara
    this.storeLocation = {
      village: 'Karangjati',
      district: 'Susukan', 
      regency: 'Banjarnegara',
      province: 'Jawa Tengah'
    };

    // Area mapping - COVERAGE REALISTIS untuk Jawa Tengah Selatan
    this.areaMapping = {
      // GRATIS - Area Terdekat (Susukan dan sekitarnya)
      gratis: {
        keywords: [
          // Susukan (lokasi toko)
          'susukan', 'desa susukan', 'kecamatan susukan', 'kec susukan', 'kec. susukan',
          'karangjati', 'desa karangjati', 'ds karangjati', 'ds. karangjati',
          // Desa-desa di Kec. Susukan
          'banjar susukan', 'kutabanjarnegara', 'rejasa', 'parakancanggah',
          'pakuran', 'banjarsari susukan', 'pakisan susukan', 'kaliwadas susukan'
        ],
        fee: 0,
        area_name: 'Susukan (Area Toko)',
        description: 'Area sekitar toko - GRATIS ONGKIR! 🎉',
        distance_range: [0, 3]
      },

      // TIER 1 - Rp 3.000 (Kecamatan Terdekat dalam Banjarnegara)
      tier1: {
        keywords: [
          // Banjarnegara Kota (pusat kabupaten)
          'banjarnegara', 'banjarnegara kota', 'kota banjarnegara', 'jalan raya banjarnegara', 
          'alun-alun banjarnegara', 'pasar banjarnegara', 'terminal banjarnegara',
          'stasiun banjarnegara', 'puskesmas banjarnegara', 'kantor bupati',
          'pendopo banjarnegara', 'masjid agung banjarnegara',
          // Kalibening (berbatasan dengan Susukan)
          'kalibening', 'desa kalibening', 'kecamatan kalibening', 'kec kalibening',
          'banjarparakan', 'kertayasa', 'karanganyar kalibening'
        ],
        fee: 3000,
        area_name: 'Kecamatan Terdekat',
        description: 'Banjarnegara Kota & Kalibening - Rp 3.000',
        distance_range: [3, 8]
      },

      // TIER 2 - Rp 5.000 (Kecamatan Sekitar di Banjarnegara)
      tier2: {
        keywords: [
          // Kecamatan di sekitar Susukan dalam Kab. Banjarnegara
          'sigaluh', 'desa sigaluh', 'kecamatan sigaluh', 'kec sigaluh',
          'wanayasa', 'desa wanayasa', 'kecamatan wanayasa', 'kec wanayasa',
          'pandanarum', 'desa pandanarum', 'kecamatan pandanarum', 'kec pandanarum',
          'pejawaran', 'desa pejawaran', 'kecamatan pejawaran', 'kec pejawaran',
          'batur', 'desa batur', 'kecamatan batur', 'kec batur',
          'pagentan', 'desa pagentan', 'kecamatan pagentan', 'kec pagentan'
        ],
        fee: 5000,
        area_name: 'Kecamatan Sekitar',
        description: 'Sigaluh, Wanayasa, Pandanarum, Pejawaran, Batur - Rp 5.000',
        distance_range: [8, 15]
      },

      // TIER 3 - Rp 8.000 (Ujung Kab. Banjarnegara)
      tier3: {
        keywords: [
          // Kecamatan bagian utara/selatan Banjarnegara
          'karangkobar', 'desa karangkobar', 'kecamatan karangkobar', 'dieng',
          'madukara', 'desa madukara', 'kecamatan madukara', 'kec madukara',
          'banjarmangu', 'desa banjarmangu', 'kecamatan banjarmangu', 'kec banjarmangu',
          'pagedongan', 'desa pagedongan', 'kecamatan pagedongan', 'kec pagedongan',
          'wanadadi', 'desa wanadadi', 'kecamatan wanadadi', 'kec wanadadi',
          'punggelan', 'desa punggelan', 'kecamatan punggelan', 'kec punggelan',
          'rakit', 'desa rakit', 'kecamatan rakit', 'kec rakit',
          'purworejo klampok', 'purwareja klampok', 'klampok', 'kec klampok',
          'mandiraja', 'desa mandiraja', 'kecamatan mandiraja'
        ],
        fee: 8000,
        area_name: 'Ujung Kabupaten',
        description: 'Karangkobar, Dieng, Banjarmangu, Punggelan, Rakit - Rp 8.000',
        distance_range: [15, 25]
      },

      // TIER 4 - Rp 12.000 (Kabupaten Tetangga Dekat)
      tier4: {
        keywords: [
          // Purbalingga (tetangga terdekat)
          'purbalingga', 'kota purbalingga', 'kabupaten purbalingga',
          'bojongsari purbalingga', 'kemangkon purbalingga', 'mrebet purbalingga',
          'kaligondang purbalingga', 'bukateja purbalingga',
          // Wonosobo (tetangga utara)
          'wonosobo', 'kota wonosobo', 'kabupaten wonosobo', 'garung wonosobo',
          'selomerto wonosobo', 'leksono wonosobo', 'kalibawang wonosobo'
        ],
        fee: 12000,
        area_name: 'Kabupaten Tetangga Dekat',
        description: 'Purbalingga & Wonosobo - Rp 12.000',
        distance_range: [25, 40]
      },

      // TIER 5 - Rp 18.000 (Kabupaten Tetangga Sedang)
      tier5: {
        keywords: [
          // Banyumas bagian utara (dekat Banjarnegara)
          'banyumas', 'kabupaten banyumas', 'rawalo banyumas', 'kebasen banyumas',
          'kemranjen banyumas', 'sumpiuh banyumas', 'tambak banyumas',
          // Kebumen bagian utara
          'kebumen', 'kabupaten kebumen', 'alian kebumen', 'pejagoan kebumen', 
          'sruweng kebumen', 'gombong kebumen'
        ],
        fee: 18000,
        area_name: 'Kabupaten Sedang',
        description: 'Banyumas & Kebumen (bagian utara) - Rp 18.000',
        distance_range: [40, 60]
      },

      // TIER 6 - Rp 25.000 (Kota Besar dalam Jangkauan)
      tier6: {
        keywords: [
          // Purwokerto & sekitarnya (kota terbesar terdekat)
          'purwokerto', 'kota purwokerto', 'purwokerto utara', 'purwokerto selatan',
          'purwokerto barat', 'purwokerto timur', 'sokaraja', 'somagede',
          'baturaden', 'kalibagor'
        ],
        fee: 25000,
        area_name: 'Purwokerto',
        description: 'Purwokerto & sekitarnya - Rp 25.000',
        distance_range: [60, 80]
      }
    };

    // Area di luar jangkauan (auto-handled)
    this.outOfRangeAreas = [
      'jakarta', 'bandung', 'surabaya', 'medan', 'makassar', 'palembang',
      'semarang', 'yogyakarta', 'yogya', 'jogja', 'solo', 'surakarta',
      'magelang', 'salatiga', 'klaten', 'boyolali', 'karanganyar',
      'cilacap', 'tegal', 'pekalongan', 'kudus', 'jepara', 'demak',
      'kendal', 'batang', 'pekalongan', 'brebes', 'tegal',
      'cirebon', 'indramayu', 'kuningan', 'majalengka', 'sumedang'
    ];
  }

  detectOngkirFromAddress(fullAddress) {
    const address = fullAddress.toLowerCase().trim();
    
    // 1. Check apakah area di luar jangkauan
    const isOutOfRange = this.outOfRangeAreas.some(area => 
      address.includes(area)
    );
    
    if (isOutOfRange) {
      return {
        tier: 'out_of_range',
        fee: 35000,
        area_name: 'Di Luar Jangkauan',
        description: 'Area di luar jangkauan layanan - Rp 35.000 (perlu konfirmasi admin)',
        confidence: 'high',
        detection_method: 'out_of_range_detection',
        requires_confirmation: true,
        note: 'Area terlalu jauh dari Banjarnegara, akan dikonfirmasi ketersediaan layanan'
      };
    }

    // 2. Exact match dengan prioritas area terdekat dulu
    const exactMatch = this.findExactMatch(address);
    if (exactMatch) {
      return {
        ...exactMatch,
        confidence: 'high',
        detection_method: 'exact_keyword_match'
      };
    }

    // 3. Partial match
    const partialMatch = this.findPartialMatch(address);
    if (partialMatch) {
      return {
        ...partialMatch,
        confidence: 'medium', 
        detection_method: 'partial_keyword_match'
      };
    }

    // 4. Pattern match (desa xxx, kecamatan xxx)
    const patternMatch = this.findByPattern(address);
    if (patternMatch) {
      return {
        ...patternMatch,
        confidence: 'low',
        detection_method: 'pattern_match'
      };
    }

    // 5. Default untuk area tidak dikenal (dalam jangkauan Jateng)
    return {
      tier: 'unknown',
      fee: 30000,
      area_name: 'Area Tidak Dikenal',
      description: 'Area belum terdaftar - Rp 30.000 (akan dikonfirmasi admin)',
      confidence: 'none',
      detection_method: 'default_fallback',
      requires_confirmation: true,
      note: 'Mohon konfirmasi lokasi dengan admin untuk memastikan layanan tersedia'
    };
  }

  // Method baru: Hitung ongkir berdasarkan jarak manual
  calculateByDistance(distance) {
    const km = parseFloat(distance);
    
    if (isNaN(km) || km < 0) {
      return {
        tier: 'unknown',
        fee: 30000,
        area_name: 'Input Tidak Valid',
        description: 'Jarak harus berupa angka positif',
        confidence: 'none',
        detection_method: 'manual_distance_invalid'
      };
    }

    // Cari tier berdasarkan jarak
    const orderedTiers = ['gratis', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6'];
    
    for (const tier of orderedTiers) {
      const config = this.areaMapping[tier];
      const [minDist, maxDist] = config.distance_range;
      
      if (km >= minDist && km <= maxDist) {
        return {
          tier,
          fee: config.fee,
          area_name: `${config.area_name} (${km} km)`,
          description: `${config.description} - Jarak: ${km} km`,
          confidence: 'high',
          detection_method: 'manual_distance',
          distance: km
        };
      }
    }

    // Jika lebih dari 80km - area di luar jangkauan
    if (km > 80) {
      return {
        tier: 'out_of_range',
        fee: 35000,
        area_name: `Area Sangat Jauh (${km} km)`,
        description: `Jarak ${km} km - Di luar jangkauan normal, Rp 35.000 (perlu konfirmasi)`,
        confidence: 'high',
        detection_method: 'manual_distance_out_of_range',
        distance: km,
        requires_confirmation: true
      };
    }

    return {
      tier: 'unknown',
      fee: 30000,
      area_name: `Area Tidak Dikenal (${km} km)`,
      description: `Jarak ${km} km - Rp 30.000 (akan dikonfirmasi admin)`,
      confidence: 'medium',
      detection_method: 'manual_distance_unknown',
      distance: km,
      requires_confirmation: true
    };
  }

  findExactMatch(address) {
    // Urutkan berdasarkan tier (gratis dulu, lalu tier1, dst)
    const orderedTiers = ['gratis', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6'];
    
    for (const tier of orderedTiers) {
      const config = this.areaMapping[tier];
      for (const keyword of config.keywords) {
        if (address.includes(keyword)) {
          return {
            tier,
            fee: config.fee,
            area_name: config.area_name,
            description: config.description,
            matched_keyword: keyword
          };
        }
      }
    }
    return null;
  }

  findPartialMatch(address) {
    const addressWords = address.split(/[\s,.-]+/);
    const orderedTiers = ['gratis', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6'];
    
    for (const tier of orderedTiers) {
      const config = this.areaMapping[tier];
      for (const keyword of config.keywords) {
        const keywordWords = keyword.split(/[\s,.-]+/);
        
        const hasMatch = keywordWords.some(kw => 
          addressWords.some(aw => {
            return (aw.includes(kw) || kw.includes(aw)) && kw.length >= 3;
          })
        );
        
        if (hasMatch) {
          return {
            tier,
            fee: config.fee,
            area_name: config.area_name,
            description: config.description,
            matched_keyword: keyword
          };
        }
      }
    }
    return null;
  }

  findByPattern(address) {
    // Pattern untuk menangkap struktur alamat Indonesia
    const patterns = [
      /(?:desa|ds\.?|kelurahan)\s+(\w+)/i,
      /(?:kecamatan|kec\.?)\s+(\w+)/i,
      /(?:kabupaten|kab\.?)\s+(\w+)/i,
      /(\w+),?\s*(?:banjarnegara|purbalingga|wonosobo)/i
    ];
    
    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match && match[1]) {
        const extractedArea = match[1].toLowerCase();
        // Coba match dengan extracted area
        const result = this.findExactMatch(extractedArea);
        if (result) {
          return result;
        }
      }
    }
    
    return null;
  }

  getSuggestions(partialInput) {
    const input = partialInput.toLowerCase();
    const suggestions = [];
    const orderedTiers = ['gratis', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6'];
    
    for (const tier of orderedTiers) {
      const config = this.areaMapping[tier];
      for (const keyword of config.keywords) {
        if (keyword.includes(input) && input.length >= 2) {
          suggestions.push({
            keyword,
            tier,
            fee: config.fee,
            area_name: config.area_name,
            description: config.description
          });
        }
      }
    }
    
    // Sort by relevance dan fee
    return suggestions
      .sort((a, b) => {
        // Prioritas: exact match > shorter keyword > lower fee
        const aExact = a.keyword === input ? 0 : 1;
        const bExact = b.keyword === input ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        
        if (a.keyword.length !== b.keyword.length) {
          return a.keyword.length - b.keyword.length;
        }
        
        return a.fee - b.fee;
      })
      .slice(0, 10); // Max 10 suggestions
  }

  validateAddress(address) {
    const result = this.detectOngkirFromAddress(address);
    
    return {
      is_valid: result.confidence !== 'none',
      confidence_level: result.confidence,
      detected_area: result.area_name,
      delivery_fee: result.fee,
      suggestions: result.confidence === 'none' ? this.getSuggestions(address) : [],
      feedback_message: this.getFeedbackMessage(result),
      store_info: {
        location: 'Ds. Karangjati, Kec. Susukan',
        note: 'Jarak dihitung dari lokasi toko di Susukan'
      }
    };
  }

  getFeedbackMessage(result) {
    const storeLocation = 'Ds. Karangjati, Susukan';
    
    switch (result.confidence) {
      case 'high':
        return `✅ Alamat terdeteksi dengan baik di area ${result.area_name}`;
      case 'medium':
        return `⚠️ Alamat terdeteksi di area ${result.area_name}, mohon konfirmasi jika kurang tepat`;
      case 'low':
        return `🔍 Area ${result.area_name} terdeteksi dengan estimasi dari ${storeLocation}`;
      default:
        return `❌ Area belum terdaftar, silakan pilih dari suggestion atau hubungi admin`;
    }
  }

  // Method tambahan untuk mendapatkan info jarak estimasi
  getDistanceEstimate(tier) {
    const estimates = {
      'gratis': '0-3 km',
      'tier1': '3-8 km', 
      'tier2': '8-15 km',
      'tier3': '15-25 km',
      'tier4': '25-40 km',
      'tier5': '40-60 km',
      'tier6': '60-80 km'
    };
    
    return estimates[tier] || 'Di luar jangkauan';
  }

  // Method untuk mendapatkan semua area dengan info lengkap
  getAllAreasWithInfo() {
    const areas = [];
    const orderedTiers = ['gratis', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6'];
    
    for (const tier of orderedTiers) {
      const config = this.areaMapping[tier];
      areas.push({
        tier,
        fee: config.fee,
        area_name: config.area_name,
        description: config.description,
        distance_estimate: this.getDistanceEstimate(tier),
        distance_range: config.distance_range,
        example_areas: config.keywords.slice(0, 5), // 5 contoh area
        total_areas: config.keywords.length
      });
    }
    
    // Tambahkan info area di luar jangkauan
    areas.push({
      tier: 'out_of_range',
      fee: 35000,
      area_name: 'Di Luar Jangkauan',
      description: 'Area di luar Jawa Tengah Selatan - Rp 35.000 (perlu konfirmasi)',
      distance_estimate: '80+ km',
      distance_range: [80, 999],
      example_areas: ['jakarta', 'bandung', 'surabaya', 'semarang', 'yogyakarta'],
      total_areas: this.outOfRangeAreas.length,
      note: 'Layanan terbatas, perlu konfirmasi admin'
    });
    
    return areas;
  }
}

module.exports = AddressOngkirService;