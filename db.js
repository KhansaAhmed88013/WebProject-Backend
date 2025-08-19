// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',      // or 127.0.0.1
  user: 'root',           // your MySQL username
  password: '',           // your MySQL password
  database: 'drectory'  // your database name
});

// Connect to the database
function cone() {
  connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    return;
  }

  console.log('Connected to MySQL database!');
});
 const createUserTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
    
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    contact_number VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20),
    website VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )

  `;

  const createBusinessesTable = `
    CREATE TABLE IF NOT EXISTS businesses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      username VARCHAR(100),
      email VARCHAR(255),
      business_name VARCHAR(255) NOT NULL,
      tagline VARCHAR(255),
      region VARCHAR(100),
      category VARCHAR(100),
      price_range VARCHAR(50),
      price_from VARCHAR(50),
      price_to VARCHAR(50),
      location VARCHAR(255),
      website VARCHAR(255),
      phone VARCHAR(50),
      inquiry_email VARCHAR(255),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  const createAmenitiesTable=`
      CREATE TABLE IF NOT EXISTS amenities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);
  `;

  const createBusinessAmenities=`
      CREATE TABLE IF NOT EXISTS business_amenities (
  business_id INT,
  amenity_id INT,
  PRIMARY KEY (business_id, amenity_id),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
)`;

  const createMenuSectionsTable = `
    CREATE TABLE IF NOT EXISTS business_menu_sections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT NOT NULL,
      section_title VARCHAR(255),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `;

  const createMenuItemsTable = `
    CREATE TABLE IF NOT EXISTS business_menu_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      section_id INT NOT NULL,
      title VARCHAR(255),
      price VARCHAR(50),
      description TEXT,
      FOREIGN KEY (section_id) REFERENCES business_menu_sections(id) ON DELETE CASCADE
    )
  `;

  const createContactTable=`
    CREATE TABLE IF NOT EXISTS contact(
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      number VARCHAR(20) NOT NULL,
      business_name VARCHAR(255) ,
      message VARCHAR(500) NOT NULL
    )
  `;
  connection.query(createUserTableQuery, (err, result) => {
    if (err) throw err;
    console.log('Table created successfully!');
  });

      connection.query(createBusinessesTable, (err, result) => {
    if (err) throw err;
    console.log('Table created successfully!');
      });

    connection.query(createMenuSectionsTable, (err, result) => {
    if (err) throw err;
    console.log('Table created successfully!');
    });

    connection.query(createMenuItemsTable, (err, result) => {
    if (err) throw err;
    console.log('Table created successfully!');
    });

    connection.query(createContactTable,(err,result)=>{
      if(err) throw err;
      console.log('Table created successfully!');
    });
    connection.query(createAmenitiesTable,(err,result)=>{
      if(err) throw err;
      console.log('Table created successfully!');
    });
    connection.query(createBusinessAmenities,(err,result)=>{
      if(err) throw err;
      console.log('Table created successfully!');
    });
  
  
}
module.exports = { connection, cone };