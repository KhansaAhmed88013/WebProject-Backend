// sequelize.js
const { Sequelize, DataTypes } = require('sequelize');

// 1. Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'drectory',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);


// 2. Define models
const User = sequelize.define(
  "User",
  {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },

    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,

    contact_number: { type: DataTypes.STRING, allowNull: false },
    address: DataTypes.STRING,

    website: DataTypes.STRING,
    birthday: DataTypes.DATEONLY,

    marital_status: {
      type: DataTypes.ENUM(
        "Single",
        "Married",
        "Engaged",
        "Separated",
        "Divorced",
        "Widow",
        "Widower"
      ),
    },

    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
    },

    profile_photo: DataTypes.STRING, // store file path or URL

    facebook: DataTypes.STRING,
    twitter: DataTypes.STRING,
    pinterest: DataTypes.STRING,
    google: DataTypes.STRING,
    linkedin: DataTypes.STRING,
    instagram: DataTypes.STRING,

    about: DataTypes.TEXT,
  },
  {
 timestamps: true,   
 tableName: "users",         // ✅ enable automatic timestamps
    createdAt: "created_at",    // ✅ map createdAt to created_at
    updatedAt: "updated_at",    // ✅ map updatedAt to updated_at
}
);

// Businesses Table
const Business = sequelize.define('Business', {
  user_id: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: { model: 'users', key: 'id' }, // match User table name
  onDelete: 'CASCADE'
}
,

  username: DataTypes.STRING,
  email: DataTypes.STRING,

  business_name: { type: DataTypes.STRING, allowNull: false },
  tagline: DataTypes.STRING,

  region: DataTypes.STRING,
  category: DataTypes.STRING,

  price_range: DataTypes.STRING,
  price_from: DataTypes.STRING,
  price_to: DataTypes.STRING,

  location: DataTypes.STRING,
  website: DataTypes.STRING,
  phone: DataTypes.STRING,
  inquiry_email: DataTypes.STRING,

  description: DataTypes.TEXT,
  aboutBusiness: DataTypes.TEXT,

  // hours of operation as JSON
  hours: {
    type: DataTypes.JSON,
    defaultValue: {}
  },

  // image and media links
  Logo: DataTypes.STRING,
  gallery: {
    type: DataTypes.JSON, // multiple images paths
    defaultValue: []
  },
  video: DataTypes.STRING,

  // social media
  facebook: DataTypes.STRING,
  instagram: DataTypes.STRING,
  linkedin: DataTypes.STRING,
  youtube: DataTypes.STRING,

  // miscellaneous
  offer: DataTypes.STRING,
  relation_with_business: DataTypes.STRING,
  remote_Position: DataTypes.BOOLEAN,
  establishment_year: DataTypes.DATEONLY,
  no_of_employes: DataTypes.STRING,
  tags: DataTypes.STRING,
  company_owner: DataTypes.STRING,
  scheduled_date: DataTypes.DATEONLY,

}, {
   tableName: "businesses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});

// FK relationship
Business.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

// Amenities Table
const Amenity = sequelize.define('Amenity', {
  name: { type: DataTypes.STRING, allowNull: false }
}, {
  timestamps: false
});


// Business_Amenities (Join Table)
const BusinessAmenity = sequelize.define('BusinessAmenity', {}, { timestamps: false });
Business.belongsToMany(Amenity, { through: BusinessAmenity, foreignKey: 'business_id' });
Amenity.belongsToMany(Business, { through: BusinessAmenity, foreignKey: 'amenity_id' });

// Menu Sections
const MenuSection = sequelize.define('BusinessMenuSection', {
  section_title: DataTypes.STRING
});
MenuSection.belongsTo(Business, { foreignKey: 'business_id', onDelete: 'CASCADE' });

// Menu Items
const MenuItem = sequelize.define('BusinessMenuItem', {
  title: DataTypes.STRING,
  price: DataTypes.STRING,
  description: DataTypes.TEXT
});
MenuItem.belongsTo(MenuSection, { foreignKey: 'section_id', onDelete: 'CASCADE' });

// Contact Table
const Contact = sequelize.define('Contact', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  number: { type: DataTypes.STRING, allowNull: false },
  business_name: DataTypes.STRING,
  message: { type: DataTypes.STRING(500), allowNull: false }
}, {
  tableName: 'contact', // 👈 exact table name in the DB
  timestamps: false     // (optional) to skip createdAt/updatedAt
});

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  business_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'reviews',
  timestamps: false // or true if you want createdAt/updatedAt
});

// Make Review belong to Business
Review.belongsTo(Business, { foreignKey: 'business_id', onDelete: 'CASCADE' });

// Make Business have many Reviews
Business.hasMany(Review, { foreignKey: 'business_id', onDelete: 'CASCADE' });

const ContactBusinessMessage = sequelize.define("ContactBusinessMessage", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  business_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Businesses',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  Contact_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  Message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'Contact_Business_Message',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});
ContactBusinessMessage.belongsTo(Business, { foreignKey: 'business_id', onDelete: 'CASCADE' });
Business.hasMany(ContactBusinessMessage, { foreignKey: 'business_id' });

const Bookmark = sequelize.define('Bookmark', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  business_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Business,
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'bookmarks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});
User.belongsToMany(Business, {
  through: Bookmark,
  foreignKey: 'user_id',
  as: 'BookmarkedBusinesses'
});

Business.belongsToMany(User, {
  through: Bookmark,
  foreignKey: 'business_id',
  as: 'UsersWhoBookmarked'
});


// 3. Connect and Sync Tables
async function connectAndSync() {
  try {
    await sequelize.authenticate();
    await sequelize.sync()
    console.log('✅ All tables synced!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}
// List of amenities to insert
const amenities = [
  'Parking',
  'Reservations',
  'Smoking Allowed',
  'Wheelchair Accessible',
  'Wireless Internet',
  'ATM Nearby',
  'Elevator',
  'Near Markets',
  'Near Hospital',
  'Public Transport Available',
  'Near Mosque',
  'Breakfast',
  'Accepts Credit Cards',
  'Discount Coupons',
  'Outdoor Seating',
];

async function initAmenities() {
  try {
    // Insert amenities if not already present
    for (const name of amenities) {
      await Amenity.findOrCreate({ where: { name } });
    }

    console.log('✅ Amenities initialized.');
  } catch (error) {
    console.error('❌ Error initializing amenities:', error);
  }
}



// 4. Export
module.exports = {
  initAmenities,
  sequelize,
  connectAndSync,
  User,
  Business,
  Amenity,
  BusinessAmenity,
  MenuSection,
  MenuItem,
  Contact,
  Review,
  ContactBusinessMessage,
  Bookmark
};
