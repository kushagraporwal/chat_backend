const mongoose = require('mongoose');
const schema = mongoose.Schema;

const messageinfo = new schema({
    sender:{
        type: schema.Types.ObjectId,
        ref: 'User'
    },
    reciever:{
        type: schema.Types.ObjectId,
        ref: 'User'
    },
    del:{
        type:Boolean
    },
   message:
       {
           type:String
       },
    date:
    {
        type:String
    },
    time:{
        type:String
    }
});
module.exports = mongoose.model('Messageinfo', messageinfo);