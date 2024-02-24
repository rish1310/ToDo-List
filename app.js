import express from "express";
import mongoose from "mongoose";
import _ from "lodash";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3000;

const getDate = () => {   //function to get date in a specific format
    const today = new Date();
    const options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };
    return today.toLocaleDateString("en-US", options);
}

app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));


mongoose.connect(process.env.MONGODBURI);

const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Welcome to your ToDoList!" });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-- Hit this to delete an item." });
const defaultItems = [item1, item2, item3];


const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);



app.get("/", async (req, res) => {
    let list = await Item.find({});
    if (list.length === 0) {
        await Item.insertMany(defaultItems);
    }
    list = await Item.find({});
    res.render("list.ejs", { listTitle: getDate(), newList: list });
});


app.post("/", async (req, res) => {
    const newItem = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({ name: newItem });
    if (listName === getDate()) {
        item.save();
        res.redirect("/");
    } else {
        const foundList = await List.findOne({ name: listName });
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
    }
});

app.post("/delete", async (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === getDate()) {
        await Item.deleteOne({ _id: checkedItemId });
        console.log("Item deleted successfully.");
        res.redirect("/");
    } else {
        await List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } }
        );
        res.redirect("/" + listName);
    }
});

app.get("/:listName", async (req, res) => {
    const customListName = _.capitalize(req.params.listName);
    const foundList = await List.findOne({ name: customListName });
    if (foundList) {
        res.render("list.ejs", { listTitle: customListName, newList: foundList.items });
    } else {
        const list = new List({
            name: customListName,
            items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
    }
});

app.get("/about", (req, res) => {
    res.render("about.ejs");
});

app.listen(process.env.PORT || port, () => {
    console.log(`Server started on port ${port}`);
}); 