const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
const axios = require('axios');
const { resolveAny } = require("dns");
const morgans=require('morgan')
app.use(morgans('tiny'))
//const multer = require('multer');
const fs = require('fs');
const cors=require('cors')
require('dotenv').config();
const productStandard = require('./standard.js');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json()); 
app.use(cors()) 
let EanNum = "Fetching EAN";
let receivedDistance = "Wait";
let message="Your Data Will appear here.." //initial message visible in frontend
//const userpref=require('./standard.js')
//let router=express.Router()
//const storage = multer.memoryStorage();
//const upload = multer({ storage });
//------------compare user preference,standards and recieved from product scan----------------/
function compareWithStandards(productObj, standards, userPrefs = {}) {
  const result = {
    title: productObj.title,
    status: "active",
    alerts: [],
  };

  const nutrition = productObj.nutrition || {};
  const ingredientsList = (productObj.ingredients?.list || []).map(i => i.toLowerCase());

  // --- Check Nutrition
  for (const [key, value] of Object.entries(nutrition)) {
    const std = standards[key];
    const userLimit = userPrefs[key];
    if (!value || value.value === null) continue;

    const nutrientValue = value.value;

    // --- Standard Rules
    if (std) {
      if (std.alertIfAbovePer100 && nutrientValue > std.alertIfAbovePer100) {
        result.alerts.push({
          type: "nutrition",
          nutrient: key,
          value: nutrientValue + " " + std.unit,
          desc: `${key} is high (${nutrientValue}${std.unit}), exceeds standard limit`,
          flag: "not safe",
        });
      }

      if (std.flagIfPresent && nutrientValue > 0) {
        result.alerts.push({
          type: "nutrition",
          nutrient: key,
          value: nutrientValue + " " + std.unit,
          desc: `${key} is present, flagged by standard rules`,
          flag: "not safe",
        });
      }
    }

    // --- User-Specific Limits
    if (userLimit !== undefined && nutrientValue > userLimit) {
      result.alerts.push({
        type: "nutrition",
        nutrient: key,
        value: nutrientValue,
        desc: `${key} exceeds your personal limit (${userLimit})`,
        flag: "not safe",
      });
    }
  }

  // --- Check Allergens (User + Standard)
  const allAllergens = [...(standards.allergens || []), ...(userPrefs.allergens || [])];
  for (const allergen of allAllergens) {
    if (ingredientsList.some(i => i.includes(allergen.toLowerCase()))) {
      result.alerts.push({
        type: "ingredient",
        ingredient: allergen,
        desc: `Contains allergen: ${allergen}`,
        flag: "not safe",
      });
    }
  }

  // --- Check IngredientsToFlag (standard)
  for (const item of standards.ingredientsToFlag || []) {
    if (ingredientsList.some(i => i.includes(item.toLowerCase()))) {
      result.alerts.push({
        type: "ingredient",
        ingredient: item,
        desc: `Contains flagged ingredient: ${item}`,
        flag: "not safe",
      });
    }
  }

  // --- Dangerous Ingredients (standard)
  for (const danger of standards.dangerousIngredients || []) {
    if (ingredientsList.some(i => i.includes(danger.name.toLowerCase()))) {
      result.alerts.push({
        type: "ingredient",
        ingredient: danger.name,
        desc: `Contains ${danger.name}  ${danger.risk}`,
        flaggedBy: danger.flaggedBy,
        flag: "not safe",
      });
    }
  }

  if (result.alerts.length === 0) {
    result.alerts.push({
      desc: "✅ All clear. Product matches both your preferences and global standards.",
      flag: "safe",
    });
  }

  return result;
}
//------------Processing barcode look response to get ingredients and nutrion values of product----------------//

function processProductData(response) {
  const product = response.products?.[0];
  if (!product) return null;

  const title = product.title || "";
  const size = product.size || "";
  const imageUrl = product.images?.[0] || "";

  // Nutrient keywords and mapping
  const nutritionMap = {
    energyKcal: /energy\s*([\d.]+)\s*kcal/i,
    protein: /protein\s*([\d.]+)/i,
    carbohydrates: /carbohydrates\s*([\d.]+)/i,
    totalSugar: /sugars\s*([\d.]+)/i,
    addedSugar: /added sugar[s]*\s*([\d.]+)/i,
    totalFat: /fat\s*([\d.]+)/i,
    saturatedFat: /saturated\s*fat\s*([\d.]+)/i,
    cholesterol: /cholesterol\s*([\d.]+)/i,
    sodium: /salt|sodium\s*([\d.]+)/i,
    dietaryFiber: /fiber\s*([\d.]+)/i,
    caffeine: /caffeine\s*([\d.]+)/i
  };

  const nutritionText = product.nutrition_facts || "";
  const nutrition = {};

  for (const [key, regex] of Object.entries(nutritionMap)) {
    const match = nutritionText.match(regex);
    if (match) {
      nutrition[key] = {
        value: parseFloat(match[1]),
        unit: key === "energyKcal" ? "kcal" : "g"
      };
    } else {
      nutrition[key] = null;
    }
  }

  // Ingredients list
  const ingredientsRaw = product.ingredients || "";
  const ingredientsList = ingredientsRaw
    .split(/,|\n|;/)
    .map(item => item.trim())
    .filter(Boolean);

  return {
    title,
    size,
    imageUrl,
    nutrition,
    ingredients: {
      list: ingredientsList
    }
  };
}
//------------Processing barcode look response to get ingredients and nutrion values of product----------------//

