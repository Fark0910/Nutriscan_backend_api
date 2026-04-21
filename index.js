const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
const axios = require('axios');
const { resolveAny } = require("dns");
const morgans=require('morgan')
const gem=require('./gemai.js')
app.use(morgans('tiny'))
//const multer = require('multer');
const fs = require('fs');
const cors=require('cors')
require('dotenv').config();
const parsing=require('./parser.js')
const productStandard = require('./standard.js');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json()); 
app.use(cors()) 
let EanNum = "Fetching EAN";
let receivedDistance = "Wait";
let message="Your Data Will appear here.." //initial message visible in frontend
const userpref=require('./standard.js')
//let router=express.Router()
//const storage = multer.memoryStorage();
//const upload = multer({ storage });
//------------compare user preference,standards and recieved from product scan----------------/
//New Improved version
async function compareWithStandards(productObj, standards, userPrefs = {}) {
  //console.log("Comparing product:", productObj.title);
  const prompt = `You are a Health Food Minister AI, an expert in food safety and nutrition regulation.  
Your task is to evaluate a product based on three inputs:  
- product information:-${JSON.stringify(productObj)} → contains product name(title), nutrition facts, and ingredients.  
- product standards:-${JSON.stringify(standards)} → contains global/FSSAI-style daily limits, allergens, and harmful substances list.  
- user preferences:-${JSON.stringify(userPrefs)} → contains the users health preferences (like sugar limits, allergens to avoid, etc.).  

Compare the nutritional values, ingredients, and known risks of the product information with both user preferences and product standards.

In your evaluation:
- If the product is safe, mention that it meets user and product standards.
- If the product exceeds limits (like sugar, fat, sodium, caffeine, etc.), mention what exceeds and why.
- If any user allergens or flagged ingredients are present, mention them clearly.
- If the product contains any potentially harmful chemical (even if not listed in productStandards), use your knowledge to identify and flag it (e.g., artificial colorants, preservatives, trans fat, etc.).
- If user preferences are missing and empty, rely solely on product standards for evaluation, and use general health guidelines beyond standards if needed.
Your tone: professional, health-conscious, and factual — like an FSSAI or WHO nutrition report.Dont hallucinate and generate wrong output and consider whats given

Output Format (Strictly JSON, nothing else):
{
  "title": "<product title take it from product information if its not present then write "No Barcode image">",
  "status": "active",
  "alerts": [
    {
      "desc": "<clear and short explanation — e.g., ✅ All clear. Product matches both your preferences and global standards. OR ⚠️ Contains high sugar and allergen: nuts.>",
      "flag": "<safe | unsafe>"
    }
  ]
}`;
  try{
    const aiResp = await gem(prompt);
    const its=await parsing(aiResp)
    //console.log(prompt)
    return its;
} catch(error){
  return error
}

  

  /*
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
*/
 
}
//------------Processing barcode look response to get ingredients and nutrion values of product----------------//

async function processProductData(response,num) {
  if(!response.products){
    const findfromEan=`Search the product with EAN ${num} from OpenFoodFacts, BarcodeLookup and similar public databases or googleto identify its name, common ingredients, and nutritional information as of 2025.Only output json object
    {"title":"<product name from ean search>",
    "size":"<typical size if available>",
    "imageUrl":"<product image url if available>",
    "nutrition":"<all nutrition with values>"
    "ingredients": {
      "list": "<ingredientsList>"  //an array of ingredients
    },
    "EAN":"<EAN number used for search>"
  }
  -Dont hallucinate and generate wrong output and consider whats given`
    const aiResp = await gem(findfromEan);
    const its=await parsing(aiResp)
    //console.log(findfromEan)
    return its


  }
  const product = response.products?.[0];
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
    },
    EAN:num
  };
}
//------------Processing barcode look response to get ingredients and nutrion values of product----------------//

const keys=[process.env.harshit_key,process.env.vivek_key,process.env.Deepak_key,process.env.as_key]
const barcodelookup=async(num)=>{
           const randomkey = Math.floor(Math.random() * 4);
           const keyz=keys[randomkey]
           console.log("Barcodelookup key used")
           let taker="https://api.barcodelookup.com/v3/products?barcode="+`${num}`+`&formatted=y&key=${process.env.tarun}`;
           try{
            responser =await axios.get(taker) 
            k=processProductData(responser.data,num)
            console.log("Fetched from barcodelookup")

           }catch(err){
            j={error:"Failed to fetch from barcodelookup-api limit reached or invalid EAN"}
            console.log("nothing found from barcodelookup")
            k=processProductData(j,num)

           }
          
           //console.log(taker)
           //console.log(responser.data)
                
           return k
  }
  


//-----------------------------------------------------------------------------------------------------------//

const { db } = require("./firebase");
const { title } = require("process");


let uid=""
let userPreferences={}
//------------Wifiverification middleware for esp32cam----------------//

