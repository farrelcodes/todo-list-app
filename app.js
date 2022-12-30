const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const URL = "mongodb+srv://farrel:Test123@cluster0.fi0dsoe.mongodb.net/todolistDB";

mongoose.set('strictQuery', false);
mongoose.connect(URL);

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "Welcome to your to-do list!" });
const item2 = new Item({ name: "Hit the + button to add a new item" });
const item3 = new Item({ name: "Hit the checkbox to delete an item" });

const defaultItems = [item1, item2, item3];

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listsSchema);

let isWebOpenedBefore = false;

app.get("/", function (req, res) {

  Item.find({}, function(err, items) {
    if (items.length === 0 && isWebOpenedBefore === false) {
      Item.insertMany(defaultItems, function(err, items) {
        if (err) console.log(err);
        else console.log("Succesfully inserted items to DB.");  
      });

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", items: items });
    }

    isWebOpenedBefore = true;
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const newItem = new Item({ name: itemName });

  if (listTitle === "Today") {
    newItem.save();
    setTimeout(function() {
      res.redirect("/")
    }, 500);  
  } else {
    List.findOne({name: listTitle}, function(err, result) {
      result.items.push(newItem);
      result.save();
      res.redirect("/" + listTitle);
    });
  }

});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName.trim();

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) console.log(err);
      else {
        console.log("Successfully deleted an item.");        
        res.redirect("/");  
      }
    })
  } else {
    List.findOneAndUpdate(
      { name: listName }, 
      { $pull: { items: {_id: checkedItemId }}},
      function(err, result) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    )
  }

});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      if (!result) {
        // Create a new list
        const list = new List({ name: customListName, items: defaultItems });
        list.save();
        setTimeout(function() {
          res.redirect("/" + customListName);
        }, 1000);
      } else {
        // Show existing list
        res.render("list", {listTitle: result.name, items: result.items});
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server is running on port 3000...");
});
