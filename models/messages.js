const mongoose = require('mongoose');
const schema = mongoose.Schema;

const messages = new schema({
    user1:{
        type: schema.Types.ObjectId,
        ref: 'User'
    },
    user2:{
        type: schema.Types.ObjectId,
        ref: 'User'
    },
   message:[
       {
        type: schema.Types.ObjectId,
        ref: 'Messageinfo'
       }
   ],
});
module.exports = mongoose.model('Message', messages);