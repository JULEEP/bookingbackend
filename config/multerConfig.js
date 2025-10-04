import multer from 'multer';
import path from 'path';

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/categoryImg');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Multer upload instance with size limit 2MB
export const uploadCategoryImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

// Future multer configs can go here:
// export const uploadOtherImages = multer({...});


// Storage configuration for tournament images
const storageTournament = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tournamentImg');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter (images only)
const fileFilterTournament = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Multer upload instance for tournament images with 2MB limit
export const uploadTournamentImage = multer({
  storage: storageTournament,
  fileFilter: fileFilterTournament,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});



const storageTurf = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/turfImg');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const fileFilterTurf = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const uploadTurfImage = multer({
  storage: storageTurf,
  fileFilter: fileFilterTurf,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});


const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profileImage'); // folder to save profile images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilterProfile = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const uploadProfileImage = multer({
  storage: storageProfile,
  fileFilter: fileFilterProfile,
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
});


const storageBanner = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/bannersImg');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilterBanner = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const uploadBannerImage = multer({
  storage: storageBanner,
  fileFilter: fileFilterBanner,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});


// Storage config for Match Image
const storageMatchImage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/matchImages'); // Save images in this folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter for image validation
const fileFilterMatchImage = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'));
  }
};

// Exported multer middleware for match image upload
export const uploadMatchImage = multer({
  storage: storageMatchImage,
  fileFilter: fileFilterMatchImage,
  limits: { fileSize: 5 * 1024 * 1024 } // Optional: limit to 5MB
});


// Storage configuration for Ad images
const storageAd = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/adsImg"); // ✅ Make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter: allow only images
const fileFilterAd = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

// Export multer instance
export const uploadAdImage = multer({
  storage: storageAd,
  fileFilter: fileFilterAd,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});



// Storage configuration for Coupon images
const storageCoupon = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/couponImg"); // ✅ Make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter: allow only images
const fileFilterCoupon = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

// Export multer instance
export const uploadCouponImage = multer({
  storage: storageCoupon,
  fileFilter: fileFilterCoupon,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});



// Storage configuration for product images
const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/productImg"); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename using timestamp
  },
});

// File filter: allow only images (jpeg, jpg, png, gif)
const fileFilterProduct = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

// Multer instance for product image uploads
export const uploadProductImage = multer({
  storage: storageProduct,
  fileFilter: fileFilterProduct,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});



// Storage configuration for notification files
const storageNotification = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/notificationFiles"); // Ensure this folder exists in your project root
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename using timestamp + original extension
  },
});

// File filter - allow images and docs (pdf, docx, png, jpg, jpeg, gif)
const fileFilterNotification = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image and document files are allowed!"));
  }
};

// Multer instance for notification uploads
export const uploadNotificationFile = multer({
  storage: storageNotification,
  fileFilter: fileFilterNotification,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max size
});