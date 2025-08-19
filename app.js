const express = require('express');
const multer=require('multer');
const path=require('path');
const { connectAndSync, User, sequelize,initAmenities,Business ,Amenity,BusinessAmenity, MenuSection, MenuItem,Contact,Review,ContactBusinessMessage,Bookmark} = require('./db2');
var cors = require('cors')
var app = express()
const bcrypt = require('bcrypt'); // make sure this is at the top of your file
 
app.use(cors())
const port = process.env.PORT || 3000; // fallback for local testing
const { Op, where } = require('sequelize');
const { error } = require('console');
const { match } = require('assert');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(express.json());

// ✅ Required for parsing form-data (excluding files)
app.use(express.urlencoded({ extended: true }));


// const { connection, cone } = require('./db');

// Route
connectAndSync()
initAmenities();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if(file.fieldname==='Logo'){
    cb(null, 'uploads/business/logo'); 
    }else if(file.fieldname==='gallery'){
      cb(null, 'uploads/business/gallery');
    }else{
      cb(null, 'uploads/user/ProfilePhoto');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});


// Filter file types (optional)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});


app.post('/adduser', async (req, res) => {
  try {
    const { username, email, contact_number, whatsapp_number, password, first_name, last_name, website } = req.body;

    // Check if email already exists
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists. Please use a different email." });
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists. Please choose a different username." });
    }

    // Check if contact number already exists
    const contactExists = await User.findOne({ where: { contact_number } });
    if (contactExists) {
      return res.status(400).json({ message: "Contact number already exists. Please use a different phone number." });
    }

    const whatsappExists = await User.findOne({ where: { whatsapp_number } });
    if (whatsappExists) {
      return res.status(400).json({ message: "WhatsApp number already exists. Please use a different phone number." });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user with hashed password
    const user = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      contact_number,
      whatsapp_number,
      website,
      first_name,
      last_name
    });

    res.json({ message: 'User registered successfully!', user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { identifier, password } = req.body; 
  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });

    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
if (!isMatch) return res.status(401).json({ message: 'Invalid password' });


    console.log('✅ Login successful');
    res.json({ message: 'Login successful', user: { id: user.id, username: user.username } });
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
});
app.put('/changePassword',async (req,res)=>{
  const {oldPassword,newPassword,userid}=req.body
  try{
    const user=await User.findByPk(userid)
    if(!user){return res.status(404).json({message:"User not found"})}
    if(user){
      const match=await bcrypt.compare(oldPassword,user.password_hash)
      if(!match){ return res.status(400).json({message:"Password didn't match"})}
    }
    const password_hash=await bcrypt.hash(newPassword,10)
    await user.update({password_hash})
    res.json({message:"Password updated successfully"})
  }catch(error){
    return res.status(500).json({message: "Internal server error"})
  }
})