const keys=[process.env.harshit_key,process.env.vivek_key,process.env.Deepak_key,process.env.as_key]
const barcodelookup=async(num)=>{
           const randomkey = Math.floor(Math.random() * 4);
           const keyz=keys[randomkey]
           let taker="https://api.barcodelookup.com/v3/products?barcode="+`${num}`+"&formatted=y&key="+keyz;
           responser =await axios.get(taker) 
           //console.log(taker)
           //console.log(responser.data)
           k=processProductData(responser.data)      
           return k
  }
  


//-----------------------------------------------------------------------------------------------------------//

const { getFirestore, collection, doc,query, where, getDocs ,getDoc} = require("firebase/firestore");
const { db } = require("./firebase");


let uid=""
//------------Wifiverification middleware for esp32cam----------------//

const wifiverify = async function (req, res, next) {
  const wifiid = req.query.wifiid;
  console.log(wifiid)
  if (!wifiid) {
    message="wifiid is required!"
    return res.status(400).json({ message: "wifiid is required!" });
  }

  try {
    const usersRef = collection(db, "wifiPasswords");
    console.log(usersRef)
    const q = query(usersRef, where("wifiPassword", "==", wifiid));
    console.log(q)
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      message="User with given wifiid not found!"
      return res.status(404).json({ message: "User with given wifiid not found!" });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    uid = userData.userId;  // This is the UID of the user
    console.log("my uid"+uid)
    //console.log("my doc"+userData)
    // Attach UID and user data to request for next route

    next();

  } catch (err) {
    console.error("Firestore error:", err);
    message="Internal server error"

    return res.status(500).json({ message: "Internal server error" });
  }
};


//------------open testing frontend route not meant to be accessed----------------//

app.get('/',async(req,res)=>{
    
    //await axios.get("https://barcodedecoder.onrender.com")
    
    res.render("index", { EanNum,message});

})
//------------open api checking route not meant to be accessed----------------//  
//--------------------checking--------------//
app.get('/faker',async(req,res)=>{
  //z=await barcodelookup('8901595961443')
  //m=compareWithStandards(z,productStandard, userpref)

  //console.log(m)

  //res.status(200).json({ received: z})

})

//------------This route is accessed by barcode reader fast api(created for barcode decoding) just to show a set a message when this route is triggered----------------//

app.post('/fastapires', (req, res) => {
  if (req.body.message){
    console.log(req.body.message)
    message = req.body.message;

  }
  else{
    message="The barcode reader is facing issue.."
  }
  console.log('FastAPI says:', message);
  res.status(200).json({ received: message });
});

//------------Main route accessed by esp32cam----------------//
let final_Decision=""
app.get('/nutri', wifiverify, async (req, res) => {
  const ean = req.query.ean;
  //const wifiid = req.query.wifiid;
  console.log(ean)
  console.log(uid)

  
  try {
    
   
    const userDocRef = doc(db, "neutriData", uid); // xyz = your scan/data collection
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      message= "No data found for this user"
      return res.status(404).json({ message: "No data found for this user" });
    }

    const data = userDocSnap.data();
    console.log(data)
    z=await barcodelookup(`${ean}`)
    final_Decision=compareWithStandards(z,productStandard,data)
    message="done"
    console.log(final_Decision)
    res.json({
      message: "User data fetched successfully",
      esp:final_Decision
    });
    

  } catch (err) {
    console.error("Error fetching user data from xyz:", err);
    res.status(500).json({ message: "Server error" });
  } 



});

//------------Route accessed by react Frontened----------------//

//------------for live data display---------------------------//
app.get("/nutro",async(req,res)=>{
  if (final_Decision!=""){
    res.json({ final_Decision:final_Decision})
    message=""

  }
  else{

    res.json({none:"flushed data empty"})

  }


})

//------------for message display during diff processing----------------//
app.get("/message", async(req, res) => {
    if (message!=""){
      console.log(message)
      res.json({ message:message})
      
    }
    else{
      message="default"
      res.json({ message:message})

    }
    //setTimeout(()=>{message="Your Data Will appear here.."},10000)

   
    //message="Your Data Will appear here.."
  /*
    if (!EanNum || EanNum === "Fetching EAN") {
        EanNum = "Waiting for upload";
    }
    if(mypath==="/barz.jpg" ){
      res.json({ status:"Data Received",EanNum:EanNum, mypath:mypath})
      
    }
    else{
      res.json({ status:"Data Received",EanNum: EanNum, mypath:mypath})

    }*/
    
    
    
    
    //console.log(Received from ESP: ${receivedMessage}, Distance: ${receivedDistance});
    //finalz:function taker(){if(result=="nothing"){return result}else{return result.products[0]}}
    
    //res.json({ status:"Data Received",EanNum:EanNum, image:mypath})

});



app.listen(500,()=>{
    console.log("server is running!!")
})
