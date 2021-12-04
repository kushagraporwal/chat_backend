const express = require('express');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const methodoverride = require('method-override');
const session = require('express-session');
const dotenv= require("dotenv");
const passport = require('passport');
const localstrategy = require('passport-local');
const flash = require('connect-flash');
const User = require('./models/users');
const Message = require('./models/messages');
const Messageinfo = require('./models/messageinfo');
const { query } = require('express');
const cors= require('cors');
const expressAsyncHandler = require("express-async-handler");
const bodyParser = require("body-parser");
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');
var author;

// mongoose.connect('mongodb://localhost:27017/chat', {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false
// })
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, "connection error"));
// db.once("open", ()=>{
//     console.log("Database connected");
// });

dotenv.config({path: './config.env'});

const DB= process.env.DATABASE;
const port = process.env.PORT || 8000;

mongoose.connect(DB, {
         useNewUrlParser: true,
         useCreateIndex: true,
         useUnifiedTopology: true,
         useFindAndModify: false
     }).then(()=>{
    console.log('connection successful');
}).catch((err)=> console.log('no connection'));

 app.set('view engine', 'ejs');
 app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));
app.use(methodoverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

const sessionsonfig = {
    secret: 'thesecret',
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionsonfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) =>{
    res.locals.currentuser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
const isloggedin  = (req, res, next) =>{
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl
        // req.flash('error', 'You must be signed in first');
        // return res.redirect('/login');
        res.send("-2");
    }
    next();
}
app.get('/', (req, res) =>{
    res.render('home');
});
app.get('/login', (req, res) =>{
    res.render('login');
});
app.get('/register', (req, res) =>{
    res.render('register');
});

app.get('/:userid/announcements',  async(req, res) =>{
   const user= await User.findById(req.user._id);
   res.render('announcement', {user});
});
app.get('/:userid/info', isloggedin, async(req, res) =>{
   // res.send(req.user._id);
    const author1 = await User.findById(req.params.userid).populate('incoming_request').populate('connections');
    res.send(author1);
    //res.render('info', {author});
});
app.get('/:userid/chat/:otherid', isloggedin, async(req, res) =>{
    console.log('welcome to chat');
    res.locals.query = req.params.userid;
    const {userid, otherid} = req.params;
    console.log(userid);
    console.log('other id is');
    console.log(otherid);
    var conn = await Message.find({'user1': userid, 'user2': otherid}).populate({
        path: 'message',
        populate: {
            path: 'sender'
        }
    });
    if(conn.length == 0)
    conn = await Message.find({'user2': userid, 'user1': otherid}).populate({
        path: 'message',
        populate: {
            path: 'sender'
        }
    });
    // res.send(conn[0].user1);
    const user1= await User.findById(req.params.userid);
    const username1= user1.username;
    const user2= await User.findById(req.params.otherid);
    const username2= user2.username;
    const identify= req.user._id;
    console.log(res.locals.query);
    res.send(conn[0], username1, username2);
});
app.get('/:userid/message/:otherid', isloggedin, async(req, res) =>{
    const {userid, otherid} = req.params;
    var conn = await Message.find({'user1': userid, 'user2': otherid}).populate({
        path: 'message',
        populate: {
            path: 'sender'
        }
    });
    if(conn.length == 0)
    conn = await Message.find({'user2': userid, 'user1': otherid}).populate({
        path: 'message',
        populate: {
            path: 'sender'
        }
    });
    // res.send(conn[0].user1);
   
   var message1= new Array();
   console.log('message info');
   for(let mess in conn[0].message)
   {
       //console.log(conn[0].message[mess].message);
       try{
           if(conn[0].message[mess].del==false)
       message1.push(cryptr.decrypt(conn[0].message[mess].message));
       else
       message1.push(conn[0].message[mess].message);
       }
       catch(err)
       {
           console.log(err);
       }
   }
   
   console.log(message1);
    res.send(message1);
});
app.get('/:userid/detail/:otherid', isloggedin, async(req, res) =>{
    
    const user1= await User.findById(req.params.userid);
    const un1= user1.username;
    const user2= await User.findById(req.params.otherid);
    const un2= user2.username;
    console.log('username1 is');
    
    res.send({un1, un2});
});
app.get('/:userid/notifications', isloggedin, async(req, res) =>{
    
    const user1= await User.findById(req.params.userid);
    const anno=user1.announcements;
    console.log('announcements is');
    console.log(anno);
    res.send(user1);
});


app.post('/register',async(req, res) => {
    try{
        const {email, username, password}  = req.body;
        
        const user = new User({email, username});
        await User.register(user, password);
        res.status(201).json({message: "registeration done"});
        //req.flash('success', 'Welcome to camps');
        //res.redirect('/login');
        }
        catch(err){
            console.log('error');
            console.log(err);
            res.send("-8");
            //req.flash('error', err.message);
            //res.redirect('/register');
        }
});

app.get('/logout', async(req, res) =>{
    console.log('logout');
    req.logout();
   res.send('-1');
}); 

app.get('/wronguser', async(req, res) =>{
    res.send("-8");
});

app.post('/login',passport.authenticate('local', {failureFlash: false, failureRedirect: '/wronguser'}), async(req, res) =>{
    // const rediecturl = req.session.returnTo || '/info';
    // delete req.session.returnTo;
    //res.status(201).json({message: "Login done"});
//    req.flash('success', 'Welcome back');
    //res.redirect(`/${req.user._id}/info`);
    author = await User.findById(req.user._id);
    //req.user=author;
    res.send(author);

});
app.post('/sendconn', isloggedin,  async(req, res) =>{
    //console.log(author);
    const reqid = (req.body.finduser);
    const sentperson = await User.findById(author._id);
    const found = await User.find({'username': reqid});
    console.log(found[0]);
    if(found.length== 0)
    res.send("-8");
    else
    {
        found[0].incoming_request.push(sentperson);
        const announcement= `${sentperson.username} sent you a connection request.\n ${new Date().toLocaleDateString()}`;
        await found[0].save();
        found[0].announcements.push(announcement);
        await found[0].save();
        sentperson.outgoing_request.push(found[0]);
        await sentperson.save();
    req.flash('success', 'Requests sent successfully');
    res.send(sentperson);
    }
    //res.redirect(`/${sentperson._id}/info`);
});
app.post('/:userid/chat/:otherid',isloggedin,  async(req, res) =>{
    console.log('welcome to the place');
   //res.locals.query = req.params.userid;
    const {userid, otherid} = req.params;
    var messageinfo;
    const encryptedString = cryptr.encrypt(req.body.message1);
    var today = new Date();
    var ti = today.getHours() + ":" + today.getMinutes();
    if(userid==req.user._id){
    messageinfo = new Messageinfo({'sender': req.user._id, 'reciever':otherid, 'del':false, 'message': encryptedString, 'date':new Date().toLocaleDateString(), 'time': ti});
    }else{
    messageinfo = new Messageinfo({'sender': req.user._id, 'reciever':userid, 'del':false, 'message': encryptedString, 'date':new Date().toLocaleDateString(), 'time': ti});}
    var conn = await Message.find({'user1': userid, 'user2': otherid});
    if(conn.length == 0)
    conn = await Message.find({'user2': userid, 'user1': otherid});
    await messageinfo.save();
    const doc = conn[0];
    doc.message.push(messageinfo);
    await doc.save();
    const send=await User.findById(userid);
    const rece=await User.findById(otherid);
    const announcement= `${send.username} sent you a message.\n ${new Date().toLocaleDateString()}`;
    rece.announcements.push(announcement);
    await rece.save();
    console.log(conn);
    res.send(conn[0]);
    //res.redirect(`/${messageinfo.sender}/chat/${messageinfo.reciever}`);
});
app.put('/:personid/connection', isloggedin,  async(req, res) =>{
    //console.log(req.user);
    const newfriend = await User.findById(req.params.personid);
    const author1 = await User.findById(author._id);
    const newconn = new Message({'user1': newfriend._id, 'user2': author1._id});
    const announcement= `${author1.username} accepted your connection request.\n ${new Date().toLocaleDateString()}`;
    newfriend.connections.push(author1);
    author1.connections.push(newfriend);
    await newfriend.save();
    await author1.save();
    await newconn.save();
    newfriend.announcements.push(announcement);
    await newfriend.save();
    console.log('connection is');
    console.log(newconn);
    await User.findByIdAndUpdate(author1._id, { $pull: {incoming_request: newfriend._id}});
    await User.findByIdAndUpdate(newfriend._id, { $pull: {outgoing_request: author1._id}});
    res.send(author1);
   // req.flash('success', 'Connection successfull');
    //res.redirect(`/${author._id}/info`);
});
app.patch('/:personid/connection', isloggedin, async(req, res) =>{
    const newfriend = await User.findById(req.params.personid);
    const author1 = await User.findById(author._id);
    await User.findByIdAndUpdate(author._id, { $pull: {incoming_request: newfriend._id}});
    await User.findByIdAndUpdate(newfriend._id, { $pull: {outgoing_request: author._id}});
    const announcement= `${author1.username} did not accept your connection request.\n ${new Date().toLocaleDateString()}`;
    newfriend.announcements.push(announcement);
    await newfriend.save();
    res.send(author1);
});
app.put('/:messageid/delete', isloggedin,  async(req, res) =>{
    console.log('Hello delete');
    console.log(req.params);
    const foundmessage= await Messageinfo.findByIdAndUpdate({'_id': req.params.messageid}, {$set: {'message': 'Message Deleted!!', 'del':true}});
    console.log('Deleted the message');
    res.send(foundmessage);
});
const port = process.env.PORT || 8000;
app.listen(port, () =>{
    console.log('Listening to port 8000')
});