const wifiverify = async function (req, res, next) {
  const wifiPassword = req.query.wifiid || req.body.wifiid;
  console.log(wifiPassword)
  if (!wifiPassword) {
   
    return res.json({
      message1: 'Wifi verification in progress..',
      message2: 'Fetching details from database',
      message3: 'matching wifiid with database records..',
      message4: 'Sending Response from server..',
      final: {title:"Error Occured", status:"error", alerts:[{desc:"Wifiid verification failed the password is required", flag:"not safe"}]},
    });
  }

  try {
    const deviceSnapshot = await db.collection("device")
      .where("wifiPassword", "==", wifiPassword)
      .get();

    if (deviceSnapshot.empty) {
      return res.json({
      message1: 'Wifi verification in progress..',
      message2: 'Fetching details from database',
      message3: 'matching wifiid with database records..',
      message4: 'Sending Response from server..',
      final: {title:"Error Occured", status:"error", alerts:[{desc:"User with given wifiid not found!", flag:"not safe"}]},
    });
    }

    const deviceDoc = deviceSnapshot.docs[0];
    const foundUid = deviceDoc.id;
    uid = foundUid;
    console.log("found uid: " + foundUid)

    const prefsSnapshot = await db.collection("preferences")
      .where("uid", "==", foundUid)
      .get();

    if (prefsSnapshot.empty) {
      req.uid = foundUid;
      req.userPreferences = {};
      console.log("no preferences found, using empty object");
      return next();
    }

    const normalized = (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (/^\[.*\]$/.test(trimmed)) {
          try {
            return JSON.parse(trimmed);
          } catch (_) {}
        }
        if (!Number.isNaN(Number(trimmed))) {
          return Number(trimmed);
        }
        if (trimmed.includes(",")) {
          return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
        }
      }
      return value;
    };

    const combinedPrefs = {};
    prefsSnapshot.docs.forEach((docSnap) => {
      const pref = docSnap.data();
      if (!pref.name || pref.amount === undefined) return;

      const key = pref.name;
      combinedPrefs[key] = normalized(pref.amount);
    });

    req.uid = foundUid;
    req.userPreferences = combinedPrefs;
    console.log("combined preferences:", combinedPrefs);
    next();
  } catch (err) {
    console.error("Firestore error:", err);
    message="Internal server error"
    return res.json({
      message1: 'Wifi verification in progress..',
      message2: 'Fetching details from database',
      message3: 'matching wifiid with database records..',
      message4: 'Sending Response from server..',
      final: {title:"Error Occured", status:"error", alerts:[{desc:`Firestore error:${err}`, flag:"not safe"}]},
    });
  }
};


//------------open testing frontend route not meant to be accessed----------------//

app.get('/',async(req,res)=>{
    
    await axios.get("https://barcodedecoder.onrender.com")
    
    res.render("index", { EanNum,message});

})
//------------open api checking route not meant to be accessed----------------//  
//--------------------checking--------------//
app.get('/faker',async(req,res)=>{
  //z=await barcodelookup('8901595961443')
  //m=compareWithStandards(z,productStandard, userpref)

  ////console.log(z)
  //console.log(prompt)
  //res.status(200).json({ received: m})

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
//middleware:-wifiverify
// upar ensure: app.use(express.json());

app.post('/NoBarcode',wifiverify, async (req, res) => {
  try {
    const { gemini_response, gemini_json, wifiid } = req.body;
          console.log("You are inside No Barcode")
    if (!gemini_response && !gemini_json) {
      console.log("Nothing gemini respone and json")
      return res.status(500).json({
      message1: 'Trying to Decode NoBarcode image to get product data',
      message2: 'Fetching user preferences from database',
      message3: 'Trying to pass the result to gemini and Finalizing response...',
      message4: "Nothing gemini respone and json",
      final: {title:"Error Occured", status:"error", alerts:[{desc:"Nothing recieved no gemini respone and json", flag:"not safe"}]},
    });
      
    }

    let productInfo;
    if (gemini_json) {
      productInfo = gemini_json;
    } else {
      try {
        productInfo = JSON.parse(gemini_response);
      } catch {
        productInfo = { raw_text: gemini_response };
      }
    }


    console.log(req.body);
    console.log(productInfo);

    const final_Decision = await compareWithStandards(productInfo,productStandard,req.userPreferences);
    console.log(final_Decision);
    return res.json({
      message1: 'Decoding NoBarcode image to get product data',
      message2: 'Fetching user preferences from database',
      message3: 'Passing the result to gemini and Finalizing response...',
      message4: 'Sending Response from server..',
      final: final_Decision,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message1: 'Trying to Decode NoBarcode image to get product data',
      message2: 'Fetching user preferences from database',
      message3: 'Trying to pass the result to gemini and Finalizing response...',
      message4: `${err}`,
      final: {title:"Error Occured", status:"error", alerts:[{desc:"Failed to process the data. Please try again.", flag:"not safe"}]},
    });
  }
});
app.get('/nutri',wifiverify ,async (req, res) => {
  const ean = req.query.ean;
  const wifiid = req.query.wifiid;
  console.log(ean)
  console.log(uid)
  console.log("You are inside nutri")
  
  /*
  try {
    
    const userDocRef = doc(db, "neutriData", uid); // xyz = your scan/data collection
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      message= "No data found for this user"
      return res.status(404).json({ message: "No data found for this user" });
    }

    const data = userDocSnap.data();
    console.log(data)
    

  } catch (err) {
    console.error("Error fetching user data about userpreference", err);
    res.status(500).json({ message: "Server error" });
  } */
  try {
    z=await barcodelookup(`${ean}`)
    console.log(z)
    final_Decision=await compareWithStandards(z,productStandard,req.userPreferences)
    console.log(final_Decision)
    res.json({
      message1:"Fetching product info using EAN from Barcodelookup",
      message2:"Fetching user preferences from database",
      message3:"Passing the result to gemini and Finalizing response...",
      message4:"Sending Response from server..",
      final:final_Decision,
     
    })
  }
  catch (err) {
    res.json({
      message1: 'Trying to fetch product info using EAN from Barcodelookup',
      message2: 'Fetching user preferences from database',
      message3: 'Trying to pass the result to gemini and Finalizing response...',
      message4: `${err}`,
      final: {title:"Error Occured", status:"error", alerts:[{desc:"Failed to process the data. Please try again.", flag:"not safe"}]},
    })
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