app.get('/getProfile',async(req,res)=>{
  const {Userid}=req.query
  try{
    const result=await User.findByPk(Userid,{attributes:{exclude:['password_hash']}})
    const baseUrl=`${req.protocol}://${req.get('host')}`
    const newprofile_photo= result.profile_photo ? `${baseUrl}${result.profile_photo}`:null;
     
    res.json({...result.dataValues,profile_photo:newprofile_photo})
  }catch(err){
    return res.status(500).json({message:"Internal server error"})
  }
})
app.put('/updateProfile', upload.fields([{ name: 'profile_photo', maxCount: 1 }]), async (req, res) => {
  try {
    const data = req.body;
    const profile_photo = req.files['profile_photo']?.[0];

    const user = await User.findByPk(data.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowedFields = [
      'first_name','last_name','username','email','contact_number','address','website',
      'birthday','marital_status','gender','profile_photo',
      'facebook','twitter','pinterest','google','linkedin','instagram','about'
    ];

    const updatedData = {};
    allowedFields.forEach(f => {
  if (data[f] !== undefined) {
    updatedData[f] = data[f] === '' ? null : data[f];
  }
});

    if (updatedData.birthday) {
  const date = new Date(updatedData.birthday);
  updatedData.birthday = isNaN(date.getTime()) ? null : date;
}


    if (profile_photo) updatedData.profile_photo = `/uploads/user/ProfilePhoto/${profile_photo.filename}`;

    await user.update(updatedData);

    res.json({ message: "Profile updated successfully", updatedData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

app.post('/submitBusiness',
upload.fields([
    { name: 'Logo', maxCount: 1 },
    { name: 'gallery', maxCount: 20 }
  ]),
  async (req, res) => {
    try {
      const { username, amenities, menuSection } = req.body;
      const Logo = req.files['Logo']?.[0];
      const Gallery = req.files['gallery'] || [];
      console.log(amenities)
      // Find the user
      const findUser = await User.findOne({ where: { username } });
      if (!findUser) {
        return res.status(400).json({ message: "User not found" });
      }

      // Always create a new business
      const newBusiness = await Business.create({
        ...req.body,
        user_id: findUser.id,
        Logo: Logo ? `/uploads/business/logo/${Logo.filename}` : null,
        gallery: JSON.stringify(
          Gallery.map(file => `/uploads/business/gallery/${file.filename}`)
        )
      });

      // Add menu sections
      if (Array.isArray(menuSection)) {
        for (let section of menuSection) {
          const newSection = await MenuSection.create({
            section_title: section.sectionTitle,
            business_id: newBusiness.id
          });

          if (Array.isArray(section.items)) {
            for (let item of section.items) {
              await MenuItem.create({
                title: item.title,
                price: item.price,
                description: item.description,
                section_id: newSection.id
              });
            }
          }
        }
      }

      // Add amenities
      if (amenities && typeof amenities === 'object') {
        for (const [key, value] of Object.entries(amenities)) {
          if (value) {
            const amenity = await Amenity.findOne({ where: { name: key } });
            if (amenity) {
              await newBusiness.addAmenity(amenity);
            }
          }
        }
      }

      res.json({
        message: "Business submitted successfully",
        business: newBusiness
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);


app.get('/businessSearch', async (req, res) => {
  const { searchText, location, category } = req.query;
  try {
    const where = {};

    if (searchText) {
      where[Op.or] = [
        { business_name: { [Op.like]: `%${searchText}%` } },
        { tagline: { [Op.like]: `%${searchText}%` } },
        { description: { [Op.like]: `%${searchText}%` } },
        { tags: { [Op.like]: `%${searchText}%` } },
      ];
    }

    if (location) {
  where.region = { [Op.like]: `%${location}%` };
}
if (category) {
  where.category = { [Op.like]: `%${category}%` };
}


    const data = await Business.findAll({ where });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//post for contact
app.post('/contactform',async (req,res)=>{
  try{
    const contact=await Contact.create(req.body)
    res.json({message:"You message submitted successfully",contact})
  }catch(err){
    res.status(500).json({message:err.message})
  }
})

app.get('/Allbusiness', async (req, res) => {
  try {
    const newbusiness=[]
    const businesses = await Business.findAll();
    for(const business of businesses){
      const businessid=business.id
      const anemitiesOfbusiness=await BusinessAmenity.findAll({
        where :{business_id:businessid}
      })
      const anemitiesnames=[]
      for(const item of anemitiesOfbusiness){
        const anemities=await Amenity.findByPk(item.amenity_id)
        anemitiesnames.push(anemities.name)
      }

      const baseUrl=`${req.protocol}://${req.get('host')}`
      const newlogo= business.Logo ? `${baseUrl}${business.Logo}`:null;
      let gallerynew=[]
      if(business.gallery){
        let parsedbusiness=business.gallery
        if(typeof parsedbusiness === 'string'){
          parsedbusiness=(JSON.parse(parsedbusiness))
        }
        if(typeof parsedbusiness === 'string'){
          parsedbusiness=(JSON.parse(parsedbusiness))
        }
        gallerynew=parsedbusiness.map((img)=>`${baseUrl}${img}`)
      }
      
      const reviews=await Review.findAll({where:{business_id:businessid}});
      let review=[]
      reviews.map((item)=>
        review.push({name:item.name,email:item.email,rating:item.rating,comment:item.comment,date:item.created_at})
      )
      let rating=0
      reviews.map((item)=>rating+=item.rating)
      const finalRating = Number((rating / reviews.length).toFixed(1));
      //console.log(finalRating)

      newbusiness.push({...business.toJSON(),anemities:anemitiesnames,Logo:newlogo,gallery:gallerynew,review,rating:finalRating})
    }
    res.json(newbusiness);
   }catch (error) {
    console.error("❌ Error fetching businesses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//get data
// app.js or routes/business.js
app.get('/business', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    const newbusiness=[]
    const businesses = await Business.findAll({ where: { category } });
    for(const business of businesses){
      const businessid=business.id
      const anemitiesOfbusiness=await BusinessAmenity.findAll({
        where :{business_id:businessid}
      })
      const anemitiesnames=[]
      for(const item of anemitiesOfbusiness){
        const anemities=await Amenity.findByPk(item.amenity_id)
        anemitiesnames.push(anemities.name)
      }

      const baseUrl=`${req.protocol}://${req.get('host')}`
      const newlogo= business.Logo ? `${baseUrl}${business.Logo}`:null;
      let gallerynew=[]
      if(business.gallery){
        let parsedbusiness=business.gallery
        if(typeof parsedbusiness === 'string'){
          parsedbusiness=(JSON.parse(parsedbusiness))
        }
        if(typeof parsedbusiness === 'string'){
          parsedbusiness=(JSON.parse(parsedbusiness))
        }
        gallerynew=parsedbusiness.map((img)=>`${baseUrl}${img}`)
      }
      
      const reviews=await Review.findAll({where:{business_id:businessid}});
      let review=[]
      reviews.map((item)=>
        review.push({name:item.name,email:item.email,rating:item.rating,comment:item.comment,date:item.created_at})
      )
      let rating=0
      reviews.map((item)=>rating+=item.rating)
      const finalRating = Number((rating / reviews.length).toFixed(1));
      //console.log(finalRating)

      newbusiness.push({...business.toJSON(),anemities:anemitiesnames,Logo:newlogo,gallery:gallerynew,review,rating:finalRating})
    }
    res.json(newbusiness);
   }catch (error) {
    console.error("❌ Error fetching businesses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/businessno',async(req,res)=>{
  try{
    const {category}=req.query
    const businesslength= (await Business.findAll({ where: { category } })).length;
    res.json(businesslength)
  }catch(error){
    res.status(500).json({message:"Server error"})
  }
})


app.post('/review',async(req,res)=>{
  const {name,email}=req.body;
  try{
    const sample=await Review.findOne({where :{email}})
    if(sample)
    {
      return res.status(400).json({message:"Review already submitted by this email."})
    }
    const reviewData=await Review.create(req.body)
    res.json(reviewData)
  }catch(err){
    res.status(500).json({message:err.message})
  }
})
app.post('/contactBusiness',async(req,res)=>{
  try{
    const contactBusinessData=await ContactBusinessMessage.create(req.body);
    res.json(contactBusinessData)
  }catch(error){
    res.status(500).json({message:error.message})
  }
})
app.post('/bookmark',async(req,res)=>{
  try{
    const alredayMarked=await Bookmark.findOne({where:req.body})
  if(alredayMarked){
    console.log(alredayMarked)
    console.log(alredayMarked.dataValues.id)
    await Bookmark.destroy({where :{id:alredayMarked.dataValues.id}})
    return res.json({message:"unmarked"})
  }
    const bookmarkData=await Bookmark.create(req.body);
    res.json({message:"marked"})
  }catch(error){
    res.status(500).json({message:error.message})
  }
})
app.get('/getBookmark',async(req,res)=>{
  const {bid,uid}=req.query

  try{
    const markedData=await Bookmark.findOne({where:{business_id:bid,user_id:uid}})
    if(markedData)
    {
      return res.json({message:"marked"})
    }
    else{
      return res.json({message:"unmarked"})
    }
  }catch(error){
    res.status(500).json({message:error.message})
  }
})
app.get('/getUserBookmark',async(req,res)=>{
  const {userId}=req.query;
  try{
    const markedData=await Bookmark.findAll({where:{user_id:userId}})
    let businesses=[]
    for(let i=0;i<markedData.length;++i){
      const data=await Business.findOne({where:{id:markedData[i].business_id}})
      businesses.push(data)
    }
    let newbusiness=[]
    for(const business of businesses){
      const businessid=business.id
      const anemitiesOfbusiness=await BusinessAmenity.findAll({
        where :{business_id:businessid}
      })
      const anemitiesnames=[]
      for(const item of anemitiesOfbusiness){
        const anemities=await Amenity.findByPk(item.amenity_id)
        anemitiesnames.push(anemities.name)
      }

      const baseUrl=`${req.protocol}://${req.get('host')}`
      const newlogo= business.Logo ? `${baseUrl}${business.Logo}`:null;
      let gallerynew=[]
      if(business.gallery){
        let parsedbusiness=business.gallery
        if(typeof parsedbusiness === 'string'){
          parsedbusiness=(JSON.parse(parsedbusiness))
        }
        if(typeof parsedbusiness === 'string'){
          parsedbusiness=(JSON.parse(parsedbusiness))
        }
        gallerynew=parsedbusiness.map((img)=>`${baseUrl}${img}`)
      }
      
      const reviews=await Review.findAll({where:{business_id:businessid}});
      let review=[]
      reviews.map((item)=>
        review.push({name:item.name,email:item.email,rating:item.rating,comment:item.comment,date:item.created_at})
      )
      let rating=0
      reviews.map((item)=>rating+=item.rating)
      const finalRating = Number((rating / reviews.length).toFixed(1));
      //console.log(finalRating)

      newbusiness.push({...business.toJSON(),anemities:anemitiesnames,Logo:newlogo,gallery:gallerynew,review,rating:finalRating})
    }
    res.json(newbusiness)
  }catch(error){
    res.status(500).json({message:error.message})
  }
})
app.get('/getUserListing',async(req,res)=>{
  const {user_id}=req.query;
  const newbusiness=[]
  try{
    const businesses=await Business.findAll({where:{user_id}})
    for(const businessItem of businesses){
      const businessId=businessItem.id
      const businessAmenities=await BusinessAmenity.findAll({where : {business_id:businessId}})

      const listamenity=[]
    for(const item of businessAmenities){
      const amenitieslist=await Amenity.findByPk(item.amenity_id)
      listamenity.push(amenitieslist)
    }
    

    const businesSections= await MenuSection.findAll({where:{business_id:businessId}})
    const newSections=[]
    for(const section of businesSections){
      const sectionItems=await MenuItem.findAll({where:{section_id:section.id},attributes:['title','price','description']})
    newSections.push({section_title:section.section_title,Items:sectionItems})
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`; // e.g., http://localhost:5000

const logoUrl = businessItem.Logo ? `${baseUrl}${businessItem.Logo}` : null;
let galleryUrls = [];
if (businessItem.gallery) {
  try {
    let parsedGallery = businessItem.gallery;

    // First parse if it's a string
    if (typeof parsedGallery === "string") {
      parsedGallery = JSON.parse(parsedGallery);

      // If after parsing, it's still a string, parse again
      if (typeof parsedGallery === "string") {
        parsedGallery = JSON.parse(parsedGallery);
      }
    }

    if (Array.isArray(parsedGallery)) {
      galleryUrls = parsedGallery.map(img => `${baseUrl}${img}`);
    }
  } catch (err) {
    console.error("Error parsing gallery JSON:", err);
  }
}
newbusiness.push({
  ...businessItem.toJSON(),
  Logo: logoUrl,
  gallery: galleryUrls,
  amenities: listamenity,
  section: newSections
});

    }
    res.json(newbusiness)
  }catch(error){
    res.status(500).json({message:error.message})
  }
})
//get data by id
app.get('/users/:id',async(req,res)=>{
  try{
    const user= await User.findByPk(req.params.id);
    if(user) res.json(user)
    else res.status(404).json({message:'user not found'})
  }catch(error){
    res.status(500).json({message :error.message})
  }
})

//update data by id
app.put('/users/:id',async(req,res)=>{
  try{
    const user=await User.findByPk(req.params.id);
    if(!user) res.status(404).json({message:'user not found'})
    else{
      await user.update(req.body)
      res.json(user)
    }
  }catch(error){
    res.status(500).json({message:error.message})
  }
})

//delete data by id
app.delete('/users/:id',async(req,res)=>{
  try{
    const user=await User.findByPk(req.params.id);
    if(!user) res.status(404).json({message:'user not found'})
    else{
      await user.destroy();
      res.json({message:'user deleted'})
    }
  }catch(error){
    res.status(500).json({message:error.message})
  }
})


// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});